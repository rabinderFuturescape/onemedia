#!/bin/bash

# Start a simple HTTP server
cd /app/var/docker/static
echo "Starting HTTP server on port 5000..."
python3 -m http.server 5000
