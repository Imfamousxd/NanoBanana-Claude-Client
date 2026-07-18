# Noble Harbor (Noble Harbor Science Laboratories)

Research-peptide **wholesale / white-label** brand. Website: `nobleharborsciences.com`.
Positioning: a US laboratory that manufactures research peptides in-house and lets B2B
partners (clinics, med-spas, pharmacies, gyms, supplement stores, etc.) put **their own
label** on the Noble Harbor compound library. Hero line used verbatim on the site:
**"White-labeled at the molecular level."**

This document is fully standalone — everything an app needs to produce on-brand Noble
Harbor content is written out below. Do not invent facts, colors, or claims beyond it.

---

## 1. Brand identity

### 1.1 The real logo (never invent a substitute)
- Source of truth: `https://nobleharborsciences.com/logo-final.png` — a **DNA double-helix
  mark + elegant black serif "Noble Harbor" wordmark + letter-spaced "SCIENCE LABORATORIES"
  sub-line**, black on transparent, native 3797×1125 px.
- An optimized 660px-wide copy lives in the email build at
  `email_campaigns/noble_harbor_wholesale/images/nh-logo.png`.
- An **all-white inversion** (for navy surfaces) exists as
  `email_campaigns/noble_harbor_wholesale/images/nh-logo-onnavy.png` — the white logo
  composited onto a solid navy `#0b2545` rectangle (made with ffmpeg
  `lutrgb=r=negval:g=negval:b=negval` on logo-final.png, alpha preserved).
- Historical note: early work guessed a "maritime/teal" identity — that guess was WRONG
  and was corrected when the user supplied the real logo. Noble Harbor is a
  **clinical-SCIENCE-lab** brand.

### 1.2 Design system A — "Clinical-science white" (core identity, used on collateral + the wholesale_outreach emails)
- Background: white `#FFFFFF`; page tint `#f4f3ef`; card `#fff` with border `#e4e4e4`.
- Ink `#111111`; muted `#6b6b72`; hairline `#e4e4e4`; deep slate `#1c2230` for
  headers/CTAs/accents.
- Typography: **Georgia serif** headings with *italic accents*; Courier-style mono for
  small labels/eyebrows.
- Motif: DNA/molecular thin-line details, hairline rules, lots of white space.
  Minimal, refined, scientific. CTAs are black/slate.

### 1.3 Design system B — "Maritime Pharmaceutical" (the newer 48-email system, from the site's own design language)
The live site reads as an **"archival laboratory folio"**; the email kit distilled it as:
- Paper `#E7E9ED` (page), card `#FCFCFB`, navy `#0b2545` (bands, panels, CTA).
- Site-token neighbors (from the folio research pass): cool paper `#f5f7fa`, ink
  `#0a1628`, deep-navy `#0b2545` SQUARE buttons, borders `#d4dae3`, brass `#64748b`.
- Typography: **Fraunces** (display serif) + **Inter Tight** (body) + **IBM Plex Mono**
  (labels/microcopy).
- Apparatus/motifs: `Lab № 04 / 99.7% avg purity` masthead detail, "Volume № / Folio /
  Plate №" labels, ★★★ marks, dotted-leader spec rows, hairline rules, rotated circular
  **USA seal**, navy inverted banners, a navy **"MADE IN THE USA"** band.
- Site footer motif: "Fold. Cut. Ship." — that is the SITE's own device; keep it.

### 1.4 Real company facts (locked — use these numbers, nothing else)
- **99.7% average purity**; verified by **HPLC + MS**.
- **Signed COA with every batch/lot** (flagship example: BPC-157 · Lot NH-BPC-2147-A —
  a.k.a. "Lot 2147-A" — **99.82%** purity).
- **57 SKUs** across the library (site catalog truth: **32 products / 57 SKUs**, in 5
  categories TIS / CEL / NEU / MET / END at `/catalog/<slug>`; the internal wholesale
  render line covers **33 compounds** — `nh-peptides.txt` is authoritative for that list).
- **In-house synthesis in the USA — never outsourced.**
- **5-day lead time**; **NO minimums**; private label / white label offered.
- **Applications reviewed within 24 hours.**
- The site shows **no prices** → always "COA on file" / quote-on-application /
  "Request Pricing".
