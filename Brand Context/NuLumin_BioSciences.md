# NuLumin Bio-Sciences

Research-grade peptide brand ("research peptides", B2C/retail-facing wholesale). Clinical-modern
wellness aesthetic. **31 SKUs in the active catalog — NOT 32.** Always cite "31 research peptides".
Website: nulumin.org. Tagline used on marketing graphics: **"Lighting the Path Forward"**.

**Compliance (required on every consumer-facing/email asset):**
`For Research Use Only. Not for human consumption.`
(NuLumin is a research-peptide brand — the RUO line is mandatory in email footers and fine print.)

---

## 1. Brand identity

### Logo (LOCKED)
- Wordmark: **"Nu" in modern bold sans + "Lumin" in matching thin/light weight**.
- A **horizontal divider line** sits beneath the wordmark.
- Small **"BIO-SCIENCES"** tracked-out tagline beneath the divider.
- To the **LEFT** of the wordmark: the signature **vertical spectrum band** — five stacked
  rounded-rectangle segments, top → bottom: **soft lavender purple, sky/cornflower blue, mint
  green, golden yellow, coral pink**. The bar is roughly the same height as the wordmark.
- Every design must reproduce the full lockup **faithfully from the logo PNG** — including the
  5-segment color bar and the "BIO-SCIENCES" tagline — with **no warping or substitution**.

### Brand palette (derived from the spectrum band — draw all accents from these)
| Role | Hex |
|---|---|
| Purple (lavender) | `#B89BE2` |
| Blue (cornflower) | `#6FA5DD` |
| Green (mint) | `#5DBD84` |
| Yellow (warm gold) | `#F2B856` |
| Coral (soft pink) | `#E68B9A` |
| Wordmark black | `#1A1A1A` |
| Background cream (warm) | `#F4F0E6` |
| Background white (clinical) | `#FFFFFF` |

### Aesthetic
**Clinical medical-grade modernism — "Aesop × Apple × premium bio-tech."** Refined. NOT
brutalist, NOT cosmic, NOT energy-drink. The 5-color spectrum bar is the brand's distinguishing
graphic device and should appear (as the literal logo element or a scaled-up graphic motif) in
**every** campaign asset.

Why this is locked: a v2 launch-poster round was rejected — one had a warped logo and unreadable
headline; one used an off-brand emerald/saffron Swiss-poster palette; one used a cosmic nebula
that didn't read as a research/medical brand. Identity = clinical-modern + spectrum band.

### Dark-marketing token set (HTML/CSS pipeline — shared with the catalog)
- Dark radial-gradient background: `#19223c → #080b12`
- Rainbow spectrum strip: `linear-gradient(90deg, #8B5CF6, #3B82F6, #2DD4BF, #34D399, #FBBF24, #F472B6, #EF4444)`
- Teal kicker: `#2DE0A8`
- Category accents: purple/Tissue `#A78BFA` · pink/Endocrine `#F472B6` · blue/Cellular `#60A5FA`
  · green/Neural `#34D399` · yellow/Metabolic `#FBBF24`
- Typeface: **Montserrat** (display)
- Boilerplate: "Lighting the Path Forward" · nulumin.org · RUO fine print

---

## 2. Locked visual rules (hard rules + why)

1. **Label text colors (vial-label art):** the **product name (italic script) is always BLACK /
   dark charcoal — NEVER the accent color.** Only the **dose text** (e.g. "5mg", "70mg") below
   the product name takes the accent color (= the cap color). The accent color also appears on:
   (a) the thin vertical accent stripe on the left edge of the label, and (b) the divider line
   under the "NuLumin" wordmark. Everything else on the label (wordmark, "BIO SCIENCES" tagline,
   side spec text, "Manufactured by NuLumin") stays black.
   *Why:* a first batch of blend vials was generated with the product name in the accent color
   and was corrected; the reference `NuL_CFC_5mg.png` clearly shows "CJC-1295(N)" in black with
   only "5mg" in pink. Every new vial-shot prompt must explicitly state the name is BLACK.
   **Exception:** on DARK marketing graphics (the HTML pipeline), product NAMES are WHITE; the
   dose still takes the category color. The black-name rule applies only to vial label art.

