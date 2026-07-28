# 00 — THE ENGINE
The model back-ends, CLI tools, formats, and global rules that every brand playbook in this pack assumes.
(Repo: `NanoBanana-Claude-Client` — Node 20+, keys in `.env`: `OPENAI_API_KEY`, `GEMINI_API_KEY`, `REPLICATE_API_TOKEN`.)

## The four model back-ends

### 1. gpt-image-2 (OpenAI) — DEFAULT for images
- **Generate** (no refs): `POST /v1/images/generations`, JSON `{model:"gpt-image-2", prompt, size, quality, n}`.
- **Edit** (with refs): `POST /v1/images/edits`, multipart — one or more `image[]` parts (base + refs), optional `mask` (transparent = repaint). Per-call sizes `1024x1024`, `1024x1536`, `1536x1024`.
- CLI: `node gpt-image.mjs` (interactive) or `node gpt-image.mjs --batch <file>.json`. Friendly ratios map to high-res (`16:9`→3840×2160, `9:16`→2160×3840; 1:1 bumped to **2880×2880** max, 4:5 to **2560×3200** / 8.2MP).
- **Batch JSON format** (same file works for nanobanana.mjs): array of `{prompt, aspectRatio, imageSize, refImages}`. Batches ~3 min/slide — run in background.
- Strengths: text fidelity (labels, small print, badges), white studio packshots, editing one thing ("reproduce EXACTLY except …" with the approved image as first `image[]`).

### 2. Nano Banana Pro (Gemini `gemini-3-pro-image`) — reference fidelity at hero scale
- Reference images go in as `inline_data` parts **before** the text part. CLI: `node nanobanana.mjs` (interactive; also accepts the same batch JSON).
- **Switch to NB when** a logo/character/product reference must render pixel-faithful at hero scale — gpt-image-2 reinterprets references at large sizes; NB preserves geometry. Also NB 4K = the true high-res path when gpt-2 `high` times out.
- Weakness: garbles small label text — do a gpt-image-2 edit pass to fix text on an otherwise-approved NB render.

### 3. Veo 3.1 (Gemini) — video
- `node nanobanana-video.mjs` — submits `:predictLongRunning`, polls, downloads mp4. Text→video and image→video (`durationSeconds`, `aspectRatio`). Uses `GEMINI_API_KEY`.

### 4. Seedance 2.0 (ByteDance via Replicate) — the workhorse for campaign video
- **Exact slug: `bytedance/seedance-2.0`** (the dot matters; `seedance-2-pro`/`seedance-2` do NOT resolve). Others: `-2.0-fast`, `-1.5-pro`, `-1-pro`, `-1-pro-fast`, `-1-lite`. When in doubt query the Replicate `image-to-video` / `text-to-video` collections — never guess slugs.
- Input schema: `prompt`; `duration` (seconds, default 5, up to 12 works, `-1` = model picks); `resolution` `480p/720p/1080p` — **max IS 1080p, always use it**; `aspect_ratio` (`9:16` for reels, `adaptive` to match input image); `generate_audio` (default true — synthesizes synced audio; double-quotes in prompt = speech); `image` (first frame, image-to-video — **cannot combine with `reference_*`**); `last_frame_image` (only with a first frame); `reference_images` (≤9, character/style consistency — **downscale to ≤1024px or the API 504s**); `reference_audios` (≤3, ≤15s total, lip sync); `reference_videos` (≤3, ≤15s, motion transfer); `seed`.
- API pattern: `POST https://api.replicate.com/v1/models/bytedance/seedance-2.0/predictions` with `Prefer: wait=5`, then poll `urls.get` until `succeeded/failed/canceled`; video URL = `output` (string or first array element). Pass images as base64 data-URIs.
- Gotchas: Replicate account under ~$5 credit throttles to ~1 create/min → build in 429-retry + 20s staggered creates; `E005` sensitivity flags on phrasing like "two fingers … building tension" → rephrase neutrally ("a hand calmly enters and pauses"); printed text drifts → lock with "reproduce card text 1:1, letter-perfect, do not invent, warp or replace any text"; 12s clips need EXPLICIT timed beats ("Beat 1 (0-3s): …") or the runtime is wasted.

