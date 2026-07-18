#!/bin/bash
# Run the Noble Harbor master batch end-to-end:
#   1. Generate 864 images via Nano Banana Pro (output → nh-outputs/)
#   2. Rename + move into Noble Harbor Wholesale/<Peptide>/v2/
#   3. QC all v2/ outputs against the new baseline using Gemini Vision
# All output goes to nh-master.log.
set -e
cd "$(dirname "$0")"

echo "=== STEP 1: nanobanana batch (864 jobs) — $(date) ==="
OUTPUT_DIR=nh-outputs node nanobanana.mjs --batch nh-master.json

echo
echo "=== STEP 2: rename + move outputs — $(date) ==="
node nh-rename-batch.mjs nh-master.json

echo
echo "=== STEP 3: QC all v2/ outputs via Gemini Vision — $(date) ==="
node nh-qc.mjs --all

echo
echo "=== ALL DONE — $(date) ==="