- Wholesale funnel URL: `nobleharborsciences.com/wholesale-apply` (a later CTA-rewire
  pass pointed campaign CTAs at `https://www.nobleharborsciences.com/apply` — verify
  which is live before wiring links). Other confirmed live paths: `/catalog`,
  `/coa-library`, `/manufacturing`.
- Contact / sender: **bryan@nobleharborsciences.com** — email persona
  **"Bryan J, Wholesale Partnerships"**.
- Market stat used for the Starters audience: Global Peptide Market
  **$140.9B → $294.6B**.

### 1.5 Compliance (required)
- Noble Harbor is a **research-peptide** brand → the footer compliance line
  **"For Research Use Only. Not for human consumption."** (RUO) is REQUIRED on
  Noble Harbor emails/collateral.
- Known exception to watch: the user-supplied 48-email kit footer had CAN-SPAM text but
  NO RUO line and was reproduced faithfully — flag/offer to add RUO whenever touching
  those files.

---

## 2. Locked visual rules

### 2.1 The locked simplified vial label (product line — NO hairlines)
Every wholesale vial render uses exactly this label:
- Top **~75%** of the label = pristine EMPTY WHITE logo zone (no placeholder marks).
- Product name centered in the lower portion, medium-bold **charcoal grey medical
  sans-serif**.
- Single solid bottom **accent bar (~7% of label height)** in the cap color
  (medium grey bar for the white cap).
- **No horizontal rules, no hairlines, no other elements.** (Hairlines were removed
  because gap-to-bar spacing kept drifting.)
- Dose text on placeholder sets is the literal string **"xx mg"** so one image serves
  every dose; stamped dose sets (e.g. "10 mg") live in dose subfolders.
- Volume text is **lowercase "ml"** — "5 ml", never "5 mL" (see gotchas §5.6).

### 2.2 Locked 9-cap hex colorway (in `nh-colors.json`, sampled from the BPC-157 master set)
| color | hex |
|---|---|
| navy | `#101850` |
| black | `#202020` |
| white | `#FFFFFF` (label bar `#B0B0B0`) |
| red | `#700008` |
| green | `#407858` |
| babyblue | `#90B0C8` |
| yellow | `#D8C848` |
| pink | `#F0D0D8` |
| purple | `#8068A8` |

These hexes are injected verbatim into generation prompts so caps match hex-for-hex
across every product. The whole line must read as one brand family: same vial, same
caps, same layout — only the product name changes.

### 2.3 Category cap-color system (locked, used on folio/catalog artwork)
TIS=navy · CEL=babyblue · NEU=purple · MET=green · END=red.

### 2.4 Vial styles / size tokens in the product line
- Base styles: **3ml clear**, **3ml-dark (amber)**, **5ml clear**.
- Added tokens: **10ml** (clear; the 5ml clear art with only the volume text changed),
  **5ml-dark**, **10ml-dark** (amber, all compounds), and **20ml / 20ml-dark / 30ml /
  30ml-dark for NAD+ & Glutathione ONLY**.
- A "10 ml" image is a VOLUME variant, not a dose — dose stays "xx mg" on those.

### 2.5 Email design rules (hard-won, apply to all Noble Harbor email work)
- **Email-safe TABLE HTML only** — `role=presentation` tables, centered 600px container,
  inline critical CSS, MSO conditional block, hidden preheader, VML/anchor fallback CTA,
  alt text on every image. Never ship flex/grid (Outlook-unsafe).
- **Gmail dark mode FULL-inverts and IGNORES CSS dark-mode hooks**
  (`prefers-color-scheme`, `[data-ogsc]`/`[data-ogsb]`, logo-swap spans) — do not chase
  CSS swaps. The working fix is **baked-band images**: bake the brand color INTO the
  logo PNG and lock the band with a tiny hosted `background-image` pixel tile
  (Gmail recolors background-COLORS and text but never background-IMAGES or PNG pixels).
- **Landed locking rule:** lock a background ONLY where an IMAGE sits on it (logo band,
  product shot). Any surface with LIVE TEXT stays UNLOCKED so Gmail converts background
  + text together and keeps contrast (Gmail renders unlocked navy panels as
  light-with-dark-text in dark mode — readable). Gmail darkens even near-white text on
  a locked background, so "keep the text white" does NOT work.
