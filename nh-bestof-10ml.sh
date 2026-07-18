#!/bin/bash
# Best-of-N: generate 4 candidates per defect (4 parallel chunks), then file the cleanest.
set -e
cd "$(dirname "$0")"
rm -rf nh-bestof-out && mkdir -p nh-bestof-out
echo "=== best-of-N generation (56 candidates) — $(date) ==="
for i in 1 2 3 4; do
  OUTPUT_DIR=nh-bestof-out node nanobanana.mjs --batch nh-10ml-bochunk$i.json > nh-10ml-bochunk$i.log 2>&1 &
done
wait
echo "gen done — $(date)"
echo "=== select cleanest + file ==="
python3 nh-bestof-select.py
echo "=== DONE — $(date) ==="