2. **Category system (LOCKED — booth/poster artwork):** the 5 spectrum-band colors map to exact
   category names and exact peptide groupings. Use these EXACT names verbatim and these EXACT
   groupings on all combined-category artwork (master posters, retail cards, banners):
   | Band | Category name | Peptides |
   |---|---|---|
   | PURPLE | **TISSUE RESEARCH** | BPC-157, TB-500, GHK-Cu |
   | PINK | **ENDOCRINE RESEARCH** | KissPeptin, Ipamorelin, Mementin |
   | BLUE | **CELLULAR RESEARCH** | Epithalon, MOTS-C, NAD+ |
   | GOLD/YELLOW | **METABOLIC RESEARCH** | GLP-1(S), AOD-9604, GLP-2(T) |
   | GREEN | **NEURAL RESEARCH** | Semax, Selank, DSIP |
   Ordered top → bottom by hue in the master spectrum-stack poster. Do NOT substitute the older
   internal slugs ("Recover", "Mood", "Longevity", "Energy", "Focus") — the booth-facing name is
   always the "* RESEARCH" version. *Why:* the five existing booth posts
   (`Nulumin Booth/image 2–6.PNG`) already use this mapping; the 30×70 master poster and all
   future combined-category artwork must keep the same band→name→peptides triplets.

3. **Glow/Klow cap blue + anchor-derive (LOCKED):** blend SKUs **Glow Blend (70mg)** and
   **Klow Blend (80mg)** share the SAME cap + label-accent blue (target accent blue `#94c7e2`;
   studio cap blue ≈ `#4a9bcb`). **DO NOT try to hit the blue with hex words in the prompt — it
   failed repeatedly** (`#94c7e2` came out too light, `#2473a1` too dark+metallic, `#3d8fc0`
   flat with the wrong screw-cap shape; the model also invented a generic chunky plastic screw
   cap, losing the real crimped vial cap). **The fix that worked: derive DIRECTLY from the
   approved Epithalon image and relabel only** — see the playbook (§5) for the exact technique.

4. **Lifestyle imagery = raw scanned 35mm film, NEVER polished/AI (CRITICAL):** NuLumin
   lifestyle shots must look like a REAL, raw, scanned 35mm film photograph — NOT a clean/
   polished/HDR "cinematic" commercial shot. Rejected as "way too AI like and terrible": crisp
   digital sharpness, perfect three-point lighting, vivid HDR color, smooth plastic skin, posed
   full compositions (this is what you get generating prompt-only with no ref). Full recipe in §5.

5. **31 SKUs, not 32.** Never cite any other catalog count.

6. **White-bg packshots: NO rembg hard cutout.** The rembg cutout was rejected as "very
   unnatural, like they're literally cut out" — a hard alpha matte strips the glass's soft
   edges/grounding and looks like a sticker. Locked approach = Nano Banana renders the vial
   naturally on white + smart-crop/deshadow normalize (details in §5).

7. **Never PIL-paste/recolor to fake fidelity** — prompt-only iteration. (Read-only pixel
   *sampling* for QC is fine; finishing grades like film grain explicitly requested by the
   client are fine.)

---

## 3. Asset map

Paths are relative to the project repo root unless noted.

- `NuLumin Assets/` — source vial renders: 32 files covering both dose variants of the catalog,
  plus logo files and `NuL_Epithalon_streak_APPROVED.png`. Key refs:
  `NuLumin Assets/NuL_CFC_5mg.png` (label-color + studio-lighting reference — warm grey
  seamless, soft contact shadow, NO glossy floor reflection). ⚠ `nulumin_logo_white.png` has
  huge transparent padding — MUST crop to bbox before sizing.
- `NuLumin Send/` — approved/deliverable shots. `NuLumin Send/ref.png` = **canonical studio
  source** (approved Epithalon studio shot: grey backdrop, correct crimped cap, cap blue
  ≈`#4a9bcb`, full label). `NuLumin Send/Epithalon_10mg_blue.png` = approved light-streak hero.
  `_ref_streak_blue.png` = approved Epithalon streak reference. `NuLumin Send/Glow & Klow/` =
  the two blend studio shots (source files named `NuLumin_Glow-Blend_*` / `NuLumin_Klow-Blend_*`).
- `Nulumin lifestyle shots/1 by 1/` (9 refs) and `Nulumin lifestyle shots/3 by 4/` (4 refs) —
  the moodboard reference images; they ARE the target film style.
- `NuLumin Generated/<aspect>/refNN_vK.png` — approved lifestyle recreations (NN = ref index in
  source folder, alphabetical; K = variation). Raw timestamped originals stay in `generations/`.
