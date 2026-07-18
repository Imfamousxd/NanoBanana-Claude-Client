#!/usr/bin/env python3
"""Watch generations/ for new .jpg files and auto-open each in Preview as it appears."""
import os
import subprocess
import time

WATCH = "generations"
poll_seconds = 2

if not os.path.isdir(WATCH):
    os.makedirs(WATCH, exist_ok=True)

seen = {f for f in os.listdir(WATCH) if f.endswith(".jpg")}
print(f"Watching {WATCH}/ ({len(seen)} existing .jpg files ignored)", flush=True)
print("Auto-opening new generations in Preview as they appear. Ctrl+C to stop.", flush=True)

try:
    while True:
        time.sleep(poll_seconds)
        current = {f for f in os.listdir(WATCH) if f.endswith(".jpg")}
        new = sorted(current - seen)
        for f in new:
            path = os.path.abspath(os.path.join(WATCH, f))
            subprocess.run(["open", "-a", "Preview", path])
            print(f"→ {f}", flush=True)
        seen = current
except KeyboardInterrupt:
    print("\nWatcher stopped.", flush=True)
