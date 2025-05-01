#!/bin/bash

# Monitor the frontend logs
echo "Monitoring frontend logs..."
echo "Press Ctrl+C to stop monitoring"

# Get the terminal ID of the frontend server
TERMINAL_ID=9

# Monitor the logs
while true; do
  # Read the logs
  logs=$(npx nx run frontend:serve:development 2>&1)
  
  # Print the logs
  echo "$logs"
  
  # Sleep for 1 second
  sleep 1
done