- `NuLumin Generated/Themed Lifestyle/By Theme/<Theme>/<Theme> NN.jpg` — themed action set;
  raw ungraded renders in `By Theme/_staging_raw/`; the original 20-shot split preserved in
  `Themed Lifestyle/{Blur,No Blur}/`.
- `NuLumin Generated/White BG/<base>_white.png` — **34 finals** of the white-background packshot
  set; raw NB generations in `White BG/_raw/`; contact sheet `White BG/_contact_sheet.jpg`.
- `Nulumin Booth/image 2–6.PNG` — the five existing booth posts (source of the locked
  category-color mapping).
- `~/Downloads/lightstreak-1/nulumin_marketing.py` → outputs in
  `~/Downloads/lightstreak-1/NuLumin_Marketing/`; reuses `_catalog_build/` assets (Montserrat
  fonts, white logo, approved 2048² light-streak vial shots in `1x1/`).
- `email_campaigns/nulumin/` — email templates (see §4; ⚠ folder was found EMPTY on 2026-07-13,
  verify on disk).
- Repo folders that exist but have **no memory documentation** — inspect contents before using:
  `NuLumin Influencer Box/`, `NuLumin Scatter Posters/`, `Nulumin Fridge/` (and `NuLumin Send/`,
  `NuLumin Assets/`, `Nulumin Booth/` beyond the specific files listed above).

---

## 4. Campaigns / programs run

1. **Lifestyle moodboard recreations** — recreate the 9 refs in `1 by 1/` (1:1) and 4 refs in
   `3 by 4/` (user specified "3:4 horizontal" landscape — clarify before that batch) as new
   generations. Always max res. **Deliverable = 2–3 approved variations per ref**, copied (not
   moved) into `NuLumin Generated/<aspect>/refNN_vK.png`; originals stay in `generations/` as
   the audit trail.
2. **Themed action-lifestyle set** — 6 benefit themes × **12 shots each** (user wanted 10–15):
   weight-loss, recovery, longevity, performance, cognitive, sexual-health; mix of heavy-blur
   and frozen-sharp ACTION shots in the locked grit-film look. Locked theme definitions:
   - **Weight loss** = a person who is NOT fit (overweight/heavier-set, mid-journey) grinding
     through INTENSE CARDIO — sweating, struggling, determined (treadmill, jog, jumping jacks,
     jump rope, spin, stairs, burpees, kettlebell, gasping). NOT lean models having fun.
   - **Recovery** = the recovery MODALITIES themselves: theragun/percussion gun, foam rolling,
     stretching, deep-tissue massage, physio joint mobilization, compression boots, cold plunge,
     sauna.
   - **Longevity** = wholesome, FAMILY-oriented active outdoor life: family hikes, biking with
     kids, nature trails, playing with children, kid on shoulders (a fit older adult inside a
     family group is OK; otherwise keep subjects young-to-midlife).
   - **Performance** = real ATHLETICS/SPORTS by fit athletes (basketball, soccer, sprint, swim
     race, boxing, climbing, surf, volleyball, lifting, gymnastics) — variety of sports.
   - **Cognitive** = mental FOCUS/concentration: studying, chess, reading, focused desk/lab
     work, whiteboard. Quiet focus, mostly tack-sharp (NOT motion-blurred).
   - **Sexual health** = a FIT, attractive COUPLE being PLAYFUL/affectionate INDOORS (chasing,
     jumping on bed, dancing/dipping, piggyback, tickling) — tasteful, clothed/loungewear,
     nothing explicit.
3. **White-background packshot set** — every vial on pure white, no shadow, 1:1, 4K. Delivered
   2026-06-22: all `NuLumin Assets/` vials (32 files; skip logos + the approved streak PNG) +
   the 2 Glow/Klow studio blends = **34 finals**.
4. **Glow & Klow blend product shots** — two shot types (studio 5:4 + light-streak hero
   1080×1935 / 9:16), both approved (streak approved as "perfect").
5. **Digital marketing asset system** — multi-AR brand graphics via the HTML/CSS pipeline.
   Starter set delivered 2026-06-18, one per AR, each a distinct concept + category:
   - `nulumin_brand_1x1.png` 2160² — brand standard, NAD+ (blue), "Purity you can publish."
   - `nulumin_glp1_3x4.png` 2160×2880 — product spotlight, GLP-1 (S) 20mg (yellow), top vial banner.
   - `nulumin_wolverine_9x16.png` 2160×3840 — NEW/blend hype, Wolverine Blend (purple), framed hero+glow.
   - `nulumin_categories_16x9.png` 3840×2160 — web hero, CJC+Ipamorelin (pink), "Five
     categories. One standard of purity." + value-prop row.
   Planned expansion: more ARs (4:5, 2:1, 5:4…), more variants per AR, Neural/green + Endocrine
   product spotlights, lifestyle-photo variants, optionally sync finals into `NuLumin Send/`.
