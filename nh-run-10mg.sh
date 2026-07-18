#!/bin/bash
# Run the remaining Noble Harbor 10mg dose sets as 4 parallel chunks, then file into <Product>/10mg/.
set -e
cd "$(dirname "$0")"

echo "=== STEP 1: 4 parallel nanobanana batches (216 imgs) — $(date) ==="
OUTPUT_DIR=nh-outputs-10mg node nanobanana.mjs --batch nh-10mg-chunk1.json > nh-10mg-chunk1.log 2>&1 &
P1=$!
OUTPUT_DIR=nh-outputs-10mg node nanobanana.mjs --batch nh-10mg-chunk2.json > nh-10mg-chunk2.log 2>&1 &
P2=$!
OUTPUT_DIR=nh-outputs-10mg node nanobanana.mjs --batch nh-10mg-chunk3.json > nh-10mg-chunk3.log 2>&1 &
P3=$!
OUTPUT_DIR=nh-outputs-10mg node nanobanana.mjs --batch nh-10mg-chunk4.json > nh-10mg-chunk4.log 2>&1 &
P4=$!
echo "Spawned chunk pids: $P1 $P2 $P3 $P4"
wait $P1 $P2 $P3 $P4
echo "All 4 chunks done — $(date)"

echo
echo "=== STEP 2: file outputs into <Product>/10mg/<stem>_10mg_<size>_<color>.jpg — $(date) ==="
node nh-rename-10mg.mjs nh-10mg-remaining.json

echo
echo "=== ALL DONE — $(date) ==="