- **Final NH masthead (current): a slim NAVY header bar baked as ONE image**
  `images/nh-header.png` — white logo LEFT-aligned + "Lab № 04 / 99.7% avg. purity"
  light-steel `#CDD8E8` detail RIGHT, on navy `#0b2545`, rendered 640-CSS-wide @2x via
  HTML→headless-Chrome, displayed full-width (`width:100%`). The earlier big navy
  header + separate "MADE IN THE USA" band were removed in a subtle-branding pivot:
  the email must LEAD with the personal "Hi {{first_name}}," greeting (plain text, no
  dashed merge-field box); branding stays slim and left-aligned so it doesn't steal
  the show.
- White product imagery on light cards: bake the whole card (vial + heading + body)
  into ONE white PNG (HTML→Chrome render) so it is inversion-immune — a transparent
  vial PNG on a live white panel goes grey in dark mode. Round corners by
  `overflow:hidden` on the container + matched radii on img/spec row.
- Card-text contrast tokens (light bg): FAINT `#67727F`, MUTE `#5E6A7A`, DIM `#4E5A6C`
  (darkened from `#9AA2B0`/`#7A8292`/`#5D6675`, which were too faint). Grid TITLE bars:
  10.5px, weight 500, navy ink, letter-spacing .14em.
- **Every link must be functional** — no `href="#"`; unsubscribe =
  `mailto:bryan@nobleharborsciences.com?subject=Unsubscribe`; UTM-tag all site links.
- Merge tag style in the wholesale build: `{{first_name}}` (kit style).
- NH copy rules (locked): (1) NO reply-to-email CTAs — drive to the site;
  (2) product images BIG and crisp; (3) hero shows a VARIETY of peptides, not all
  BPC-157; (4) generous logo size; (5) every email oriented to the website.

---

## 3. Asset map

### 3.1 Product render library — `Noble Harbor Wholesale/` (repo folder; lives on a CLOUD-SYNCED volume — see §5.7)
- Root of each product = the **placeholder ("xx mg") set**:
  `<stem>_<size>_<color>.jpg`, where stem = product name with spaces→underscores
  (e.g. `GLP-1_(S)_5ml_navy.jpg`, `BPC-157_10ml_yellow.jpg`). Size tokens: `3ml`,
  `3ml-dark`, `5ml`, `5ml-dark`, `10ml`, `10ml-dark` (+ `20ml`/`20ml-dark`/`30ml`/
  `30ml-dark` for NAD+ & Glutathione only).
- Per-dose stamped sets in dose subfolders:
  `Noble Harbor Wholesale/<Product>/<dose>/<stem>_<dose>_<size>_<color>.jpg`
  (e.g. `.../BPC-157/10mg/BPC-157_10mg_5ml_navy.jpg`). All 33 products have complete
  `10mg/` sets (18 images each: 9 colors × 3ml + 5ml clear).
- **BPC-157 is the master reference set** — every product matches it pixel-faithfully
  with only the name changed. BPC-157 10mg is a VERIFIED-correct 9-color set (safe to
  use for any colorway lineup); **Oxytocin is NOT** (2 shifted files).
- Renders used in email campaigns: **BPC-157 10mg navy**, **GHK-Cu 100mg green**,
  **NAD+ 500mg babyblue** from `Noble Harbor Wholesale/<compound>/<dose>/`. High-res
  singles (3712×4608, one vial on pure white) also exist under
  `Noble Harbor Wholesale/<Compound> 2/<dose>/`.
- `coa_bpc157_hires.svg` → `coa_<slug>_hires_6x.png` — tilted-sticker hi-res COA art
  (8334×8742 transparent).
- Replaced/pre-fix originals are kept beside finals with `.pre-fix` /
  `.pre-lowercase` suffixes.
- **File-identity GOTCHAS (verified visually):** `PT-141 2/5mg/*_red.jpg` actually
  contains a GLP-3 (R) 12mg pink vial (use the 10mg red instead); `Melanotan II 2/10mg`
  color files are SHIFTED one position (the true red = `*_white.jpg`). An
  `OVERRIDE_FILE` map inside the folio `build_assets.py` handles both.