6. **Booth artwork** — 5 per-category posts + a 30×70 master spectrum-stack poster using the
   locked category mapping (§2.2).
7. **Email templates** — `email_campaigns/nulumin/`: 2 template variations (`email_1.html`,
   `email_2.html`) + rendered `*.preview.png` + 2 custom graphics in `assets/`
   (`hero_banner.png`, `feature.png`) generated from `gfx_hero.html`/`gfx_feature.html`;
   overview at `email_campaigns/_gallery.png`, deploy checklist in `email_campaigns/README.md`.
   The NuLumin emails followed the locked identity: spectrum-band motif, logo lockup, "31
   research peptides", clinical-modern. Locked email-engineering pattern: table-only
   `role=presentation` layout, centered 600px container, all critical CSS inline,
   `<!--[if mso]>` PixelsPerInch block, hidden zwnj/nbsp preheader, bulletproof VML-roundrect +
   `<a>` fallback CTA, alt on every img, dark-mode `@media`, and the footer compliance line
   **"For Research Use Only. Not for human consumption."** Images referenced as `assets/...`
   relative — MUST be re-hosted to https URLs before send (Gmail blocks base64/data-URI images
   and clips emails >102KB); swap `{{Unsubscribe}}`/`{{View in browser}}` merge tags; confirm
   purity %/size specs against a real COA. Reusable HTML→PNG renderer:
   `email_campaigns/render.sh "<abs html>" "<abs out.png>" <W> <H> <bg_rgba> <pad>`.
   ⚠ 2026-07-13: `email_campaigns/` was found EMPTY (prior campaigns moved out of the repo) —
   re-check what's on disk before assuming the folder exists.

---

## 5. Generation playbook

### Model choices
- **Vial/product shots (Glow/Klow, white-bg set): Nano Banana Pro** (`gemini-3-pro-image-preview`),
  4K — it holds reference likeness and label text at hero scale.
- **Lifestyle shots: Nano Banana** with a moodboard ref as film-look anchor (see below);
  moodboard recreations were run at max res (gpt-image-2 4K quality per the original spec, NB
  for the themed grit batches).
- **Precise-copy marketing graphics: the HTML/CSS → headless Chrome pipeline, NOT an image
  model** — these need exact copywriting + exact brand tokens (`nulumin_marketing.py`, headless
  Chrome `--screenshot` @2x, embedding approved assets; run from `~/Downloads`, NOT iCloud
  Desktop).

### Glow/Klow anchor-derive (the technique that worked)
Separate generations of a matching pair drift apart in lighting + blue tint. Fix:
1. Render ONE shot derived from the canonical source: feed **`NuLumin Send/ref.png`** (approved
   Epithalon studio shot) as the reference with the prompt: **"reproduce EXACTLY as a photo
   retouch, change ONLY: name Epithalon→Glow Blend, dose 10mg→70mg."**
2. Then generate the sibling (Klow) by feeding the **Glow result** back as the reference with
   the same "reproduce exactly, change only name+dose" prompt.
3. Result: Glow `#95c6e1` and Klow `#94c6e0` — within 1 RGB unit of each other, ~2 of the
   `#94c7e2` target.
4. Verify with a read-only PIL cap-pixel sample: scan a strip near x=0.5, y=0.12–0.34 and take
   the bluest pixel (a fixed mid-frame point hits the backdrop instead). Never PIL-paste or
   recolor to force it.
Scripts: `nulumin-glowklow-studio-fromref.mjs` (approved 2026-05-30, 1:1; the cleaner source),
`nulumin-glowklow-studio-fromapproved.mjs` (derives from the streak hero + restages to grey —
also works), `nulumin-glowklow-studio-anchor.mjs` (studio 5:4, lighting locked to the CFC ref),
`nulumin-glowklow-streak-94c7e2.mjs` (streak hero: reproduce `_ref_streak_blue.png` EXACTLY —
same blue background, gradient, ribbon-streak layout — relabel only).
Label rule applies: product name stays BLACK, only the dose takes the accent blue.

