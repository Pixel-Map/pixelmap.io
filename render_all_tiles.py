#!/usr/bin/env python
from render_tile import render_tile


# For every tile at X, Y
def render_all_tiles():
    for i in range(3969):
        render_tile(i)


render_all_tiles()
