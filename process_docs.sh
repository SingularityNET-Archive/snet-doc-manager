#!/bin/bash

set -e

# Make a call to your getAllDocs Netlify function
response=$(curl -s "${NETLIFY_FUNCTION_URL}/getAllDocs")

# Check if the response is valid JSON
if ! echo "$response" | jq -e . >/dev/null 2>&1; then
  echo "Error: Invalid JSON response from getAllDocs function"
  exit 1
fi

docs=$(echo "$response" | jq -c '.')

# Break documents into batches
batch_size=10
batches=$(echo "$docs" | jq -c --argjson bs "$batch_size" 'range(0; length; $bs) as $i | .[$i:$i+$bs]')

# Process each batch by calling your processDocs Netlify function
while IFS= read -r batch; do
  response=$(curl -s -X POST -H "Content-Type: application/json" -d "{\"docs\": $batch, \"test\": false}" "${NETLIFY_FUNCTION_URL}/processDocs")
  
  # Check if the response is valid JSON
  if ! echo "$response" | jq -e . >/dev/null 2>&1; then
    echo "Error: Invalid JSON response from processDocs function"
    exit 1
  fi
  
  echo "$response" | jq '.'
done <<< "$batches"
