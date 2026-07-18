#!/bin/bash
# Re-roll the 41 smudge-flagged 10ml images (4 parallel chunks), re-file, then re-audit.
set -e
cd "$(dirname "$0")"
echo "=== audit-2 re-roll (41 imgs) — $(date) ==="
for i in 1 2 3 4; do
  OUTPUT_DIR=nh-outputs node nanobanana.mjs --batch nh-10ml-a2chunk$i.json > nh-10ml-a2chunk$i.log 2>&1 &
done
wait
echo "gen done — $(date)"
echo "=== re-file (overwrite flagged) ==="
node nh-rename-10ml.mjs nh-10ml-audit2.json
echo "=== re-audit full set ==="
python3 nh-verify-10ml.py
echo "=== DONE — $(date) ==="
