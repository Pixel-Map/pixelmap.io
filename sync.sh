#!/bin/bash
aws s3 sync . s3://pixelmap.io --acl public-read --exclude="*" --include index.html --include "images/*" --include "css/*" --include "scripts/*" --include "large_tiles/*" --include "tiles/*"
