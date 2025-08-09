#!/bin/bash

# Load environment variables from .env file
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# Run the regeneration script
go run cmd/regenerate-tiles/main.go

echo "Done! Don't forget to sync to S3"