### 3.2 Repo-root scripts (product line)
`nh-build-batch.mjs` (per-product batch builder) · `nh-colors.json` · `nh-peptides.txt`
(authoritative 33-compound list) · `nh-build-10ml.mjs` / `nh-run-10ml.sh` /
`nh-rename-10ml.mjs` · `nh-build-10mg.mjs` / `nh-run-10mg.sh` / `nh-rename-10mg.mjs` /
`nh-build-10mg-fix.mjs` / `nh-bestof-10mg-select.py` · `nh-canary.mjs` ·
`nh-sizes-build.mjs` / `nh-sizes-batch.mjs` / `nh-sizes-supervise.sh` /
`nh-verify-sizes.py` / `nh-sizes-fix.py` / `nh-sizes-refswap.mjs` /
`nh-sizes-refswap-run.py` · QC: `nh-qc-10ml.mjs`, `nh-verify-10ml.py`,
`nh-verify-10mg.py`, `nh-10ml-sheets.py`, `nh-bestof-select.py` ·
email-hero gens: `nh-email-heroes.mjs`, `nh-hero-yourlogo-45.mjs`,
`nh-missing-renders.mjs` · COA: `nh-coa-hires-set.py`.

### 3.3 Email campaign folders
- `email_campaigns/noble_harbor_wholesale/` — the 48-email Maritime Pharmaceutical
  build: `build.py`, 48 HTML emails, `preview/`, `send-ready/`, `images/`
  (`nh-logo.png`, `nh-logo-onnavy.png`, `nh-header.png`, `px-navy.png`,
  `vial-card-white.png`), index board, README.
- `email_campaigns/noble_harbor/wholesale_outreach/` — the 3-email white-label
  sequence + its `assets/` (heroes `gen3_*`, `yourlogo45.jpg`, `hero_lineup.jpg`,
  `vial_bpc/ghk/nad.jpg`, COA doc art, `_hero_lineup.html`, `_coa_doc.html`,
  `coa_{cjc1295,nadplus,glow,pt141,glp1}.jpg`, `generated/{b12,cjcipa}_c2.png`).
  ⚠ **2026-07-13: `email_campaigns/` was found EMPTY of the older folders** (the
  noble_harbor/ folio-era content had been moved out) — re-check disk before assuming
  these exist; the `noble_harbor_wholesale/` 48-email build is the current on-disk set.
- **GOTCHA:** the old `email_campaigns/noble_harbor/assets/` BPC vial images have
  **"xx mg" placeholder labels — NEVER use them in customer-facing work.** Use the
  dose-stamped renders from `Noble Harbor Wholesale/<compound>/<dose>/`.

### 3.4 Shipped zips (on the user's Desktop)
- `Noble-Harbor-Wholesale-Emails.zip` — the 48-email build (~3.9MB with logo embedded
  in all 48 send-ready; re-zipped ~3.2MB after the subtle-branding pivot).
- `noble_harbor_wholesale_templates.zip` — the 3-email white-label kit.
- `Noble-Harbor-Email-Campaign.zip` — folio-era kit (emails + assets + 15-page catalog
  PDF `Noble-Harbor-Catalog-Vol-04.pdf` + SEND-GUIDE).

### 3.5 Hosting / send infra
- **Gmail blocks base64/data-URI images and clips emails >102KB** → production images
  must be hosted at real https URLs. All campaign images live in the user's
  **Supabase Storage, bucket `email-assets` (PUBLIC)**, project `fmtuqieexvsmlqkdznbb`,
  URL pattern
  `https://fmtuqieexvsmlqkdznbb.supabase.co/storage/v1/object/public/email-assets/email/<file>`.
- Uploader: repo-root `sb_upload.py` (pure-stdlib AWS SigV4; S3 endpoint
  `https://fmtuqieexvsmlqkdznbb.storage.supabase.co/storage/v1/s3`, region us-west-1;
  creds via `SB_KEY`/`SB_SECRET` env — rotating, never written to files; writes
  `/tmp/imgmap.txt`).
