#!/bin/bash

# Make a call to your getAllDocs Netlify function
response=$(curl -s "${NETLIFY_FUNCTION_URL}/getAllDocs")
docs=$(echo "$response" | jq -c '.')

# Break documents into batches
batch_size=10
batches=$(echo "$docs" | jq -c --argjson bs $batch_size 'range(0; length; $bs) as $i | .[$i:$i+$bs]')

# Process each batch by calling your processDocs Netlify function
for batch in $(echo "$batches" | jq -c '.[]'); do
  response=$(curl -s -X POST -H "Content-Type: application/json" -d "{\"docs\": $batch, \"test\": false}" "${NETLIFY_FUNCTION_URL}/processDocs")
  echo "$response" | jq '.'
done