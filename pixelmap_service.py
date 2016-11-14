#!/usr/bin/env python
from functions import (get_contract, render_full_image)
import gevent
import random
from render_tile import render_tile
from render_html import render_html
from render_all_tiles import render_all_tiles
# Connect to Servers
contract = get_contract()

# Refresh all
print "Re-rendering everything, that way we don't miss anything!"
render_all_tiles()
render_full_image()
render_html()

# Starting Listener
print "Starting Listener"


def new_transaction_callback(transaction_hash):
    x = transaction_hash['args']['x']
    y = transaction_hash['args']['y']
    print "Transaction Spotted! Updating: " + str(x) + "x" + str(y)
    render_tile(x=x, y=y)
    render_full_image()
    render_html()

filter = contract.on('TileUpdated', {}, new_transaction_callback)
print("Watching patiently for transactions...")

while True:
    gevent.sleep(random.random())


filter.stop_watching(130)
