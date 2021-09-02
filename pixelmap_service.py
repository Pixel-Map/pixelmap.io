#!/usr/bin/env python
import random

import gevent

from functions import get_contract, render_full_image
from render_all_tiles import render_all_tiles
from render_html import render_html
from render_tile import render_tile

# Connect to Servers
contract = get_contract()

# Refresh all
print("Re-rendering everything, that way we don't miss anything!")
render_all_tiles()
render_full_image()
render_html()

# Starting Listener
print("Starting Listener")


def new_transaction_callback(transaction_hash):
    location = transaction_hash["args"]["location"]
    print("Transaction Spotted! Updating: " + str(location))
    render_tile(location)
    render_full_image()
    render_html()

