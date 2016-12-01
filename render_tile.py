#!/usr/bin/env python
from PIL import Image
from functions import (chunk_str, get_position, double_mult, hex_to_rgb,
                       connect_redis, get_contract, get_default_url,
                       get_default_tile, get_for_sale_tile)
import time


def render_tile(location):
    # Connect to Redis and Blockchain
    redis_server = connect_redis()
    contract = get_contract()

    # Get Tile Data
    try:
        tile = contract.call().getTile(location)
    except:
        print "Can't connect to Parity, or !synced to block #2641527. Waiting \
        5 seconds..."
        tile = False
    while not tile:
        try:
            tile = contract.call().getTile(location)
        except:
            time.sleep(5)
            print "Can't connect to Parity, or !synced to block #2641527. \
            Waiting 5 seconds..."
            tile = False

    owner = tile[0]
    url = tile[2]
    image = tile[1]
    price = tile[3]
    tile_name = str(location)
    print "Rendering " + tile_name + "..."
    # Defaults if data not set.
    if not url:
        url = get_default_url()
    if not image:
        image = get_default_tile(owner)
    if (price != 0):
        image = get_for_sale_tile()
    # Update Redis Data
    redis_server.hmset(tile_name, {'owner': owner, 'url': url})

    # Render Image from Image Data.  Every 3 char. represents 1 pixel.
    rgb_image_data = []
    for pixel in chunk_str(image, 3):
        rgb_image_data.append(hex_to_rgb(double_mult(pixel)))

    # Start with Black Image
    rendered_image = Image.new('RGB', (16, 16), "black")
    pixels = rendered_image.load()

    # For every pixel in image:
    for i in range(rendered_image.size[0]):
        for j in range(rendered_image.size[1]):
            pixel = rgb_image_data[get_position(i, j)]
            pixels[i, j] = (pixel[0], pixel[1], pixel[2])

    # Save Tile
    rendered_image.save('tiles/' + tile_name + ".png")
