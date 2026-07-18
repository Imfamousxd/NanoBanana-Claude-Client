# Becca Boo Beauty × NuLumin (co-brand flyer)

**Becca Boo Beauty** is a customer/retailer of NuLumin research peptides. Deliverable: a
co-brand digital flyer announcing peptide availability. Required elements: customer (Becca Boo)
logo, "Peptides Available Now", NuLumin logo, "Get Started Today" CTA, peptide vial visuals.
Project folder: `Becca Boo Flyer/`. NuLumin brand rules: see `NuLumin_BioSciences.md`.

---

## 1. Brand identity

- **Becca Boo Beauty** = feminine **PURPLE WATERCOLOR** brand: calligraphy "Becca Boo" +
  tracked "BEAUTY" + purple butterfly & florals.
- Logo asset: `Becca Boo Flyer/assets/beccaboo_logo_clean.png` — white-keyed to transparent
  from the client's white-paper PNG.
- Co-brand hierarchy: **Becca Boo primary + NuLumin secondary**, joined by a divider, as a
  lockup at the TOP of the flyer. No logo at the bottom.

## 2. Locked visual rules (hard rules + why)

1. **Both logos go at the TOP as a co-brand lockup** (Becca Boo primary + NuLumin secondary +
   divider). NO logo at bottom.
2. **The watercolor background must flow through the WHOLE graphic** — the user HATED reserved
   white/cream bars.
3. **Headline typography:** BOLD, UPRIGHT, easy-to-read — NOT cursive/script, and NOT plain
   flat block-sans. Not too busy AND not too plain.
4. **Variants must differ in LAYOUT, not just background swaps.**
5. **Logos must be clearly visible and must not look pasted/sharp-edged** — gpt RENDERS the
   logos integrated (pass them as refs), which is why they don't read as pasted.
6. **Vial trio must be EQUAL SIZE** — all three vials the same height (user insisted). Use the
   prepared ref `gptimage/refs/vial_trio_equal.png`.
7. **The CTA button is composited in post — the ONLY exception to no-compositing.** Image
   models CANNOT render a crisp button no matter the prompt detail. Tell gpt to leave the
   lower-center OPEN (no button) so the composited button covers nothing; it covers gpt's
   baked-in pill if one appears anyway.
8. **The HTML/CSS→Chrome render pipeline was rejected for this deliverable** ("generic/
   terrible") — the client wants the image-model look. Don't retry it here.

Why these are locked: ~10 rejected iterations before the pipeline below finally worked.

## 3. Asset map

- `Becca Boo Flyer/assets/beccaboo_logo_clean.png` — transparent Becca Boo logo (ref input).
- `gptimage/refs/vial_trio_equal.png` — equal-height NuLumin vial trio (ref input).
- `Becca Boo Flyer/button_overlay.py` — CTA button compositor (post step).
- `Becca Boo Flyer/cutout_vials.py` — rembg via **Python API** (`from rembg import remove,
  new_session('isnet-general-use')`) — the rembg CLI was broken here (missing
  `click`/`filetype`/`watchdog`).
- `beccaboo-flyer-layouts.mjs` (repo root) — the good generation script: 5 distinct LAYOUTS,
  not bg-swaps. (Many sibling `beccaboo-flyer-*.mjs` scripts exist from the iteration history.)
- **Approved finals (2026-06-22)** in `Becca Boo Flyer/FINAL/`:
  - `BeccaBoo_Peptides_Centered.png` — symmetric layout, 1024×1536.
  - `BeccaBoo_Peptides_Editorial.png` — oversized headline, vials in the lower third, 1024×1536.

## 4. Campaigns / programs run

One deliverable: the co-brand digital flyer, iterated through ~10 rejections to two approved
1024×1536 finals (Centered + Editorial), shipped 2026-06-22. The locked pipeline below is the
reusable outcome for any future Becca Boo × NuLumin (or similar co-brand) piece.

## 5. Generation playbook

**LOCKED build pipeline (what finally worked):**
1. **Art = gpt-image-2 EDIT, quality `medium`, size `1024x1536`**, with 3 SMALL reference
   images: Becca Boo logo + NuLumin logo + the equal-size vial trio
   (`gptimage/refs/vial_trio_equal.png`).
2. gpt renders the logos integrated (as refs) — both logos top as the co-brand lockup;
   consistent watercolor background through the whole graphic; lower-center left OPEN for the
   button.
3. **Composite the CTA button in post** via `Becca Boo Flyer/button_overlay.py`: gold-gradient
   rounded button + dark-gold border + soft shadow + VECTOR arrow (Futura lacks the → glyph) +
   plum text.

**Hard constraints / gotchas:**
- **gpt-image-2 `high` quality is UNUSABLE in this environment** — every call times out
  (`UND_ERR_SOCKET` "other side closed", ~100s Cloudflare edge cut on the slow synchronous
  edit). **`medium` is the ceiling that completes (~40–55s).** For true high-res, only
  **Nano Banana 4K** works here — but the user explicitly wanted the gpt-2 look, so default to
  gpt-2 medium and reach for NB 4K only when genuine high-res is required.
- **Keep refs small (<400KB each)** and add retries — transient `fetch failed` is common.
- The OpenAI key hit a **billing hard limit** mid-session once (user raised it) — if calls
  start failing with billing errors, surface it instead of retrying blindly.
- rembg: use the Python API, not the CLI (see §3).
