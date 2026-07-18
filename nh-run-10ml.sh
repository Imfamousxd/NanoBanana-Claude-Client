#!/bin/bash
# Run the remaining Noble Harbor 10ml set as 4 parallel chunks, then file all 297 into folders.
set -e
cd "$(dirname "$0")"

echo "=== STEP 1: 4 parallel nanobanana batches (293 imgs) — $(date) ==="
OUTPUT_DIR=nh-outputs node nanobanana.mjs --batch nh-10ml-chunk1.json > nh-10ml-chunk1.log 2>&1 &
P1=$!
OUTPUT_DIR=nh-outputs node nanobanana.mjs --batch nh-10ml-chunk2.json > nh-10ml-chunk2.log 2>&1 &
P2=$!
OUTPUT_DIR=nh-outputs node nanobanana.mjs --batch nh-10ml-chunk3.json > nh-10ml-chunk3.log 2>&1 &
P3=$!
OUTPUT_DIR=nh-outputs node nanobanana.mjs --batch nh-10ml-chunk4.json > nh-10ml-chunk4.log 2>&1 &
P4=$!
echo "Spawned chunk pids: $P1 $P2 $P3 $P4"
wait $P1 $P2 $P3 $P4
echo "All 4 chunks done — $(date)"

echo
echo "=== STEP 2: rename + file all 297 outputs into <Product>/<Product>_10ml_<color>.jpg — $(date) ==="
node nh-rename-10ml.mjs nh-10ml-all.json

echo
echo "=== ALL DONE — $(date) ==="
