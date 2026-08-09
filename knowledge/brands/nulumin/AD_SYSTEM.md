# NuLumin ad system

The approved static-ad formats, the layout law behind them, and the rejection history that produced
each rule. Read this before designing a NuLumin creative. Every rule here cost a rejected round.

Tokens live in `design-system.json`. Compounds live in `catalog.json`. Copy lives in
`selling-points.json`. This document is the *reasoning*; those three are the *data*.

---

## 1. How these are built, and why not with an image model

A NuLumin ad is **two halves**:

| Half | Tool | Why |
|---|---|---|
| The **scene** — vial, light, atmosphere | Nano Banana Pro (`gemini-3-pro-image`) | Only a generative model produces photoreal glass, caustics and cryo vapour. See `HERO_PROMPTS.md`. |
| The **layout** — logo, headline, selling points, CTA, disclosure | HTML/CSS → headless Chrome | Exact copy, exact hexes, exact type. Free per render, seconds not minutes, and *incapable of hallucinating a claim into the artwork*. |

Never ask an image model to render the copy, the logo, a COA, a QR code, or the RUO line. Never
composite by hand-pasting pixels. The generator is `engine/brandkit/nulumin-ads.mjs`; run it with
`npm run content -- brandkit ad nulumin <format> ...`.

Sizes: `9:16` = 1080x1920, `4:5` = 1080x1350, `1:1` = 1080x1080. Vertical is the house format.

Scenes ship for `cryo`, `caustics` and `causticsblue` at 9:16 and 4:5 — exactly the render size, so
they are native resolution, not proxies. When a requested style/ratio has no scene, the dark formats
fall back to a CSS-drawn ground with the vial cutout composited on it. That is a real, on-brand
output, but it is a *fallback*: it carries no photographic set, and a `panel` rendered that way shows
only the first member's vial. Generate the scene before a panel creative ships.

---

## 2. The invariant spine

Every format, light or dark, carries this order top-to-bottom. Rearranging it is what makes a
creative stop reading as NuLumin:

```
spectrum band (7px, 5 segments, pinned to the top edge)
logo lockup
short eyebrow with accent tick bar
hook  — clause 1 roman, clause 2 italic + spectrum gradient, sentence case, ends in a period
three selling points  — ✓ ticks, never bullets, never numerals, never a middot frieze
the product, dominant and unobstructed
one CTA that asks for the click
the RUO disclosure
```

Hard constraints that apply to all formats:

- **Three selling points. Not two, not five.** Drawn from `selling-points.json`; each maps to a
  claim record that must be approved first.
- **The label is sacred.** Nothing crosses, veils, or overlaps the vial's label — not a scrim, not a
  headline, not a glow.
- **The RUO line is on screen at full legibility**, rendered deterministically, for the whole
  duration on video.
- **Never the word "stack."** It is bodybuilding vernacular implying a personal regimen — the exact
  human-use signal a policy reviewer looks for. Say *panel*, *series*, or *group*.
- **Headlines name a biological axis or a verifiable fact, never a benefit and never an outcome.**

---

## 3. The three approved formats

They are deliberately different *textures*, not re-skins. Round one of the panel creative was
rejected as "too similar to the single-peptide shots" precisely because it reused creative #1's
layout system with a new photo.

### `single` — light, editorial (creative #1)

The site's own page turned into an ad. Light snow ground with a soft accent radial, cream
announcement bar carrying the RUO line, copy stacked top-left, vertical tick-chip list, vial
right-anchored with an accent halo and an elliptical floor shadow, violet pill CTA bottom-left, dose
callout bottom-right, FDA long line centered at the foot.

- Product is **right-anchored** specifically so the left-hand chips never collide with it.
- Proof chips are JetBrains Mono with a smaller muted sublabel — reads as data, not as a slide.
- Client-approved 2026-07-27 in the `cryo` scene as `c1_ghkcu`.

### `panel` — dark, centered (creative #2)

The inverse of `single`. Dark indigo ground, product in the **upper middle**, copy block anchored at
the **bottom** and centered, selling points as a horizontal **3-column spec row** on hairline rules,
white pill CTA with an offer line beneath.

- The spec row reads as certificate data. A middot-separated frieze was tried first and rejected:
  on wrap it orphans a separator onto the next line, which looks like a bullet again.
- The eyebrow lists panel members factually (`KLOW BLEND · MOTS-C · NAD+`); the headline names the
  biological axis.
- Uses the `causticsblue` scene, not `cryo` — creative #1 owns cryo.

### `streak` — dark, direct-response

Built from the feedback that the earlier cut "looks like an educational feed post." Deliberately
removed: the lede paragraph, the category eyebrow, and the dose callout (the label already states
the dose). What remains is logo → one short hook → three loud selling points → dominant vial → one
CTA → disclosure.

