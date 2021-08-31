#!/usr/bin/env python
import json
import time

from PIL import Image

from functions import (
    chunk_str,
    connect_redis,
    double_mult,
    get_contract,
    get_default_tile,
    get_default_url,
    get_for_sale_tile,
    get_position,
    hex_to_rgb,
)


def render_tile(location):
    # Connect to Redis and Blockchain
    redis_server = connect_redis()
    contract = get_contract()

    # Get Tile Data
    try:
        tile = contract.functions.tiles(location).call()
    except Exception as e:
        print(e)
        print(
            "Can't connect to Parity, or !synced to block #2641527. Waiting 5 seconds..."
        )
        tile = False
    while not tile:
        try:
            tile = contract.functions.tiles(location).call()
        except Exception as e:
            time.sleep(5)
            print(
                "Can't connect to Parity, or !synced to block #2641527. \
            Waiting 5 seconds..."
            )
            print(e)
            tile = False

    owner = tile[0]
    url = tile[2]
    image = tile[1]
    price = tile[3]
    tile_name = str(location)
    print("Rendering " + tile_name + "...")
    # Defaults if data not set.
    if not url:
        url = get_default_url()
    if not image:
        image = get_default_tile(owner)
    image = image.strip()
    if not len(image) == 768:
        image = get_default_tile(owner)
    if price != 0:
        image = get_for_sale_tile()
    
    # Update Redis Data
    redis_server.hmset(tile_name, {"owner": owner, "url": url})
    # Render Image from Image Data.  Every 3 char. represents 1 pixel.
    rgb_image_data = []
    for pixel in chunk_str(image, 3):
        rgb_image_data.append(hex_to_rgb(double_mult(pixel)))

    # Start with Black Image
    rendered_image = Image.new("RGB", (16, 16), "black")
    pixels = rendered_image.load()

    # For every pixel in image:
    for i in range(rendered_image.size[0]):
        for j in range(rendered_image.size[1]):
            pixel = rgb_image_data[get_position(i, j)]
            pixels[i, j] = (pixel[0], pixel[1], pixel[2])

    # Save Tile
    rendered_image.save("tiles/" + tile_name + ".png")

    # Make big tile for OpenSea
    big_tile = rendered_image.resize((350, 350), Image.NEAREST)
    big_tile.save("large_tiles/" + tile_name + ".png")

    data = {
        "description": "Official PixelMap (2016) Wrapper",
        "external_url": url,
        "image": f"https://pixelmap.io/large_tiles/{tile_name}.png",
        "name": f"Tile #{tile_name}",
    }

    with open(f"large_tiles/{tile_name}.json", "w") as outfile:
        json.dump(data, outfile, indent=4)