- Test sender: repo-root `send_campaign_tests.py` (Gmail SMTP smtp.gmail.com:587, app
  password via `SMTP_USER`/`SMTP_PASS` env, sends to mario@agencydevworks.ai; its
  `hostify()` swaps `src="images/X"` → hosted URL from `/tmp/imgmap.txt`).
- `build.py` template tokens: `HOSTED` (Supabase public base) and `BANDBG`/`NAVYBG`
  (= `background-color:<c>; background-image:url('<HOSTED>/px-*.png');
  background-repeat:repeat;`) for image-surface band locking.

---

## 4. Campaigns run

### 4.a wholesale_outreach — 3-email white-label sequence (`email_campaigns/noble_harbor/wholesale_outreach/`)
- Skeleton: the "N°0X editorial" system re-skinned to NH clinical WHITE identity
  (page `#f4f3ef`, white card border `#e4e4e4`, ink `#111`, slate `#1c2230`
  CTA/accents, Georgia serif headlines with italic accents, Courier mono labels,
  **RUO line in every footer**). Generated by one python generator script with shared
  shell/band/fig/hero/cta/footer helpers (reusable for future skins).
- **3 emails: 01 Catalog / 02 Standard / 03 Partnership — Day 1 / 4 / 8.**
- All copy built on the real company facts (§1.4); no prices → "COA on file" /
  quote-on-application.
- **v2 "white-label" pass** (after feedback that v1 was too generic — this is B2B
  convincing brands to white-label): copy re-aimed at brand owners —
  **"Put your name on the library"** / **"The proof your customers will ask for"** /
  **"From application to your first run"**; added the **9-dot cap-colorway swatch
  row**, a slate **"EXHIBIT A"** band with a real COA document image, and a slate
  3-step timeline (**24h review → Kit → 5 days**).
- Heroes = **gpt-image-2 EDIT with real vial renders as reference images**
  (`nh-email-heroes.mjs`): 5-colorway lineup on a lab bench / GHK-Cu macro /
  mixed-color production-tray rows. gpt-image-2 held the NH label text perfectly —
  better than Nano Banana for this white clinical packshot style.
- **Final heroes = the `gen3_*` set: pure-white background + dashed "YOUR LOGO HERE"
  placeholders on the vial labels**, generated via gpt-image-2 edit. Backgrounds are
  pure `#FFFFFF` specifically so the images blend seamlessly with the white email
  background. Kit zip shipped & QA'd.
- Later single-hero winner (folio-era, reusable): `yourlogo45.jpg` — ONE vial close-up
  at ~45° with a dashed "YOUR LOGO HERE" label placeholder (gpt-image-2 edit of the
  real BPC-157 navy render, `nh-hero-yourlogo-45.mjs`, candidate c2 of 3). The user
  rejected multi-vial lineup heroes twice ("still looks ugly") before this.

### 4.b The 48-email wholesale build — "Maritime Pharmaceutical" (`email_campaigns/noble_harbor_wholesale/`)
- **Origin:** user supplied `~/Downloads/# Noble Harbor Email Build.zip` — a
  **DCLogic design-canvas kit**: `.dc.html` files using a custom `sc-for`/`sc-if`
  template framework + `emails-data.js` + `_ds` design tokens (`nhs-tokens.css`) +
  `assets/vial-your-brand.png`.
- **Matrix: 48 emails = 2 audiences × 8 storefronts × a 3-email arc.**
  - Audiences: **`sw` = Switchers** (already selling peptides, exposed — narrative
    arc: fear → license → proof) and **`st` = Starters** (not yet selling — arc:
    opportunity → entry-risk → proof).
  - Storefronts: **clinic / medspa / pharmacy / gym / functional / other / supp /
    conv** (conv = convenience).
  - Arc: **Email 1 (Day 0) "Why Noble Harbor"** — 2×2 benefit grid, plus a navy
    "Global Peptide Market" panel ($140.9B → $294.6B) for **Starters only**;
    **Email 2 (Day 3)** — lab-stats 2×2 (**99.7% / 100% / 5 days / $0**);
    **Email 3 (Day 7)** — private-label vial hero (**BPC-157 · Lot NH-BPC-2147-A ·
    99.82%**).
