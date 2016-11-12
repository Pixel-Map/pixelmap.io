#!/usr/bin/env python
from render_tile import render_tile

# For every tile at X, Y
for x in range(81):
    for y in range(49):
        render_tile(x, y)
