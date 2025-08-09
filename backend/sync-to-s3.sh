#!/bin/bash

# Load AWS credentials from .env if needed
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# S3 bucket name (from the Go code we saw)
BUCKET="pixelmap.art"

echo "Syncing cache directory to S3 bucket: $BUCKET"

# Sync the entire cache directory to S3
# --delete removes files from S3 that don't exist locally
# Remove --delete if you want to keep old files
aws s3 sync cache/ s3://$BUCKET/ \
  --exclude ".DS_Store" \
  --exclude "*.log"

echo "Sync complete!"

# Optionally, you can sync just specific directories:
# aws s3 sync cache/tile/ s3://$BUCKET/tile/
# aws s3 cp cache/tiledata.json s3://$BUCKET/tiledata.json