- **Extracting the 48 assembled records from the kit:**
  `cp emails-data.js x.mjs; node -e "import('x.mjs').then(m=>...JSON.stringify(m.EMAILS))"`
  — it exports `EMAILS` assembled from its CTA/SF/COPY/AUD tables; paragraph copy uses
  `**bold**` markers.
- **Design "Maritime Pharmaceutical":** paper `#E7E9ED`, card `#FCFCFB`, navy
  `#0b2545`, Fraunces serif + Inter Tight + IBM Plex Mono, `Lab № 04 / 99.7% avg
  purity` masthead detail, navy "MADE IN THE USA" band (band later folded into /
  removed in favor of the slim baked masthead — see §2.5).
- **Rebuild:** the source kit used flex/grid (Outlook-unsafe) → rebuilt as email-safe
  **TABLE HTML via `build.py`**, emitting all 48 + `preview/` + `send-ready/` (the
  private-label vial is base64-embedded on the 16 Email-3s; the rest are imageless) +
  an index board + README.
- **Wiring:** CTA/footer → `nobleharborsciences.com/wholesale-apply` with per-email-id
  UTM (a later pass rewired the APPLY CTA to
  `https://www.nobleharborsciences.com/apply`); masthead → site; unsubscribe →
  `mailto:bryan@nobleharborsciences.com?subject=Unsubscribe` (bryan@ is also the from
  address). Merge tag `{{first_name}}`. **Sender = "Bryan J, Wholesale Partnerships".**
- **Real logo swap:** masthead text-wordmark replaced with the real
  `logo-final.png` (user: "use the real logo not a made up one"); vertical spacing
  tightened throughout per user.
- **Dark-mode hardening + final masthead:** full saga and landed rules in §2.5.
  Current state = slim baked navy header bar (`nh-header.png`), plain "Hi
  {{first_name}}," lead, navy content panels UNLOCKED (Gmail-managed), vial card baked
  as one white PNG with rounded corners.
- **Ship:** `Noble-Harbor-Wholesale-Emails.zip` on Desktop. 6 test emails sent via
  Gmail SMTP; hosted assets verified public 200.
- **RUO caveat:** the kit footer has CAN-SPAM but NO RUO line (reproduced faithfully)
  — offer to add "For Research Use Only. Not for human consumption."

### 4.c Earlier / adjacent Noble Harbor campaign history (context)
- **v1 template pair (2026-06-23):** `email_1.html`/`email_2.html` + hero/feature
  graphics per brand, part of a 3-brand template deliverable.
- **v3 "Dialed-learnings" pass:** centered mono credential chip replacing label bands,
  logo bumped to 208px, headlines 44px / body 17px / stats 36px, centered stacked
  products, 2×2 trust grids, hero = `hero_lineup.jpg` (5-compound lineup: BPC-157
  navy / GHK-Cu green / NAD+ babyblue / TB-500 red / Ipamorelin purple) built as an
  HTML/CSS→Chrome montage from real high-res renders (no image-gen needed). CTAs:
  01 "Explore the Full Library" · 02 "See the COA Library" · 03 "Start Your
  Application".
- **v4 "Volume № 04" FOLIO campaign** (superseding v3): full rebuild on the site's
  archival-folio system (§1.3 tokens), 3 emails — 01 "White-labeled at the molecular
  level." → `/catalog` · 02 "Every batch ships with the proof." → `/coa-library` ·
  03 "From application to your first run." → `/wholesale-apply` — each carrying a
  "Product catalog attached · Volume № 04 · PDF" chip, `{{UnsubscribeURL}}` merge
  tag, RUO everywhere. Included: `build_assets.py` (USA seal SVG→PNG, category hero
  lineup, 30+ catalog plates), `build_emails.py`, and
  `catalog/build_catalog.py` → **15-page letter PDF
  `Noble-Harbor-Catalog-Vol-04.pdf`** (cover "The Library." + TOC, The Standard
  (COA + Principles I–IV), The Program (Steps I–V), all 32 products in 2×2 plates by
  category with verbatim doses/blurbs + Request-pricing links, back "Fold. Cut.
  Ship." page; 240 URI links, 0 internal anchors). Missing renders (B-12,
  CJC-1295+Ipamorelin Blend) were generated on-model via gpt-image-2 edits of
  verified refs. COA document sets exist in two styles: clean straight folio docs
  (`_coa_doc.html` template, per-compound with real CAS/MW/m-z data, purity varied
  99.1–99.5%, unique doc/lot numbers) AND the user-preferred **tilted-sticker hi-res
  style** (`nh-coa-hires-set.py`, Chrome scale-factor 6, transparent 8334×8742).
  Note: GLP-1 naming — catalog letters are compounds: (S)=semaglutide,
  (T)=tirzepatide, (R)=retatrutide; the "GLP-1 (S)" COA uses semaglutide CAS
  910463-68-2, the GLP-3 (R) COA uses retatrutide CAS 2381089-83-2.
  Vial normalization for plates: `nh_vial_tools.py` (shadow-immune bbox —
  strong-content threshold + density filter; plain getbbox catches soft shadows and
  shrinks vials). The rotated USA seal's bottom-arc "upside-down" lettering is
  intended vintage-stamp styling — don't fix.

