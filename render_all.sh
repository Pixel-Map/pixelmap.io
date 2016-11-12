#!/bin/bash
echo 'Rendering Tiles...'
render_all_tiles.py

echo "Rendering Full Background..."
render_full.py

echo "Rendering HTML..."
render_html.py

echo "Finished!"