### Lifestyle film-grit recipe (LOCKED — every step matters)
1. **ALWAYS pass a moodboard ref as `refImages[0]`** as a film-look anchor — match its grade/
   exposure/softness/blur, but explicitly tell the model to IGNORE the ref's scene/people/pose/
   composition. Prompt-only drifts to the glossy AI look.
2. **Verbatim prompt language:** "raw 35mm film snapshot, scanned from the negative (Cinestill
   800T / pushed Portra), SOFT film focus (nothing tack-sharp/crisp/clean), halation/bloom,
   muted desaturated faded color (NOT vivid, NOT HDR, NOT digital), candid unposed imperfect
   off-kilter framing, natural imperfect skin." DELETE words like premium/cinematic/editorial/
   painterly/tack-sharp — they push polish.
3. **GRAIN MUST BE ADDED IN POST.** Nano Banana renders clean smooth skin and will NOT produce
   heavy film grain from the prompt (verified at 100%). Apply after generation with
   `film-grain.py <in> <out> <sigma> <size>` — heavy ≈ sigma 18, size 0.7; medium ≈ 11/0.6.
   Keep raw generations in a `_raw/` subfolder so grain is instantly re-tunable. (This is a
   finishing grade, not asset-pasting.)
4. **Blur shots:** push blur HEAVY / near-abstract — anchor to the boxer (r09) or cyclist (r03)
   refs; subject mostly dissolved into directional streaks + ghosting. Prompt: "LONG-EXPOSURE,
   MOTION IS THE SUBJECT, do NOT keep the subject sharp." Moderate/readable blur gets rejected
   as "too weak."
5. **EVERY shot must be an ACTION shot** — the person actively DOING something, caught candidly
   mid-act, never posed/static/calm. Applies to the "no-blur" set too: those are FROZEN-SHARP
   action (fast shutter), NOT quiet stills. (Rejected calm stills: sauna sitting, porch tea,
   reclining, posed portrait, microscope staring, forehead-to-forehead.) Reframe each theme as
   motion: recovery = cold-plunge surge / mobility flow / deep massage press; cognitive =
   hammering piano / fast drafting / pipetting; sexual-health = playful bed tumble / dance spin;
   longevity = lake charge / firewood swing / garden dig / chasing a dog.
6. **Subjects skew YOUNG (20s–40s).** "Refrain from old people" — no 60s/70s; cap ~40s.
7. **Scenes must NOT echo the refs' activities** (gym/run/cycle/box/tennis/HIIT/floor-weights).
   Avoid generic "person working out" (snatch, sprint, lap-swim stroke, get-up). Use distinctive
   benefit-led scenes.
8. **Safety:** sexual-health prompts with undressing / "getting dressed / pulls on a shirt"
   phrasing trip Google IMAGE_SAFETY (blocked, no image). Use clearly active, fully-clothed,
   confident scenes (laughing mid-spin in a dress, playful tumble).
9. **Ref-anchor by tone:** dark→r04 · warm-golden/heavy-blur→r03 · abstract-blur→r09 ·
   soft-candid→r06/r12 · dawn-earthy→r10.
Pipeline: `nulumin-grit-all-build.mjs` (per-shot scene + ref anchor + blur/frozen directive) →
split JSON → `OUTPUT_DIR=... node nanobanana.mjs --batch` → move raw to `_raw/` →
`film-grain.py` each. Themed-expansion pipeline: `nulumin-expansion-build.py` (concepts → batch
JSON) → 8 parallel `nanobanana.mjs --batch` → `nulumin-expansion-finalize.py` (carry approved
frames + grade σ12 + name).

### White-bg packshot pipeline (LOCKED)
Goal: pure-white, shadow-free, 1:1, 4K packshots that still look like natural photos.
1. `nulumin-white-bg-batch.mjs` — NB Pro (1:1, 4K) reproduces each vial EXACTLY (cap/glass/
   label/contents/text untouched) re-staged as a NATURAL product photo on a bright-white
   seamless sweep; explicit NO shadow / no floor reflection / no tiling / "not a flat cut-out
   sticker." Concurrency 4, 2 retries → `White BG/_raw/`. Env knobs: `JOB_LIMIT` (smoke-test
   first N), `ONLY=<substr>` (targeted re-run), `EXTRA=<text>` (append a per-run clause, e.g.
   "keep liquid clear/colorless").