---

## 5. Generation playbook

### 5.1 Model choice
- **Vial product renders: Nano Banana Pro** (Gemini image model) via
  `node nanobanana.mjs --batch <file>.json` — it reproduces the master render
  pixel-faithfully from a reference image. Render at **4K** to match the line
  (2K is only ~20% faster — not worth the mismatch).
- **Email heroes / white-label mockups / clinical white packshots: gpt-image-2 EDIT**
  (`/v1/images/edits`) with the real vial renders passed as reference images —
  gpt-image-2 holds the small NH label text better than Nano Banana in this style.
- Never hand-composite generated parts to fake fidelity; iterate the prompt with
  references. (The user explicitly REJECTED a deterministic Pillow text-composite for
  the 10ml variant — "looks composited on" — and rejected deterministic background
  whitening; they want real generation even though each frame re-rolls.)

### 5.2 New product variant — the locked workflow
1. `node nh-build-batch.mjs "PRODUCT NAME"` — builds the batch JSON, referencing the
   matching `Noble Harbor Wholesale/BPC-157/BPC-157_<size>_<color>.jpg` master per
   variant and injecting the locked cap hexes into each prompt.
2. `node nanobanana.mjs --batch <file>.json` (~10 min on Nano Banana Pro).
3. Move + rename outputs into `Noble Harbor Wholesale/<ProductName>/`.
Never write one-off prompts that diverge from the locked label spec. A different
container (capsules, nasal spray) = a separate sub-system with its own new master.

### 5.3 Size/volume variants — exact-reproduction-edit prompt pattern
- Method: pass the approved source image as the SOLE reference + a locked-framing
  prompt that changes ONLY the target text. Verbatim prompt clauses that are load-
  bearing: **same camera framing / zoom / crop / vial scale; pure `#FFFFFF` seamless
  background with no marks; ONLY the volume number changes** (e.g. "5 ml" → "10 ml").
  For dose stamping: "xx mg" → "10 mg" with a **BACKGROUND-CRITICAL pure-white**
  block in the prompt.
- Source mapping: amber tokens reproduce from `<Product>_3ml-dark_<color>.jpg`
  (change "3 ml" → "5/10/20/30 ml"); clear 20/30 from the 5 ml clear; 10ml from the
  5ml clear.
- **Canary-first:** generate 2–3 canaries (navy/white/yellow/black archetypes) for
  approval, THEN batch the rest.

### 5.4 QC — deterministic pixel math, flag on DELTA not absolute
- Coarse VLM twin-compare (`nh-qc-10ml.mjs`, Gemini) MISSES subtle smudges — don't
  trust it alone. The reliable check is python pixel math (`nh-verify-10ml.py` /
  `nh-verify-10mg.py` / `nh-verify-sizes.py`): key metric = **wblock** (worst small
  background BLOCK's darkness — catches a localized dark smudge even at <1% of the
  bg), plus global smudge % and framing vs twin. Background is sampled OUTSIDE the
  per-image vial+cap silhouette and ABOVE the base shadow (cut at 0.74·H); downsample
  to ~720px.
