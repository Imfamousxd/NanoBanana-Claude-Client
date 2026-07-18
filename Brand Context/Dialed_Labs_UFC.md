# Dialed Labs (× UFC)

Standalone brand knowledge base. Everything an AI content app needs to produce on-brand Dialed
Labs work with zero prior context. Repo root referenced below:
`/Users/mario/Desktop/Cursor Projects/NanoBanana-Claude-Client/`.

---

## 1. Brand identity

**Dialed Labs** is a premium **cold-plunge, infrared-sauna, red-light-therapy and hyperbaric
wellness/recovery equipment brand**. Site: **dialed-labs.com**. Member of the "Dialed" family
(sister brands: Dialed Health = clinical peptide supplements, Dialed Moods = nootropic canned
beverages) — but Dialed Labs is its own distinct umbrella brand.

- **Tagline:** "Your Personal Wellness Lab."
- **Secondary taglines / voice:** "Hot. Cold. Dialed." · "Engineered for peak performance &
  recovery" · "hot and cold for maximum recovery."
- **OFFICIAL PARTNER OF UFC.** The "UFC | DIALED LABS · Official Partner of UFC" lockup is
  printed on the products themselves (visible in site product photos), so the claim is verified
  and safe to state in any collateral.
- **CRITICAL — what Dialed Labs is NOT:** it is NOT a peptide / research-compound / supplement
  brand. There is **NO "Research Use Only" / RUO / "not for human consumption"** language,
  ever. That compliance line belongs ONLY to the wholesale research-peptide brands NuLumin and
  Noble Harbor. (User corrected this explicitly on 2026-06-23 — earlier "Research, dialed in. /
  RUO" framing was WRONG.)

### Palette

| Role | Hex |
|---|---|
| Near-black base (bands, cards, site bg) | `#0a0a0a` |
| Charcoal secondary | `#141416` |
| Champagne / brass gold (primary accent) | `#c5b36f` |
| Brighter gold | `#d4a853` |
| Gold-foil gradient (CTA / foil rules) | `#fcf6ba → #d4a853 → #bf953f → #8b6914` |
| Email-v5 gold trio (cards on dark) | `#C6A15B / #D8B978 / #EFD79B` |
| Dark gold (readable numerals on white) | `#a5842f` |
| UFC red (use SPARINGLY — urgency only) | `#c8102e` (site) / `#D8232A`, `#E0776F` (email v5) |
| White + muted grey | `#FFFFFF`, `#9AA0A8` |
| Thermal accent — ember (sauna heat) | `#E2A24B` |
| Thermal accent — ice blue (cold plunge) | `#7FB3D5` |
| Warm-ivory stat panels (email v7) | `#f5f0e4` |

(Older email files used gold `#C9A24B` / `#E8C766` — retuned to `#c5b36f` / `#d4a853`; do not
reuse the old values.)

### Logo & type

- Logo = gold **"DIALED"** + white **"LABS"** wordmark. The white "LABS" is invisible on white —
  **the logo always needs a dark band/background.** Site source file:
  `dialed-labs.com/images/dialed-logo-white.webp`.
- Use the **logo only, NOT the UFC lockup**, in email mastheads (user removed a `ufc-partner.png`
  add — UFC appears as a small centered chip under heroes when used at all).
- Type: **bold UPPERCASE sans headings; mono for small labels.** Email design system: **Oswald**
  condensed 300/500 headlines (`'Arial Narrow'` fallback) + **Barlow** body + **Space Mono**
  technical labels (`FIG.01`, `SOURCE —`, spec rows). Google Fonts link with graceful fallbacks.

### Product line (REAL, scraped from dialed-labs.com product pages 2026-07-05 — 14 SKUs)

**Infrared Saunas** (all 194°F Harvia heater / 230V / WiFi):
- Barrel Sauna — **$10,499** (6-person)
- King — **$12,999** (8-person)
- Pro — **$9,500** (4-person)
- Smart Pod — **$8,500** (3–4 person, IR + red light combo) — hero product of the Airbnb campaign
- Queen — **$6,500** (1-person)

**Cold Plunges** (all 119 gal, ChillStream™/NanoPure™ filtration, standard 15A outlet — the
"no plumbing / plugs into a normal outlet" objection-killer):
- Pro Pod — **$11,499** (14°F, 2hp CryoFreeze™)
- Vertical (Wood or Black) — **$6,499** (37°F, upright seated)
- Pod — **$5,999** (recline)
- Air — **$3,499** (inflatable, portable)

**Red Light Beds** (48k LEDs, 633–940nm, 220V/30A):
- Vertical — **$21,999**
- Horizontal — **$19,999**

**Hyperbaric Chambers:**
- Horizontal 1-person — **$16,999** (110V)
- Two-Person — **$32,000** (220V)

**Commercial terms (real, verified):** 180-day warranty on all units · Affirm financing
(`/financing`) · ships 3–5 days from CA · site promo: **Free Cold Plunge with select sauna
purchase** (= SAVE $6,499) · **installation is handled by Dialed Labs** (user requires this
stated in all collateral). Support/unsubscribe address: `support@dialed-labs.com`. Instagram:
`instagram.com/dialedlabs` (verified from site source).

**URL patterns:** product pages live at
`dialed-labs.com/collections/<category>/<product-slug>` (e.g.
`/collections/infrared-saunas/barrel-sauna`). GOTCHA: slugs ≠ image names (e.g. `king-sauna` →
actual slug `king-size-infrared-sauna`). Nav categories (live sitemap): **Infrared Saunas ·
Cold Plunge Tubs · Red Light Beds · Hyperbaric Chambers**. STR landing page:
`https://www.dialed-labs.com/for/airbnb`. Product photos = site og:image URLs
(Supabase/Firebase-hosted).

---

## 2. Locked visual rules (hard rules + why)

1. **No RUO / research language ever.** Dialed Labs sells wellness equipment to consumers and
   hosts — RUO belongs only to NuLumin/Noble Harbor. (User correction 2026-06-23.)
2. **Logo lives on a dark band.** White "LABS" disappears on white. In email, the band's black
   must be a **baked image**, not live CSS (see Gmail dark-mode rules below).
3. **UFC red is an accent for urgency only** — never a dominant color.
4. **Client's locked email rules (apply to ALL future Dialed Labs emails):**
   - NO "offer" framing — the pitch is a **revenue play for the property owner**, not a discount.
   - Big / bold / digestible type; no tiny hard-to-read text.
   - **STRICT center-axis symmetry** — nothing left/right split; stacked centered blocks.
   - No emojis. Even, consistent CTA padding.
   - **Every button/shortcut/hyperlink must be functional** — dead links get wired or removed
     ("View in browser" was removed because it can't work without ESP hosting; unsubscribe →
     `mailto:support@dialed-labs.com?subject=Unsubscribe`).
   - ONE template at a time: perfect it → get approval → move to the next.
5. **No invented pricing.** A design comp once shipped fake was/save anchors — replaced with the
   real from-prices ($3,499 plunge / $6,500 sauna / $19,999 redlight) and the real offer banner
   (free plunge = SAVE $6,499). Always use the real price list above.
6. **"Dr.-Approved" style claims are dropped** — not used.
7. **Full-bleed flush images, no borders** (user hated borders); white email body so white-bg
   figures sit flush.
8. **UFC trailer video rules (locked):** NO logos in clips · NO faces in sparring/bag clips ·
   no start-frame stills (straight text-to-video) · always 1080p · real-time speed, never
   slow motion · "shadow figure" = dim-lit photoreal human, never a black silhouette cutout.
   (Full detail in the playbook, section 5.)

---

## 3. Asset map (paths)

**⚠ 2026-07-13: `email_campaigns/` was found EMPTY at one point** (prior campaign folders had
been cleaned/moved out of the repo). Always re-check what's actually on disk before assuming a
folder exists. Paths below are where things lived when built.

- `Dialed x UFC/` — repo-root folder for the UFC trailer work (created after kickoff).
- `email_campaigns/dialed_labs/` — original 2-template identity build (`email_1.html`,
  `email_2.html`, `*.preview.png`, `assets/hero_banner.png`, `assets/feature.png`,
  `assets/logo.png` = gold DIALED + white LABS; graphics generated from
  `gfx_hero.html`/`gfx_feature.html`). Gallery: `email_campaigns/_gallery.png`; checklist:
  `email_campaigns/README.md`.
- `email_campaigns/dialed_labs/airbnb_outreach/` — the 5-email STR sequence + v5 3-email
  "Claude Design" sequence (`email_01_offer.html`, `email_02_return.html`,
  `email_03_upgrade.html`), `assets/` (heroes, `anim_*.gif` 33–384KB, product shots
  `prod_plunge/sauna/redlight.jpg`, dark packshots `prodx_*/prod_*.jpg` via
  `dl-dark-prods.mjs`), `build_dist.py` → `dist/` + `airbnb_outreach_templates.zip`,
  galleries `_campaign_gallery.png` / `_campaign_v3_gallery.png`.
- `email_campaigns/dialed_labs/airbnb_outreach/catalog/` — `catalog.html`,
  `Dialed-Labs-Amenity-Catalog.pdf` (17 pages), `images/` + `images/_orig/` (pre-pad
  originals).
- `email_campaigns/dialed_labs_airbnb/` — the newer "Email Board" campaign: `build.py`
  generator, 5 angle templates + `06-colorado.html`, `preview/`, `send-ready/`, `index.html`
  board, `README.md`, `images/` (`dialed-logo.png`, `dialed-logo-onblack.png`, `px-black.png`,
  `px-gold.png`, `btn-<id>.png` baked CTA buttons, `e6-install.jpg`, `e6-chart.jpg`,
  `e6-btn.png`, `dialed-sig.png`).
- `email_campaigns/remotion/` — Remotion 4.x project: animated footer comp `dialed` (600×280)
  + 4 layout-video templates `DialedLogoReveal` / `DialedKineticHeadline` / `DialedFeatureCard`
  / `DialedStatCounters` (1280×720, 5s); `src/theme.ts` brand tokens, `src/dialed/common.tsx`
  helpers (`<BrandTag>`), `src/lib/loop.ts` sine loops, `make_gif.sh`.
- `email_campaigns/render.sh` — reusable HTML→PNG (headless Chrome @2x + trim.py).
- Repo root: `sb_upload.py` (Supabase uploader), `send_campaign_tests.py` (Gmail SMTP test
  sender).
- Desktop: `Dialed-Airbnb-Email-6-wired.html` (copy of email 6), final campaign zip (~2.1MB).
- Hosted images: Supabase Storage, project `fmtuqieexvsmlqkdznbb`, **public bucket
  `email-assets`**, URL pattern
  `https://fmtuqieexvsmlqkdznbb.supabase.co/storage/v1/object/public/email-assets/email/<file>`.

---

## 4. Campaigns run (status, deliverables)

### (a) Dialed Labs × UFC giveaway trailer — video (active/ongoing, clip-by-clip)

- **Model:** Seedance 2.0 on Replicate — slug is **`bytedance/seedance-2.0`** (with the dot;
  a prior wrong-slug mistake is documented — don't repeat it).
- **Flow:** the user describes ONE clip at a time ("a slow push-in on X with Y motion, 5s,
  9:16…") → generate on demand. No storyboard, no batch.
- **Defaults:** 9:16 unless told otherwise · 5s unless told otherwise · **always
  `resolution: "1080p"`** (Seedance 2.0 max) · **NO logos** — generic-but-on-brand atmosphere
  only.
- **Sparring/heavy-bag clips: straight text-to-video, no `image` parameter, no start-frame
  still** (wasted spend — it's a montage, not character continuity), and **no visible faces**.
- Status: multiple clips delivered iteratively; constraints below were learned on clips 2 and 6.

### (b) Airbnb / STR host email campaign — the big one (shipped, iterated v1→v8 + board build)

**Premise:** B2B cold-email pitching saunas/plunges as a short-term-rental amenity. Product
anchor = **Smart Pod Infrared Sauna ($8,500)**. All CTAs funnel to dialed-labs.com (UTM'd);
current CTA destination: `https://www.dialed-labs.com/for/airbnb`.

**v5 "Claude Design" 3-email sequence** (`email_01_offer` / `email_02_return` /
`email_03_upgrade`, Day 1/4/8): sharp editorial design system — **square corners, card
`#0A0A0C` on `#0A090C`, gold `#C6A15B`/`#D8B978`/`#EFD79B`, UFC red `#D8232A`/`#E0776F` for
urgency only, Oswald 300/500 condensed + Barlow + Space Mono**, FIG. plates, dotted-leader
spec rows, gold-gradient CTA (2px radius). `N°0X` header bands were REMOVED in the client
pass (client hated them); UFC chip centered under the hero on all 3. Subjects (v6 conversion
pass): "leaving $1,100/mo on the table" / "Paid back in one season" / "Get it before peak
season". Email titles: 01 "The Revenue Play" (46px headline "Make your property earn more per
night", 34px gold stat trio +$50 / +$1,100 / ≈7mo, 2×2 includes grid, 360px CTA "See what
your listing could earn") · 02 "The Payback" ("It pays for itself. Then it pays you.") ·
03 "The Guest Experience".

**Persuasion levers used (keep for future emails):** unit economics ("napkin math": +$50/night
× 22 nights − $437 Affirm = **+$663/mo cash-flow-positive from month one**), financing < lift,
CPA §179 depreciable-asset note, seasonality (winter fills a soft calendar), objection removal
(no plumbing, standard 15A outlet; installation handled by Dialed Labs), compounding reviews,
case file (A-frame, Joshua Tree: $219→$278 ADR, 61→84% occ, +$2,340/mo, 6.2-mo payback),
cost-of-waiting ($1,100/mo left on the table).

**17-page Amenity Catalog PDF** (`Dialed-Labs-Amenity-Catalog.pdf`, letter size): cover, UFC
page, 14 product pages, host-program back page. Built `catalog.html` → Chrome
`--print-to-pdf`. **Fully clickable — 90 URI annotations**: photo + product name → real
product URL, "or $X/mo · Affirm" → `/financing`, gold "View at dialed-labs.com ›" chip, TOC →
collection URLs, contact = mailto + site + instagram; dead "Reply to this email" replaced by a
gold **"Email Us to Book"** mailto button. **Image-pad technique:** the `.photo` frame is
exactly 2:1 with object-fit:cover, but og-images were 1.25–1.79 AR (up to 38% cropped) — fix
= pad every image to EXACT 2:1 by pasting 1px edge strips stretched outward (seamless,
gradient-preserving); originals kept in `catalog/images/_orig/` so the pad script is
idempotent. All 5 emails carry a gold "Amenity catalog attached" chip; zip includes the PDF
under `attachment/`.

**build_dist.py kit:** emits `dist/` (email-optimized JPEGs 39–175KB, relative `images/`
refs) + `airbnb_outreach_templates.zip` for ESP zip-import; rerun with
`--base-url https://…/` once assets are hosted for paste-HTML senders (Instantly/Smartlead).
Gmail clips emails >102KB — heavy send-ready files may clip.

**"Email Board" build (`dialed_labs_airbnb/`, 2026-07-13):** parsed a 19MB Miro-style board
export into 5 clean ~7–8KB templates via `build.py`. Angles: 1 Women (sauna-render hero) ·
2 Winter/"Remember last January?" (Jan-calendar graphic) · 3 Wellness guest (spend-bars) ·
4 Stand out (Airbnb-search mockup) · 5 Social/"Guests don't post the couch" (IG mockup).
Final design v7: WHITE body, dark #0a0a0a masthead+footer bands with the real logo,
warm-ivory `#f5f0e4` stat panels with gold-foil left edge + big `#a5842f` numerals, sleek
BLACK button with gold text, left-aligned body with centered headlines/stats/CTA. Later
"personal-letter" pass: magazine kicker + big headline dropped — emails lead with the
personalized greeting. Merge tags: `{{FirstName}}` / `{{City}}` / `{{MailingAddress}}` only.
**Email #6 "A host in Colorado did the math"**: story-driven, two 9:16 heroes (sauna install
photo + iPhone earnings screen, hosted as `e6-install.jpg`/`e6-chart.jpg`), baked gold CTA
`e6-btn.png` → `/for/airbnb`, personal "Drew T" signoff + baked `dialed-sig.png` logo chip.

**Gmail dark-mode engineering (hard-won, reuse everywhere):**
- The user's Gmail FULL-inverts colors, and CSS dark-mode hooks
  (`prefers-color-scheme`, `[data-ogsc]`/`[data-ogsb]`) **do not work — never chase the CSS
  swap again.**
- WORKING FIX: **bake the brand color into the logo PNG** (`dialed-logo-onblack.png` = gold
  DIALED + white LABS composited on a #0a0a0a rectangle) **and lock the band with a hosted
  tiling background-image** (`px-black.png` 24×24 solid pixel) — Gmail recolors
  background-colors and text but never background-images or PNG pixels.
- Lock a background ONLY where an IMAGE sits on it; any surface with LIVE TEXT must stay
  UNLOCKED so Gmail converts bg+text together and preserves contrast.
- CTAs washed out in inversion → **baked image buttons** (`btn-<id>.png`, HTML→Chrome render,
  480×64 @2x, black gradient + 1.5px gold #c5b36f border + radius 11 + Oswald 600 gold
  `#ecdaa0` caps + arrow, transparent corners), emitted as `<a><img></a>`, responsive
  (`width:100%;max-width:350px`).
- Gmail blocks base64/data-URI images and clips >102KB → host images at real https URLs
  (Supabase bucket above).
- User rule: every dark-mode fix must apply the correct inverse in light mode (baked bands
  satisfy this by being identical in both).

### (c) Early email identity ("dark/teal performance-lab") — superseded

The first `email_campaigns/dialed_labs/` build (2026-06-23) styled Dialed Labs as a dark
performance-lab identity with teal-ish accents and gold `#C9A24B`/`#E8C766`. When the user
supplied the real logo and site, the identity was corrected to the real dialed-labs.com
palette (dark #0a0a0a + champagne gold #c5b36f/#d4a853, thermal ember/ice accents). Treat the
early teal/performance-lab look as historical only — the current identity in section 1 wins.
Also from that era: the Remotion animated footer (`dialed`, 600×280) — footers are **brand
banners only** (logo + tagline + ambient sine-loop motion); nav/social/legal live as real
clickable HTML in `footers/<brand>/footer_email.html`. Audio/EQ bars were removed from the
Dialed footer.

---

## 5. Generation playbook

### Video (UFC trailer + any Dialed Labs motion)

**Model:** `bytedance/seedance-2.0` on Replicate (create prediction → poll `urls.get` until
`succeeded`). Always `resolution: "1080p"`. Default 9:16, 5s. Text-to-video for
sparring/bag/atmosphere clips (no `image` param).

**Framing to hide faces (default for fight content):** tight torso-and-gloves crops with the
head above frame, over-the-shoulder/back-of-head angles, low-angle waist-down legs+bag, macro
on knuckles/canvas, rim-lit from behind. Hero subjects = hands, gloves, forearms, lats,
shoulders, footwork, bag motion, dust, chain swing, sweat. Only show a face if the user
explicitly asks for a hero-portrait clip.

**Real-time pacing (never slow motion):** a clean jab-hook-cross takes ~1.0–1.5s total — fit
multiple combos into a 5s clip, or one combo + settle + second combo. Write explicitly:
"**real-time normal 24fps playback speed, NOT slow motion**". Give per-punch timings totaling
under ~1.5s (e.g. "JAB at 0.3s, HOOK at 0.6s, CROSS at 0.9–1.2s") then describe the
post-combo settle. Reframe blur language as "natural motion blur from the limbs moving fast
at 24fps with a standard 180-degree shutter — at real-time playback speed" — NEVER
"slow-shutter" / "long-exposure" (those push Seedance into slow-mo). Runners/pad-work: real
athletic speed, world streaking past at real-time.

**Avoiding the "AI look" (Seedance defaults read too clean/rendered):** replace abstract
words ("cinematic", "hyperrealistic", "IMAX-grade") with:
- **Named camera + glass:** "shot on ARRI Alexa Mini LF with anamorphic Cooke S7/i lens",
  "RED Komodo with Sigma Cine primes", "Sony FX6 with vintage Lomo anamorphics".
- **Real artifacts:** anamorphic oval bokeh, lens flare/streak in the key light, slight
  halation around bright highlights, organic film grain, gentle barrel distortion, micro
  focus hunt when the subject moves fast, occasional micro-shake from an op-held camera,
  sensor noise in shadows.
- **Imperfect framing:** "slightly off-axis", "framed loose, the subject drifting toward the
  edge", "lens slightly tilted".
- **Set/wardrobe imperfections:** "creased and sweat-darkened shirt", "scuffed knuckles",
  "scratched wall paint with a faint chip", "uneven concrete with hairline cracks".
- **Named grade/stock:** "Kodak Vision3 500T pushed one stop", "Alexa LogC graded with cool
  teal shadow lift" — not "filmic".
- **Motivated light:** "single tungsten work-light gel'd full CTB casting a hard cool key
  from upper camera-left" beats "cool light from camera-left".

**"Shadow figure" interpretation:** a fully rendered photoreal human in dim/low-key lighting
— identity obscured by hood, distance, low light, or framing, NOT a flat black silhouette.
Skin, muscle, fabric texture, limb motion blur, sweat/rain all visible. Prompt language:
"dim low-key lighting", "underexposed photoreal figure", "identity obscured by hood and
shadow but body, gait, and motion fully readable", "subtle rim light defines shoulders and
arms". Banned words: "silhouette", "black silhouette figure", "pure shadow".

### Stills

- `gpt-image.mjs` (gpt-image-2) for clean text/UI/typography and photoreal product hero
  stills (dark packshots on `#0A0A0C` via a `dl-dark-prods.mjs`-style edit script).
- `nanobanana.mjs` (Gemini 3 Pro Image) for hyperreal lifestyle / heavy reference-fidelity
  work.

### Email / HTML graphics

- Table-only `role=presentation` layout, centered 600px container, all critical CSS inline,
  `<!--[if mso]>` PixelsPerInch block, hidden preheader, alt on every img. NO RUO footer for
  this brand.
- Reusable HTML→PNG render: `email_campaigns/render.sh "<abs html>" "<abs out.png>" W H
  bg_rgba pad` — needs ABSOLUTE paths, a real window height (never 0), bg hex WITHOUT '#'.
  Chrome fails silently leaving a stale PNG.
- Baked-asset render pattern: `chrome --headless=new --force-device-scale-factor=2
  --default-background-color=00000000 --virtual-time-budget=8000 --screenshot=out.png
  --window-size=W,H file:///tmp/x.html` (transparent bg, fonts get time to load).
- **Mobile-testing gotcha:** headless Chrome cannot emulate a mobile viewport
  (`--window-size=360` and iframe harnesses both render at desktop width → false overflow).
  Inject media-query rules as always-on + use a JS `getBoundingClientRect` overflow detector;
  ultimately verify on a real phone. Preview desktop emails at **640px** window width (600
  triggers the mobile breakpoint).
- ffmpeg compositing gotcha (logo-on-band assets): lavfi `color=` source loops frames — add
  `-frames:v 1` or the image2 muxer errors.
- Chrome `--print-to-pdf` DROPS `#fragment` internal links (0 GoTo annotations) — never ship
  in-document anchors in a PDF; use web URLs.
- Remotion GIF law: **every frame carries full content** (Outlook shows frame 1) — ambient
  motion only (breathing glows, shine sweeps, crossfades). Scrolling tickers are GIF-hostile
  (500KB+); use static text + shine sweep instead.
