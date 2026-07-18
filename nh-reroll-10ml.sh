#!/bin/bash
# Re-roll the strict-flagged 10ml images (2 parallel chunks), re-file, then re-verify deterministically.
set -e
cd "$(dirname "$0")"
echo "=== re-roll 18 flagged — $(date) ==="
OUTPUT_DIR=nh-outputs node nanobanana.mjs --batch nh-10ml-strchunk1.json > nh-10ml-strchunk1.log 2>&1 &
P1=$!
OUTPUT_DIR=nh-outputs node nanobanana.mjs --batch nh-10ml-strchunk2.json > nh-10ml-strchunk2.log 2>&1 &
P2=$!
wait $P1 $P2
echo "gen done — $(date)"
echo "=== re-file (overwrite flagged) ==="
node nh-rename-10ml.mjs nh-10ml-strict.json
echo "=== re-verify full set ==="
python3 nh-verify-10ml.py
echo "=== DONE — $(date) ==="
