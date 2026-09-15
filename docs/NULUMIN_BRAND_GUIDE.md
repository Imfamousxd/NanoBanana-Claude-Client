# NuLumin — brand guide for a new designer

For someone who has this repo and needs their graphics to sit next to ours without looking like a
different brand. You do **not** need to read the whole repo. This is the short path.

The design system is already written down and machine-readable. Your job is to use it, not to
re-derive it. Almost every rule below cost a rejected round.

---

## 1. Read these four, in this order

| # | File | Why |
|---|---|---|
| 1 | `knowledge/brands/nulumin/AD_SYSTEM.md` | The layout law, the three approved formats, and the rejection history. **This is the most important file in the repo for you.** |
| 2 | `knowledge/brands/nulumin/design-system.json` | Every colour, type and disclosure token. Two palettes — see §3. |
| 3 | `knowledge/brands/nulumin/catalog.json` | Per-compound category, accent, and the cap/cake language to pin in prompts. |
| 4 | `knowledge/brands/nulumin/selling-points.json` | The only copy you may claim, each tied to a claim record. |

`HERO_PROMPTS.md` when you need a new product scene. `Brand Context/NuLumin_BioSciences.md` for
brand narrative, logo and label rules.

## 2. Render something on-brand before you design anything

You can produce a finished, correct ad with no API key and no design decisions:

```bash
npm install
npm run doctor
npm run content -- brandkit fonts nulumin          # one-time, bundles the 4 webfonts offline
npm run content -- brandkit ad nulumin single --compound ghkcu --variant base
```

Add `--ratio 9:16,4:5,1:1` for the full placement set. Do this first — it is faster than reading,
and it shows you the target. Then open `engine/brandkit/nulumin-ads.mjs` to see how it is built.

**Build layouts in HTML/CSS rendered through headless Chrome. Only the photographic scene comes
from an image model.** Never ask an image model for copy, the logo, a COA, a QR code, or the RUO
line — it will hallucinate a claim into artwork you then have to catch. Never hand-paste pixels.

---

## 3. The two palettes are not interchangeable

This is the single easiest way to produce something that looks subtly wrong.

- **`surfaces.marketing`** — the live nulumin.org system. Use for **everything you will ever make**:
  ads, carousels, video overlays, web, email.
- **`surfaces.packaging`** — sampled from the printed vial-label PDFs. Softer and warmer. It exists
  **only** for label artwork.

Never mix one into the other. Category accents come from `catalog.json → categories[].accent`
(`#9B8FE8` tissue, `#5B9FF5` cellular, `#4DC97A` neural, `#F2C94C` metabolic, `#E86E8A` endocrine).

⚠️ If you sample a hex off one of our rendered product shots, **that is not authority** — the
renders drift, and several on disk are wrong. The JSON is authority. When a render disagrees with
the JSON, the render is the bug.

**Caps and cakes render wrong by default.** A cap comes back bare aluminium unless you pin it, and a
cake comes back white. Use the exact prompt strings in `catalog.json → capColors` / `cakeColors`.
GHK-Cu is the one that must be corrected every single time: its cake is **bluish-violet**, because
it is a copper peptide. And any cake is one **smooth, intact, flat-topped pressed disc** — never
loose powder, and never cracked. Cracking is a lyophilisation defect; do not prompt for it as a
realism cue.

---

## 4. The invariant spine

Every format carries the same order top-to-bottom. Rearranging it is what makes a creative stop
reading as NuLumin. It is written out in `AD_SYSTEM.md` §2 — learn it there.

The parts that catch people out:

- **Exactly three selling points.** Not two, not five. Ticks, never bullets or numerals.
- **The label is sacred.** Nothing crosses, veils or overlaps the vial's label — no scrim, no
  headline, no glow.
- **The RUO line is on screen at full legibility**, rendered deterministically, for the whole
  duration on video. Exact string: `For Research Use Only. Not for Human Consumption.`
- **Headlines name a biological axis or a verifiable fact.** Never a benefit, never an outcome.
- **Never write the word "stack."** It is bodybuilding vernacular implying a personal regimen —
  precisely the human-use signal a policy reviewer looks for. Say *panel*, *series* or *group*.

**Type.** Fraunces 300–400 for headings, sentence case, **ending in a period** — never bold, never
Title Case. Clause one roman, clause two italic filled with the spectrum gradient. Space Grotesk for
tracked uppercase eyebrows, JetBrains Mono for data and proof chips, Inter for body. A dark
Montserrat token set exists in older files; it is dead — do not revive it.

---

## 5. Video

Always 9:16. Start from an approved still, and keep every word on an HTML layer above the clip —
Seedance garbles any text you ask it to animate.

Our current spot structure is a three-beat build, because **static type on a moving scene was
rejected**:

| time | beat |
|---|---|
| 0.0–0.5s | near-black, heavy defocus — the product is deliberately unreadable |
| 0.5–1.9s | the scene resolves, the vial materialises into focus |
| 2.0–4.2s | the type focus-ins, staggered logo → eyebrow → headline → clause → chips → RUO |
| 4.2s–end | settled and held |

Reference implementation: `nulumin-v3-reveal.mjs` (copy and accents live in the `SPOTS` map at the
top). Approved example: `NuLumin Video Ads/clips-v3/GHK_suspension_APPROVED.mp4`.

Four rules that each cost a round:

1. **Type motion is a blur→sharp focus-in** with letter-spacing tightening and a small scale settle.
   No slide, no shine — an ffmpeg rise+fade+shine overlay was rejected as "PowerPoint."