2. `nulumin-deshadow.py <in|file> <out|file>` — current finishing step (replaced
   `nulumin-natural-normalize.py`). NB still lays a faint contact shadow; fix = rembg-matte the
   vial (isnet captures the vial, NOT its shadow) then ALPHA-COMPOSITE onto a uniform soft-white
   canvas — shadow gone, soft glass edges kept (fill is soft ~245 white, feathered matte, NOT
   the clinical hard cutout). Also normalizes: crop alpha bbox, scale height = 0.78 of 4096²,
   dead-center. `FIXED_BG="245,245,245"` snaps ALL shots to ONE identical soft white (without
   it a few read tinted: Epithalon cream, KPV lavender).
3. **Cap standardization (baked into the prompt):** source caps are inconsistent, so the prompt
   OVERRIDES: ONE standard cap on every vial — a LOW, FLAT-TOPPED matte/satin crimped aluminum
   seal (height ≈ 1/3 of diameter) with a thin brushed-aluminum crimp ring below; take ONLY the
   cap COLOR from the reference. Stubborn outliers (KlowBlend, GHK, AOD) needed a second pass
   with a stronger `EXTRA` "CAP CORRECTION" clause. Inspect by cropping band y≈0.07–0.30 into a
   6-col strip (`_caps_compare.jpg`).
4. **Cap-color matching — PREFERRED = generation with a cap-color reference:** `CAP_REF=<path>`
   adds a 2nd reference image; pair with an `EXTRA` clause: "FIRST image = product to reproduce
   (glass/contents/label/all text); SECOND image = CAP COLOR SAMPLE — match the cap color
   exactly." All 5 cap families matched this way (`redo-families.sh`): blue→Epithalon_10mg ·
   yellow/gold→GLP1_10mg · pink/coral→CFC_5mg · purple→BPC_10mg · green→Semax_10mg. Add
   "keep the liquid clear and colorless as in the first image" (stops NB re-tinting). One pass
   usually lands within-family spread ~B≤20; stubborn outliers (GLP2_10mg, KPV_5mg, MOTSC_20mg,
   Epithalon_30mg) needed a single redo. Verify labels aren't contaminated by the 2nd ref.
5. **Fallback = post-recolor `nulumin-recolor-cap.py <in> <out> <hex> [hueLo hueHi]`:** mask the
   colored cap disc (top 26% band, sat>0.18, hue-gated — excludes grey ring + clear glass) and
   re-tint modulated by per-pixel luminance. The 8 blues were normalized to **`#49A0CB`** (brand
   cap blue ≈`#4a9bcb`). Run AFTER deshadow (a later deshadow re-run wipes it). IMPORTANT: keep
   relief compressed (`RELIEF_K=0.45`, clip 0.84–1.13) so caps stay MATTE — full relief (clip
   2.3) amplified speculars into a glossy/metallic look and was flagged.
6. **Gotchas / proven failure modes (don't repeat):**
   - Pushing NB for literal "#FFFFFF / RGB 255 / zero shadow" makes it tile the side margins
     with hallucinated texture.
   - A luminance/flood-fill white key eats the translucent vial (glass is as bright as bg).
   - rembg hard cutout = sticker look, rejected. (`nulumin-white-flatten.py` is SUPERSEDED,
     reference only. rembg via Python API `new_session('isnet-general-use')`.)
   - `ONLY=` matches the SOURCE path, not the out name — Glow/Klow live in
     `NuLumin Send/Glow & Klow/` as `NuLumin_Glow-Blend_*`/`NuLumin_Klow-Blend_*`, so
     `ONLY=KlowBlend` matches NOTHING; use `ONLY=Klow` or `ONLY=Klow-Blend`.
   - Residual: bg shade varies 228–244 across the set (each keeps its own NB white) — reads as
     white; a per-image white-point lift could unify but risks the natural look.
   Result stats: 34 finals, vial height 3205–3217px (12px spread), centered ≈(2048,2048),
   under-vial brightness within ±5 of bg, consistent low matte cap family.

### Marketing-asset pipeline (HTML/CSS → Chrome)
Generator `~/Downloads/lightstreak-1/nulumin_marketing.py` (run from `~/Downloads`); outputs →
`~/Downloads/lightstreak-1/NuLumin_Marketing/`. Uses the §1 dark token set, Montserrat, the
bbox-cropped white logo (`logo_cropped()`), and the approved 2048² light-streak vial shots.
Each asset = unique copy + placement, one cohesive system, max res per AR. On these dark
graphics: product names WHITE, dose in the category color.