## Global generation rules (apply to every brand)
1. **One small self-contained `.mjs` script per job**; load `.env` at top; timestamped output names; save to the brand's project folder.
2. **Open every result for review** in Preview: `open -a Preview "<path>"` (user preference; if Preview crashes, Chrome one-file-at-a-time is the fallback). Open ALL candidates, not just one.
3. **Iterate by PROMPT, never by pixel-pushing. NEVER PIL/sharp-paste** a face/product/logo onto art to fake fidelity — regenerate with better prompts/refs. (Compositing a flat logo/QR/text plate onto a deliberately-reserved clean area is the ONLY allowed paste.) Note: **sharp (npm) hangs on this machine — use PIL for any legitimate image utility work.**
4. **2–3 candidates** for anything subjective; the user picks.
5. **Anchor with reference images** and name each reference's role in the prompt ("use ONLY the likeness from reference image 1"). Text-only prompts drift.
6. **Spell on-image text exactly**, letter by letter for risky words, plus a negative: "no other text, no misspellings, no invented text."
7. Long/expensive runs (video, big batches) → background them, report when done. Confirm scope (count, length, AR) before firing a video batch.
8. **Logo-zone language pitfalls (gpt-image-2):** never say "reserve an empty area"/"placeholder zone" (it draws a dashed box); for badges say "ONE single thick fully closed continuous band, NOT two concentric rings"; say the badge interior is "the SAME DARK CANVAS, not white-filled".
9. **Safety-filter phrasing (gpt-image-2 fitness/lifestyle):** avoid "sports bra" (→ "athletic crop top"), stacked anatomy ("torso and hips"), "intimate framing", "hips raised/lifted" — use neutral pose names ("low plank", "kneeling lunge"). Blocked prompt? Strip anatomy density and re-run; same composition almost always passes.
10. **Motion-blur spec (locked):** CAMERA-IN-MOTION blur — "directional motion blur permeates the ENTIRE frame", subject = relative anchor but not tack-sharp, background heavily smeared from the pan, slight Dutch tilt 5–8°, shutter ~1/30s, "NOTHING is rigorously tack-sharp". NOT single-limb blur on a sharp body.
11. **Video realism anchors:** name real cameras/lenses + real artifacts (halation, anamorphic bokeh, focus hunt, micro-shake, sensor flare) to kill the "AI look". **Real-time pacing only — no slow motion** unless a brand doc says otherwise; avoid "slow-shutter/long-exposure" wording in video prompts (it pushes slo-mo).
12. **"Shadow figure" means dim-lit photoreal human**, not a flat black silhouette cutout.
13. Wordmark/lettering style: **animated-cartoon title style (soft bubble caps), NOT glossy-candy photoreal text**, unless the brand doc overrides.

## HTML → PNG / PDF / email pipeline (campaign collateral)
- `email_campaigns/render.sh "<abs html>" "<abs out.png>" <W> <H> <bg_rgba> <pad>` → headless Chrome @2x + trailing-bg trim. **Preview 600px-wide emails at 640px window width** — 600 triggers the mobile breakpoint.
- PDF: Chrome `--headless --print-to-pdf` (preserves `<a href>` as clickable PDF links; **#fragment internal anchors are DROPPED** — use absolute web URLs in PDFs).
- Email engineering pattern (locked): table-only `role=presentation`, 600px container, inline CSS, `<!--[if mso]>` VML roundrect CTAs, hidden preheader, dark-mode meta, `.stack` mobile pattern. Every link must be functional — verify with curl before shipping; unsubscribe = mailto if no ESP URL exists.
- Email GIFs (Remotion, `email_campaigns/remotion/`): every frame must carry full content (Outlook shows frame 1); ambient motion only; scrolling tickers are GIF-hostile.
- Kits ship via a `build_dist.py`-style script: auto-detect referenced assets from the HTML (no manifests), optimize JPEGs, rewrite `assets/`→`images/`, zip with README + attachments.