2. **Render type frames 1:1 with the clip's fps.** Rendering at 12fps and letting ffmpeg duplicate
   up to 24 makes the settle look steppy.
3. **Ease with smootherstep, not `easeOutCubic`.** Cubic has a hard edge at the start of each
   element's curve that lands as a pop. Let opacity lead and blur trail on its own curve.
4. **Tell Seedance the camera is locked off** — "no push-in, no zoom, no dolly" — whenever type sits
   near the product. An unrequested push-in grew the vial into the copy on our first spot.

`gblur` sigma cannot vary with time, which is why the defocus reveal is a pre-blurred darkened copy
overlaid and alpha-faded out to uncover the sharp layer beneath.

---

## 6. Carousels

Nine posts, four slides each: a cover plus three teaching slides, no closing card (it was the most
repetitive card in the set). One colour theme per post so nine posts do not look like nine versions
of one post. Live example: `NuLumin Creatives/Carousels Light/`, generator `nulumin_carousels.py`,
captions in that folder's `CAPTIONS.md`.

The product photograph **is** the slide — full-bleed colour field, copy sitting in the empty half of
the photograph. Two things already tried and rejected: type on white (generic), and the photo inside
a rounded panel (the panel fill never matches the photograph's own field, so every slide showed a
seam). Teaching devices — chromatogram, peptide chain, stamped document — are **drawn in CSS**, so
they are crisp at any size, free, and cannot hallucinate a claim.

---

## 7. Voice

Sell the paperwork, not the molecule. Headlines are 2–6 words, sentence case, ending in a period —
"Put it in writing." / "Trace it back." / "This vial, documented."

Subheads run one long sentence pivoting on an em dash into a "not X" sting: *"— a standing
specification, not a target."* Second person and pointed. First-person plural unhedged. Numbers
always specific. Competitors framed but **never named**. CTAs are verb + *the* + noun — "Browse the
catalog", "See the lab results" — *the*, not *our*.

Always "31 research peptides." Never 32, never 36.

---

## 8. Compliance — the part that is not a style preference

These products are research-use-only. FDA cites social posts, including likes of testimonials, in
warning letters. This is the one section where "it looked better" is not a valid reason.

**Never:** depict or imply human use, consumption, injection, reconstitution, dosing or protocols ·
invent efficacy, safety, purity, certification, lab or outcome claims · use before/after or personal
results · name a competitor · imply a benefit.

**Only claim what has a record.** `selling-points.json` ties each point to one; anything not in there
needs approval before it ships. `≥99% HPLC` is a **specification**, never a measured figure for a
given lot.

**Organic vs paid is a compliance decision, not a placement decision.** Strip every commerce signal
for organic — no price, discount code, affiliate link, "link in bio," or DM-to-order. Read
`knowledge/compliance/NULUMIN_TIKTOK_PLAYBOOK.md` before anything goes to TikTok; a product-hero
post from a brand account is the pattern enforcement actually hits, and the account bio is the ban
vector more than the video is.

A qualified human owns final legal, medical, platform and brand approval. Automated review is
advisory only.

---

## 9. Gotchas that will cost you an afternoon

- **Gradient text with `line-height` < 1.0 clips italic descenders into stubs** —
  `background-clip:text` paints only inside the element box. Fix with
  `padding-bottom:.16em; margin-bottom:-.16em`. (Live example of the bug: the clipped `f` in
  "certificate of analysis." on `Carousels Light/01_coa/slide_1.png`.)
- **Any text filled via `background-clip:text` must also set `text-shadow:none`** — an inherited
  parent shadow shows through the transparent glyphs and flattens the gradient to flat grey.
- **The source logo PNG is a 6667×6667 canvas** with the wordmark filling ~31% of the height. A raw
  CSS `height` renders it ~3× too small. Trim to the content bbox, then size. `engine/brandkit` does
  this and caches it.
- **Base64-inline the fonts.** A Google Fonts `@import` inside a headless screenshot is a race — it
  renders in Times often enough to poison a batch. `brandkit fonts` bundles them offline.
- **Chrome needs a disposable `--user-data-dir` per launch**, plus a timeout and a kill fallback.
  Sharing the default profile deadlocks on the profile lock. Chrome also hangs on teardown *after*
  writing the screenshot, so the timeout is the exit path — verify the PNG, never trust the exit code.
- **`--force-device-scale-factor=1` with an explicit `--window-size`**, or a retina host silently
  doubles your output and the deliverable is the wrong size.
- **One vial per generation.** Three vials in one render produced label drift — blue wordmark,
  missing rules, no fine-print box. Generate singly and compose.
- **Brief vial placement as a horizontal centre-line rule**, never as a percentage. "Upper 42%
  empty" came back as 34%; the centre-line instruction is the only one that has held.
- **Compose geometry at build time, never with CSS `transform`** — it drifts across aspect ratios.
- **This repo lives on an iCloud-synced Desktop and most files are evicted.** Reads of cold files run
  at ~150KB/s. Work in a local temp dir and copy finished output back. Never render animation frames
  into the repo — iCloud can evict them mid-job and ffmpeg then stalls silently on the first missing
  frame.

---

## 10. Before you ship

1. Prove text legibility on the still, at thumbnail size, before animating anything.
2. Confirm every selling point maps to an approved claim record.
3. Confirm the RUO line is legible in the final pixels — not merely present in the source.
4. Confirm every CTA and QR destination resolves to what the caption says.
5. Confirm you have not regressed anything in `AD_SYSTEM.md` §4.
6. Get a qualified human to approve it.

Ask before inventing a new format. The rejection history in `AD_SYSTEM.md` §4 exists because most
good-looking ideas here have already been tried once.
