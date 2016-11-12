#!/usr/bin/env python
# Renders Full Image
from PIL import Image
full_image = Image.new('RGB', (1296, 784), "black")  # create a new black image
pixels = full_image.load()  # create the pixel map
for x in range(81):    # for every pixel:
    for y in range(49):
        file_name = str(x) + "x" + str(y)
        image = Image.open('images/' + str(x) + "x" + str(y) + ".png")
        full_image.paste(image, (x * 16, y * 16))
full_image.save("images/background.png")
