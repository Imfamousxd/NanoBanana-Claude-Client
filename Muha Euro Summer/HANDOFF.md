# Muha Euro Summer — session handoff

**Goal this thread:** create a **transition clip to stitch AFTER `09_ticket_12`** (the clip the user likes).

## Project
Muha "$25,000 Europe Summer Trip" giveaway hype reel — a raffle-ticket reveal theme in a dark, cinematic film language, cut together from 12s vertical clips.

## Pipeline
- **Generator:** `eurosummer-clips.mjs` (repo root). Model **`bytedance/seedance-2.0`** via Replicate. **9:16, 1080p, audio ON**, dur default 5 / most clips `dur:12`. `REPLICATE_API_TOKEN` in `.env`. `Prefer: wait=5`, 8× 429-retry, concurrent gens staggered 20s.
- **Run:** `node eurosummer-clips.mjs <slug> [slug...]` (or `all`).
- **Output:** `Muha Euro Summer/Clips/<slug>.mp4` (auto-created). NOTE: prior-run mp4s are NOT in the repo — the user holds them locally.
- **Refs:** `Muha Euro Summer/refs/` — `ticket.jpg` (the $25k raffle-card back: antique Europe map, dashed flight routes, black-and-gold encrypted QR panel), city paintings `monaco/ibiza/santorini/mykonos.jpg`, and `front_*.jpg` (wide "EURO SUMMER" collectible cards).

## The anchor clip — `09_ticket_12` (12s)
DARK macro, top-down: a hand slides the $25k raffle card flat into the warm shaft of light → light blooms and ignites the gold "$25,000" lettering + black-and-gold QR panel → camera pushes straight down, **ENDING framed tight top-down on "$25,000 Europe Summer Trip" + the glowing gold QR panel.**
→ **That end frame is the stitch point.** Any follow-on clip should BEGIN there for a seamless continuation.

## Shared film language (the `DARK` constant in the script — reuse verbatim for continuity)
"Suspenseful cinematic macro on an ARRI Alexa with a 50mm macro lens, shallow DoF, moody near-dark room, one warm shaft of light across a dark walnut table, fine dust motes drifting in the beam, subtle handheld micro-shake, gentle lens halation, real-time pacing."

## Already-scripted "09-anchor sequels" (connectable 12s beats — each starts where the prior ended)
- `13_mapalive_12` — printed map comes alive: tiny plane glides the dashed route, landmarks glow, ends on glowing gold QR.
- `14_scan_12` — payoff: phone scans the gold QR → golden checkmark.
- `15_stacktoticket_12` — deal 2 EURO SUMMER cards, crown with the $25k ticket, gold ignites.
- `16_planepov_ibiza_12` — **THE transition**: one unbroken zoom, top-down on the printed map plane → push in → paper DISSOLVES into real aerial Mediterranean → POV descent/landing into Ibiza (refs: `ticket.jpg` + `ibiza.jpg`). Best "ticket → destination" device.

## RESOLVED (2026-07-07) — the "GoPro window reveal" sequel (approved direction)
The transition after `09` is built and working. Two discoveries changed the plan:
1. **`09`'s RENDERED end frame is NOT the scripted $25k/QR macro.** Seedance drifted `09` into a beautiful macro of a real-looking airliner flying low over the printed Europe map (Brandenburg Gate landmark, gold ticket panel top-right). That plane-over-map frame is the clip the user loves and the true stitch point.
2. **The user's rendered/liked mp4s live locally at `~/Movies/Muha Euro Summer/Clips/`** (e.g. `09_ticket_12.mp4`) — NOT in this repo's `Clips/`.

**Seamless-stitch technique (image-to-video):**
- `ffmpeg -y -sseof -0.5 -i "~/Movies/Muha Euro Summer/Clips/09_ticket_12.mp4" -update 1 -q:v 2 "Muha Euro Summer/Clips/_liked_endframe.jpg"` → the exact last frame (already saved as `_liked_endframe.jpg`).
- Feed that as Seedance 2.0's **first frame**: a clip with a `startFrame:` field sets `input.image` (which **cannot** combine with `reference_images`). Plumbing already added to `eurosummer-clips.mjs`.

**Approved concept — GoPro window reveal:** open on 09's end frame → macro morphs into a real airliner cabin → first-person passenger POV (as if a GoPro is strapped to the head, wide FOV, subtle head-bob) slowly turns to the oval window → golden-hour aerial landmark reveal. Built:
- `18_gopro_window_eiffel_12` — Paris / Eiffel Tower (camera flies *through* the glass into a full aerial at the end).
- `19_gopro_window_vienna_12` — St. Stephen's Cathedral (holds the oval-window POV throughout).
- `20_gopro_window_berlin_12` — Brandenburg Gate + quadriga + Fernsehturm (holds the window POV).
- (`17_ticket_to_paris_12` = earlier text-only ticket→Paris attempt, superseded by `18`.)

## To add another city
Copy clip `18`/`19`/`20` in the `CLIPS.push(...)` block, keep `startFrame: "Muha Euro Summer/Clips/_liked_endframe.jpg"` + `dur:12`, and rewrite only the **Beat 3** landmark (e.g. Prague / Rome / Amsterdam). Then `node eurosummer-clips.mjs <new_slug>`. To hold the window POV to the end (vs. Paris flying through the glass), phrase Beat 3 as "the camera drifts toward and **through** the window" only if you want the fly-through; omit "through" to stay inside the window.

## Gotchas
- Seedance drifts on printed text → prompts hard-lock "reproduce card text 1:1, no invented text, letter-perfect." Keep that.
- Vertical 9:16 only; real-time pacing (no slow-mo) is the house style.
- If throttled (429) it self-retries; long batches — run in background.
