#!/bin/bash
# Re-roll the 297 3ml-dark variants + 1 AlphaKlotho LR_5ml_pink fix using the new
# wide-wrap baseline + tightened prompts. Chained: 4 parallel batches → rename → QC.
set -e
cd "$(dirname "$0")"

echo "=== STEP 1: 4 parallel rewrap batches — $(date) ==="
OUTPUT_DIR=nh-outputs node nanobanana.mjs --batch nh-rewrap-chunk1.json > nh-rewrap-chunk1.log 2>&1 &
P1=$!
OUTPUT_DIR=nh-outputs node nanobanana.mjs --batch nh-rewrap-chunk2.json > nh-rewrap-chunk2.log 2>&1 &
P2=$!
OUTPUT_DIR=nh-outputs node nanobanana.mjs --batch nh-rewrap-chunk3.json > nh-rewrap-chunk3.log 2>&1 &
P3=$!
OUTPUT_DIR=nh-outputs node nanobanana.mjs --batch nh-rewrap-chunk4.json > nh-rewrap-chunk4.log 2>&1 &
P4=$!
echo "Spawned chunks pid: $P1 $P2 $P3 $P4"
wait $P1 $P2 $P3 $P4
echo "All 4 rewrap chunks done — $(date)"

echo
echo "=== STEP 2: rename + move outputs into peptide top-level (overwrite) — $(date) ==="
node nh-rename-rewrap.mjs nh-rewrap.json

echo
echo "=== STEP 3: QC the 298 rewrap files via Gemini Vision — $(date) ==="
node nh-qc.mjs --paths nh-rewrap-paths.txt

echo
echo "=== ALL DONE — $(date) ==="