- Score guide: clean colored-cap ≈ wblock 0–3; real smudges 25–120; WHITE caps have a
  ~17 noise floor (judge visually — crimp-band mask noise causes false flags).
- **Flag a variant only when NOTABLY WORSE than its own source twin: wblock delta
  > 25, or global-smudge delta > 4.** The user accepts faint cloudiness that matches
  the approved line; absolute thresholds over-flag.
- `nh-10ml-sheets.py` builds 5ml | 10ml | dose-zoom contact sheets for eyeballing.
- Smudge-prone colors: **yellow, purple, babyblue, pink, white**.

### 5.5 Fixing smudges (Nano Banana adds them model-side on ~5% of draws)
1. **Best-of-N:** generate 4 candidates from the same clean ref, auto-keep lowest
   wblock (`nh-bestof-select.py` / `nh-sizes-fix.py` with early-stop). Fixes most.
2. **Ref-swap (for stubborn product+color combos that smudge on 100% of draws):**
   swap the reference to a CLEAN same-color SIBLING product's image and change only
   the product name in the prompt — yields wblock 0 every time. ALWAYS visually
   verify the swapped-in name spelling (especially "NAD+", "GHK-Cu").
   Keep replaced originals as `.pre-fix`.
- Single re-rolls and "force pure-white bg" prompt overrides do NOT reliably work.

### 5.6 Text gotchas
- **Lowercase "ml"** — the model drifts to "mL"; harden prompts with an explicit
  clause: **"lowercase m, lowercase l, never mL"** (verified working).
- Spell every on-label string exactly in the prompt; verify spellings visually after
  generation (NAD+, GHK-Cu are the usual casualties).
- Never use the "xx mg" placeholder assets in customer-facing work.

### 5.7 Batch-run operational facts (hard-won)
- The refreshed Gemini key **throttles concurrent 4K super-linearly**: conc=6 ≈
  0.2/min; conc=4 ≈ 1/min; **conc=1 serial ≈ 33s/job is FASTEST — always run serial**.
- Laptop sleep pauses runs (wall-clock ≫ active time).
- `Noble Harbor Wholesale/` sits on a **cloud-synced volume** — `readFileSync` can
  ETIMEDOUT and kill a run; batch drivers must retry FS reads/writes
  (`nh-sizes-batch.mjs` does; `nh-sizes-supervise.sh` auto-relaunches until the
  target count is on disk). Drivers support env `CONC` / `IMG_SIZE` / `TIMEOUT_MS` /
  `LOG`, skip-existing resume, and per-request abort timeouts.

### 5.8 Email build / render gotchas
- `build.py` (48-email build) is SLOW (~60–90s; Python 3.14 + base64 inlining ×48) —
  wait for "built 48", don't kill it. Run python build scripts with an ABSOLUTE
  script path from a neutral cwd (relative-path runs hit a `_path_abspath`
  PermissionError under the sandbox).
- Reusable HTML→Chrome asset render:
  `chrome --headless=new --force-device-scale-factor=2
  --default-background-color=00000000 --virtual-time-budget=8000
  --screenshot=out.png --window-size=W,H file:///tmp/x.html`
  (transparent bg via `00000000`; virtual-time budget lets Google Fonts load).
  Design baked assets at DISPLAY size in a 640-CSS layout @2x — sizing for the
  pixel canvas renders 2× too big/clipped.
- `render.sh` (HTML→PNG preview pipeline) needs ABSOLUTE html/png paths, a real
  window height (never 0), and a bg hex WITHOUT '#' (e.g. `f5f7faff`) — Chrome fails
  silently otherwise, leaving a stale old PNG.
- Headless Chrome CANNOT emulate a mobile viewport (`--window-size=360` still lays
  out at desktop width) — verify mobile with an injected always-on media-query +
  JS overflow detector, and ultimately on a real phone.
- Chrome `--print-to-pdf` DROPS #fragment internal links — never ship in-document
  anchors in a PDF; use web URLs.
- Chrome high-scale screenshots can capture MID-PAINT — use
  `--virtual-time-budget=45000` for heavy pages and always eyeball card bottoms.
- ffmpeg composites from a lavfi `color=` source MUST add `-frames:v 1` or the
  image2 muxer errors ("Cannot write more than one file with the same name").