- Selling points are Space Grotesk **uppercase at ~3x** the mono-chip size, on an accent left rule
  with an accent glow. Bold and on-brand, not tiny mono chips.
- Divider rules between points were **rejected by the client** — the accent rule and tick alone
  carry the structure.
- Dark formats get the premium finish: inset hairline frame, vignette, and SVG grain. Without them
  the layout reads as generic digital.

---

## 4. Rejection history — do not regress

| What was tried | Verdict | Rule it produced |
|---|---|---|
| Lightstreak background under the ad copy | "generic and boring" | Scenes must be ownable: `cryo` or `caustics`. |
| `chromatogram` scene (glowing spectral peaks) | rejected twice | The vial and label read badly against luminous curves at any lighting. Dropped. |
| `inkbloom` and `powderburst` scenes | rejected | Beautiful, but the bloom climbs into the text zone and reads like a fragrance ad. Dropped. |
| Panel creative rebuilt in creative #1's system | "too similar" | Formats must differ in layout *texture*, not just photography. |
| Three vials rendered in one generation | label drift — blue wordmark, missing rules, no fine-print box | **One vial per generation**, matted out and composed. See `HERO_PROMPTS.md` § plate. |
| Middot-separated selling-point frieze | reads as bullets on wrap | Spec row on hairline rules, or ticks. |
| Hairline divider rules between streak points | client rejected | Accent left-rule only. |
| CSS `transform` used to place the hero | drifts across aspect ratios | Geometry is composed at build time, never in CSS. |
| Briefing vial placement as a percentage ("upper 42% empty") | rendered as 34% | Brief placement as a **horizontal centre-line rule** — the only instruction that has held. |
| v1 trust card: centered stack on white | "generic template" | Every carousel/trust asset opens on a full-bleed product photograph or a real visual device. |
| Carousel teaching slides as type on white | generic | Devices drawn in CSS (chromatogram, peptide chain, stamped document). Crisp at any size, free, and unable to hallucinate a claim. |

---

## 5. CSS gotchas that will bite

- **Gradient text with `line-height` < 1.0** clips italic descenders into stubs.
  `background-clip:text` paints only inside the element box. Fix:
  `padding-bottom:.16em; margin-bottom:-.16em`.
- **The source logo PNG is a 6667x6667 canvas** whose wordmark fills ~31% of the height. A raw CSS
  `height` renders it ~3x too small. Trim to the content bbox once, then size. The white logo has
  the same problem. `engine/brandkit` does this for you and caches the result.
- **Chrome screenshots need a disposable `--user-data-dir`**, a timeout, and a `pkill` fallback, or a
  hung profile lock silently stalls the batch.
- **Base64-inline the fonts.** A `@import` from Google Fonts inside a headless screenshot is a race:
  it renders in Times often enough to poison a whole batch. `brandkit fonts` bundles them offline.
- **`--force-device-scale-factor=1`** with an explicit `--window-size` — otherwise a retina host
  silently doubles the output and the deliverable is the wrong size.

---

## 6. Video

Video ads are **9:16, always**. Two paths, both starting from an approved still:

1. **Motion graphics** (`nulumin_ad_video.py` pattern) — the approved static frame with a slow
   push-in and copy arriving on a stagger. Costs nothing per render, takes seconds, and keeps the
   campaign visually identical across static and video placements. Render all text layers in **one**
   Chrome pass as a vertical filmstrip and split it — one browser launch, not one per layer. Composite
   transparent PNG layers with ffmpeg `fade=alpha=1` so timing changes are a table edit.
2. **Seedance 2.0** — pass the approved frame as the start image so the product and its label carry
   over unchanged and only the atmosphere moves. Seedance garbles any text it is asked to animate;
   every word stays on an HTML layer above the clip.

Overlay renders: use `nulumin-video-overlay-fast.mjs`, not `-anim.mjs` — the latter runs at ~0.0035x
realtime and can hang on unbounded `-loop 1` stills. Serialize overlay runs; they share `_overlay/`
temp filenames.

---

## 7. Before you ship

1. Prove text legibility on the still at thumbnail size before animating it.
2. Confirm every selling point maps to an **approved** claim record.
3. Confirm the RUO line is legible in the final pixels, not merely present in the source.
4. Confirm the destination of every CTA and QR code actually resolves to what the caption says.
5. Paid vs organic is a compliance decision — strip commerce signals for organic. See
   `knowledge/compliance/NULUMIN_TIKTOK_PLAYBOOK.md`.
6. A qualified human owns final legal, medical, platform, and brand approval. Automated review is
   advisory.
