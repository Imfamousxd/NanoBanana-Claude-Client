# Muha Meds

App-ready brand knowledge base. This file is self-contained: everything needed to generate on-brand Muha Meds images and video (identity, locked rules, asset paths, campaign history, and generation playbook) is written out below. All paths are relative to the NanoBanana-Claude-Client repo root unless they start with `~` or `/`.

---

## 1. Brand identity

### What the brand is

**Muha Meds** is a cannabis / THC vape & concentrate brand.

Packaging tagline (verbatim, from the master-case template):

> "Muha Meds is a spiritual wellness movement providing alternative medicine, for an enhanced quality of life."

### Muha Meds vs. Muha Members (critical naming rule)

- **"Muha Meds"** = the product brand.
- **"Muha Members"** = the loyalty-program / giveaway program name.
- **Giveaway assets spell "MUHA MEMBERS" — never "MUHA MEDS".** (A euro-postcard raffle card v1 was rejected for saying "MUHA MEDS".)

### The Muha Members logo (exact description)

A **blue scallop-edged badge with a checkmark on the LEFT** + a **gold wordmark "Members"** — ONE ornate baroque gold capital "M" joined to lowercase "embers", with **® at the end**.

- Real logo file: `AI Fruit VIdeos Muha/refs/MMembers Logo.png` (7556×2512, transparent PNG — blue scallop check badge + ornate gold "M·embers" wordmark; composites cleanly over photos).
- **gpt-image-2 tends to garble this logo** (extra M / misspellings). Never recreate it from imagination — **pass the real file as a reference image and instruct the model to reproduce it faithfully** ("copy exactly, do not redesign"). See Playbook §5.
- Related marks in `AI Fruit VIdeos Muha/refs/`: `mm-gold.png` (gold winged-"M" crest) and `mm coin.png` (the real gold "MUHA MEDS · INHALE EXCELLENCE · 2019" coin).
- A gold interlocking Muha "M" monogram is used on the GTA/Vice-City giveaway posters.

### The "AI Fruit" character universe

10 Pixar / Cinema-4D 3D fruit-flavor CHARACTERS, one per flavor. The head IS the literal fruit with cartoon features; all read as young adults; unified Pixar 3D (see §2 for the hard rules). Canonical approved art: `AI Fruit VIdeos Muha/Generated Characters/<Name>.png`. Personality writeups: `AI Fruit VIdeos Muha/CHARACTERS.md`.

Full cast + locked personalities:

| # | Character | Personality (locked) |
|---|-----------|----------------------|
| 1 | Aloha Passion Rush | seductive tropical heartbreaker / Bond-girl bombshell |
| 2 | Arctic Blueberry | REDESIGNED 2026-06-03: effortlessly-cool nonchalant chill guy with DRIP — literal round blueberry head w/ snow cap, iced diamond Cuban-link chain, diamond watch, light-blue stylish hoodie + ripped jeans, tall/big, chill smirk. (Earlier "broody hurt male" → "chad" versions are obsolete.) Script: `muha-fruit-arctic-blueberry-v12-hoodie.mjs` |
| 3 | Blue Slushie | REDESIGNED 2026-06-03: vibrant gamer E-GIRL — slushie head + pink cotton-candy space buns, white cat-ear RGB gaming headset (NO mic), e-girl blush, pink/blue split tank + striped arm warmers + pleated skirt, peace sign, knee-up framing, RGB gamer room. (Old "brain-freeze drama queen" is obsolete.) Script: `muha-fruit-blue-slushie-v7-egirl.mjs` |
| 4 | Frosted Mint Cookies | shy bashful ADULT (first pass looked like a kid — see adult rule §2) |
| 5 | Frozen Pomegranate | mean popular girl (Regina George vibes) |
| 6 | Galactic Diesel | badass cosmic rebel (cyberpunk/space outlaw; purple ringed-planet head) |
| 7 | Guava Mango | pure-joy laughing sunshine |
| 8 | Horchata | passionate flamenco dancer |
| 9 | Lemon Cherry Fizz | smart, quietly beautiful nerd girl (CHANGED from "sassy bratty pop diva"); cherry EARRINGS not pigtails; tortoiseshell glasses; book in hand |
| 10 | Watermelon Bubblegum | playful, openly gay skater guy (CHANGED from "kawaii woman"); full whole-watermelon head with green-stripe rind, BUBBLEGUM HAIR (pink gum quiff on top), gum bubble blown; dreamy outdoor bubblegum-world background instead of an interior wall |

Every character must be visually + emotionally distinct — different pose, expression, vibe — but co-exist in the same telenovela / drama world. Outfits: modern trendy contemporary clothing (not couture, not fantasy, not royal); Y2K / popular-girl casual unless the personality demands otherwise.

### Brand voice / aesthetic register

- Premium, hype, giveaway-driven: dark-luxe gold/navy sweepstakes energy on giveaway assets; juicy saturated Pixar fruit-world energy on character assets; euro-luxury nightclub sophistication on the euro flavor lines.
- Suspense → wanderlust → hype is the locked video arc for the Euro Summer campaign.
- 21+ product; giveaway assets carry disclaimers ("No Purchase Necessary", 21+).
- The euro flavor-brand thesis: premium nightclub/luxury brands never lead with cannabis leaves/smoke — **that's why they read premium**. Drop the leaf.

---

## 2. Locked visual rules (hard rules — every one has a WHY)

### Character construction rules

1. **The head IS the literal fruit.** The entire head + face is the whole fruit with stylized SIMPLE CARTOON Pixar features embedded INTO the fruit surface — angled stylized brows in a darker fruit tone, cartoon almond eyes with a simple highlight, subtle nose-bump (no sculpted nostrils), mouth as a slightly deeper fruit-tone shape (no separate human-lipped mouth glued on). Head shape = the fruit shape (spherical for blueberry, etc.), NOT a human skull with chin/cheekbones/jaw. 100% fruit-skin coloring across the ENTIRE face — no peach cheeks, no pink lips, no human flesh-tone anywhere (pomegranate character = 100% pomegranate-red face; cookie character = 100% cookie-brown face). Negative-prompt: "no realistic human nose with nostrils, no realistic human lips, no human cheek/jaw bone structure, no human flesh tone anywhere."
   *WHY:* the default failure mode is a photoreal human face (real eyes, sculpted nose/lips, jawline shading) pasted onto a fruit-shaped head — the user explicitly corrected this on Arctic Blueberry v6.

2. **Every character is a YOUNG ADULT (early-to-mid 20s) — never a child, teen, chibi, or kawaii-infantilized figure.** Include an explicit age anchor: "young adult woman (early-20s)" / "young adult man (early-20s)". Mature proportions (1:7 head-to-body ratio), defined adult facial structure, adult-sized eyes (not oversized kawaii), adult lip shape, adult body curves. Even shy/sweet personalities render as adult shy/sweet (reserved adult barista), never childlike. Avoid "petite", "tiny", "doe eyes", "sweet" framing cues.
   *WHY:* cues like "petite" + "doe eyes" push the model toward child-like rendering — the user corrected this on Frosted Mint Cookies, which came out looking like a kid. This is a THC brand; kids are unacceptable.

3. **Unified Pixar 3D across the ENTIRE character — no photoreal body.** Lock the render style as: "hyper-detailed Pixar / Cinema 4D / Octane 3D render, animated-feature-film look, unified Pixar-3D stylization across the entire character (head + face + hands + clothes), NOT photoreal, NOT live-action, NOT a real human-photo body with a cartoon head pasted on. Hands are PIXAR-CARTOON hands, clothes are PIXAR-CARTOON clothes." Avoid the words "photorealistic", "photoreal materials", "real fabric weave", "real skin", "subsurface scattering" anywhere in a character prompt.
   *WHY:* those tone words pushed Watermelon Bubblegum v4's hands and outfit into live-action photorealism while the face stayed cartoon — a jarring cartoon-head-on-photo-body mismatch. The approved characters used "hyper-detailed Pixar / Cinema 4D / Octane 3D render" alone and came out unified.

4. **Anatomy lock (always include):** "EXACTLY TWO ARMS, EXACTLY TWO HANDS, five fingers each — no extra limbs."
   *WHY:* multi-arm bugs happen otherwise.

### Flavor-badge rules (the glossy badge series in `Flavor Badges/`)

5. **No black/white strokes — color-themed strokes only.** Letter outlines use a deeper/saturated tone of the letter's own fill color (deeper yellow/amber on a yellow "LEMON", deeper berry on a strawberry letter, deeper green on a melon letter). Decor elements: minimize hard outlines entirely; if separation is needed, use a deeper tone of the element's own color. Black/white strokes ONLY when truly necessary for legibility (pale-on-pale). Internal layering (gradient fills, glossy highlights, drop shadow) stays — the rule is specifically the OUTLINE/STROKE color.
   *WHY:* the user prefers strokes that reinforce flavor identity over generic black+white outlines (explicit correction on Lemon Cheesecake's "LEMON": black → yellow stroke, then generalized to all future badges).

6. **Vary typography across the set.** Do NOT default every badge to "bold-bubble-first-word + brush-script-second-word". Distribute across a batch: some ALL bold 3D bubble-block (Blue Slushie, Blueberry Cookies, Bubblegum Burst, Strawberry Runtz, Tahoe OG), some ALL flowing brush-script (Magic Melon Og, Pineapple Express, Sour Watermelon Squirt), some mixed bubble + script (Frozen Pomegranate, Lemon Cheesecake). Match treatment to flavor energy: aggressive/impact (Grape Stomper, Strawberry Lava) → all-bubble; soft/dessert/elegant (Peaches & Cream, Cinnamon Cream OG) → all-script; clear noun+adjective split → mixed.
   *WHY:* a batch that all used the same bubble-top/cursive-bottom layout was flagged; variety makes the line look like a real curated brand rather than templated output.

7. **Text always in FRONT and unobstructed.** Every letter sits fully on top of everything, completely visible. No fruit, leaf, splash, drip, or decorative element may overlap, cross, or sit in front of any letter — elements go BEHIND the text and peek out around outer edges/corners only.
   *WHY:* badges are used small; obscured letters kill legibility.

8. **No cannabis flower or bud — ever.** Even for "Kush"-named flavors (Blackberry Kush, Pineapple Kush): no marijuana buds, nugs, flowers, or weed leaves anywhere. "Kush" stays styled text only; use fruit/tropical elements instead.
   *WHY:* bud/flower imagery is off-brand/unwanted.

9. **Badge style = hyperrealistic glossy 3D render (LOCKED), not cartoon vector.** High-end premium product-packaging aesthetic, Cinema 4D / Octane Render quality. Letters: chunky 3D extruded, glossy candy-coated plastic / polished resin / polished glass finish; real specular highlights from a studio key light; real reflections; real subsurface scattering where appropriate; rim outline in a deeper saturated tone of the fill (NOT black/white); real shadows underneath. Decor: photoreal fruit (textured rind, dewy droplets, visible seeds, translucent flesh), real food (crumb texture, SSS cream, glossy curd drizzles), real liquid (refraction, surface tension, suspended droplets), real material surfaces, real AO + cast shadows. Lighting: soft studio key upper-left, warm/cool fill per flavor palette, subtle rim; match light mood to flavor (bright daylight citrus, moody cool night-themed, warm hearth autumn). Transparent background (rendered as the light-grey+white checkerboard transparency grid), no outer white sticker border, no scene/rectangle/surface plane.
   *WHY:* the initial 14 badges were cartoon vector; the client said they wanted "less of a cartoon vibe and more realistic glossy vibe" — the redone Lemon Cheesecake v1 and Midnight Espresso v1 were approved as the new direction (2026-05-21).

10. **New badges ALWAYS use existing badges as reference images.** Pass one or more of the premade `*_realistic_v1.jpg` badges from `Flavor Badges/` as refImages and say "match the EXACT art style of the reference." Do NOT use the legacy cartoon `Flavor_01–10` refs (they pull toward vector).
    *WHY:* text-only prompts drift wildly off-family — a first Pineapple Kush attempt with no ref was rejected for exactly this.

### Lettering rule (logos / wordmarks — distinct from badges)

11. **Logo/badge WORDMARKS = animated-cartoon title style, NOT realistic glossy-candy 3D.** Soft rounded bubble caps, soft matte-ish shading, thick cream rounded outline — like a Pixar/DreamWorks/mobile-game title card, friendly and toy-like. Prompt language: "animated-movie / cartoon title lettering, soft cartoon finish, NOT hyper-realistic, NOT glassy candy gloss, NOT photographic." Reserve heavy Octane/C4D glossy-candy phrasing for backgrounds/objects, not the wordmark.
    *WHY:* repeated regenerations (Orange Dream galaxy badge) were rejected as "too realistic"; the exact complaint was "the text is too realistic, it should be animated style" (background realism was fine). NOTE the scope split: the glossy-render rule (#9) is for the flavor BADGE series; this animated-text preference applies to logo wordmark recreations.

---

## 3. Asset map

### Repo folders that exist for Muha

- `AI Fruit VIdeos Muha/` (note the typo "VIdeos" — capital I — is the real folder name)
- `Flavor Badges/`
- `Muha Giveaway Assets/`
- `Muha Giveaway Redesigned/`
- `Muha Euro Summer/`
- `Cactus Cloud x Muha/` (a collab — no notes on it in memory)
- `euro Music theme/` (lowercase "euro" — euro-music flavor logo project)

### Character universe assets

| Asset | Path |
|---|---|
| Canonical approved character art (10 PNGs, Title Case with spaces) | `AI Fruit VIdeos Muha/Generated Characters/<Flavor Name>.png` |
| Downscaled character refs (~1024px, ~120KB JPGs — use for multi-ref calls) | `AI Fruit VIdeos Muha/Generated Characters/_small/*.jpg` |
| Personality writeups for the full cast | `AI Fruit VIdeos Muha/CHARACTERS.md` |
| Flavor badge PNGs (10, ALL CAPS with spaces) | `AI Fruit VIdeos Muha/AI fruit Muha Flavors/<FLAVOR>.png` |
| Style example (banana/strawberry/carrot drama scene) — human sanity-check ONLY, never a generation ref (contaminates) | `AI Fruit VIdeos Muha/Character Example/character to recreate.png` |
| Group cast shot — FLAWED (contains a wrong Arctic Blueberry: blue humanoid, not blueberry-head hoodie guy); do NOT use as cast authority | `AI Fruit VIdeos Muha/Group Truck Shot/2026-05-30T23-09-09_muha-group-truck-2x1.png` |
| Working-script output convention | `generations/<timestamp>_<flavor>-NB.png` → copied to Generated Characters |

### Brand refs (`AI Fruit VIdeos Muha/refs/`)

- `MMembers Logo.png` — THE real Muha Members logo (7556×2512 transparent)
- `mm-gold.png` — gold winged-"M" crest
- `mm coin.png` — real gold "MUHA MEDS · INHALE EXCELLENCE · 2019" coin
- `truck frront.png` — the black Ford F-150 (note double-r typo in filename)
- `mustang key.jpg` — black Mustang smart-key fob, chrome running-horse pony emblem
- `tech-line-border.png` — gold tech-line/circuit-trace border ref
- `raffle ticket dimensions.png` — physical ticket die spec
- `master case ref.png` — original black Von Dutch master-case template
- `front master case.png` — front panel split ref (no side rails)
- `sides maset case.png`, `Layer 1.png`, `Layer 2.png` — side-panel split refs
- `qr-mask-right.png` — alpha mask, right third editable (x≥1360/2048), left two-thirds locked
- `qr-panel-ref.png` — gold QR panel style ref (cropped from user's Europe Summer Trip ticket)

### Raffle cards (`AI Fruit VIdeos Muha/Raffle Card Designs/`)

- Master template: `2026-05-31T02-02-35_muha-raffle-A-characters-only-v14.png`
- Final picks: `Approved Raffle Cards/` (incl. euro postcard A-stacked + C-banner)
- Mustang front evolution: `Per-Character Mustang/` → `Per-Character Mustang v2/` → `Per-Character Mustang v3 fullbleed/` → **`Per-Character Mustang v4 consistent/` = CURRENT FINAL fronts**
- Backs evolution: `Per-Character Backs/` → `Per-Character Backs No-QR/` → `No-QR v2/` → `FINAL/` (2 only) → `Plates/` → `No-QR v3/` → `Per-Character Backs v4 QR-space/` → **`Per-Character Backs v5 QR-panel/` = CURRENT FINAL backs**, with print files in `Per-Character Backs v5 QR-panel/Print 90x43mm/` (`*_90x43mm.png`)
- `Euro Summer/` — euro-postcard-style back exploration (separate track)

### Master case + giveaway posters

- Master case outputs: `AI Fruit VIdeos Muha/Master Case Designs/`
- GTA anchor ref: `Muha Giveaway Redesigned/Win Cash + Challenger.png`
- GTA follow-up outputs: `Muha Giveaway Redesigned/Giveaway Extended/`
- Older screenshot-edit track: `Muha Giveaway Redesigned/Approved/Members Raffle Card.png` (scripts `muha-raffle-ss-edit.mjs`, `muha-content-raffle-to-giveaway.mjs`)

### Bud Island video (`AI Fruit VIdeos Muha/Bud Island Intro/`)

- `00_opener_budisland_v2.mp4` (APPROVED photoreal opener; `00_opener_budisland.mp4` = rejected cartoony 16:9 v1, ignore); `..._v2.png` = the NB Pro 9:16 still it was animated from
- `01_entrance_<slug>.mp4` ×10 (aloha, blueberry, slushie, cookies, pomegranate, diesel, mango, horchata, lemon, watermelon)
- `02_mingle_aloha_blueberry`, `02_dance_party_trio`, `02_toast_cheers`, `02_mingle_joke`
- `BUD_ISLAND_intro_v1.mp4` — full 83s assembled cut

### Euro music theme (`euro Music theme/`)

- `Muha Flavor Brand Direction.docx` — the 9-nightclub-brands brief
- `Muha_Meds_Brand_Direction_Brief.pdf` — "Flavor Reference Archive" (13 luxury/auto brands; render pages via `pdftoppm`, poppler installed)
- `Current Strain Graphics.pdf` — existing rough logos, cropped to `strain refs/<Flavor>.png`
- `ref 1.png` … `ref 9.png` (note the typo `reg 6.png`) — original concept logos
- `strain refs/` — incl. `monaco mango truffle.png`, `dc-10.jpeg`, `canary island punch.PNG`, `blue marlin berry.PNG`, `Pacha Peach Gelato/` (5 imgs)
- Outputs: `Generated/NN_Name_LOGO_vN.png` and `Generated/<Flavor>_vN.png`
- City backgrounds: `Backgrounds/<Flavor>_BG_vN.png`
- Luxury icons: `Lux Icons/<Flavor>_<Brand>_vN.png`, approved → `Lux Icons/Approved/<Flavor>.png`

### Flavor Badges (`Flavor Badges/`)

- Legacy cartoon finals: `Flavor Badges/Approved/`
- Realistic finals: `<Flavor>_realistic_v1.jpg` (fruit-behind-text versions `_v4.jpg`); `Sunset_Sherbet_gpt_v1.png`
- Locked prompt templates: `Flavor Badges/lemon-cheesecake-realistic.json`, `Flavor Badges/midnight-espresso-realistic.json`; per-flavor model `pineapple-poison-fix.json`
- Scripts: `flavor-badges-edits-v2.mjs` / `-v3.mjs` (single-pass, failed re-layering), `flavor-badges-edits-v4.mjs` (final two-pass fruit versions)

### Euro Summer campaign (`Muha Euro Summer/` + external)

- `Muha Euro Summer/refs/` — `ticket.jpg` ($25k raffle card w/ gold QR panel), city paintings, `front_<city>.jpg` (EURO SUMMER card fronts, red-die-cut-cropped), `startframe_paris_aerial.jpg` (1080×1920, 18's aerial-Eiffel end frame)
- `Muha Euro Summer/Clips/` — clip output dir (repo does NOT hold the rendered mp4s; user keeps them), incl. `_liked_endframe.jpg` extracted stitch frames
- `Muha Euro Summer/HANDOFF.md` — full clip-project details (incl. the verbatim `DARK` block context)
- `Muha Euro Summer/Giveaway Posts (gpt-image-2)/Muha_EuroSummer_{Amalfi,Santorini,Spritz,Paris}.png` — DELIVERED still posts
- `Muha Euro Summer/Giveaway Posts/Muha_EuroSummer_{01_Amalfi,02_Santorini,03_Spritz}_4x5.png` + `04_Eiffel_Story_9x16.png` — superseded HTML-pipeline set
- **User's rendered/liked mp4s: `~/Movies/Muha Euro Summer/Clips/`** (e.g. `09_ticket_12.mp4`) — NOT in the repo
- **Runnable working copy (macOS TCC workaround): `~/Movies/Muha Euro Summer/_work/`** — contains `eurosummer-clips.mjs` + `.env` + start frame; run `cd _work && node eurosummer-clips.mjs <slug>`; output under `_work/Muha Euro Summer/Clips/`
- Moodboard zip: `~/Downloads/Euro references -...zip` (Amalfi, Santorini, Positano, Paris, boarding passes, spritz, café) — contains the gold/navy **"$25,000 Europe Summer Trip" lockup** as `ChatGPT Image ...01_40_21 PM.png` (1536×1024 RGBA transparent)
- Scratchpad scripts: `scratchpad/gen-euro-gpt.mjs` (approved gpt-image-2 poster generator), `scratchpad/gen-euro-heroes.mjs` (NB hero backgrounds), `scratchpad/build-euro-posters.py` (superseded HTML compositor)

### Client assets — `~/Downloads/Magnetic Disposables/`

- **10 city×flavor SKUs:** SANTORINI/Bubble Gum · MYKONOS/Amnesia Lemon · MONACO/Jack Herer · CANNES/Blueberry Muffin · SICILY/Apple Gelato · CANARY/Diesel · AMALFI/Habibi · IBIZA/Purple Punch · SARDINIA/Pineapple Runtz · LONDON/Skywalker OG
- Raffle/insert cards: front = painted city scene + "MUHA, TAKE ME TO …" wish-quote in blue bubble caps + MUHA MEDS logo; back = "$25,000 Europe Summer Trip" vintage-map card w/ gold QR panel
- `Insert Cards/Euro Summer Giveaway/Old Version/V2/Card art/` = CLEAN city paintings, no text. Timestamp→city mapping: 11_21_52=Monaco, 11_24_46=London, 11_28_37=Cannes, 11_29_59=Ibiza, 12_20_42=Sicily (Etna + red Fiat), 12_22_18=Sardinia, 12_32_26=Mykonos, 12_38_06=Canary, 12_39_21=Santorini, 12_40_57=Amalfi/Ibiza-like sunset town, 12_42_22=Monaco palace variant
- `Assets/Stamps/Cities/` = engraved one-color passport stamps (e.g. "SICILY ★ 03 AUGUST 2026")
- `Assets/Stamps/OG Flavors/Colored/` = engraved flavor stamps; plus separate glossy-3D flavor badges (Jack Herer style, matches the glossy badge rule §2.9)
- `Assets/Strains/Gold Device|Black Device/` = disposable device art per strain

### Script inventory (repo root unless noted)

Characters: `muha-fruit-<flavor-slug>-vN.mjs` pattern (e.g. `muha-fruit-arctic-blueberry-v12-hoodie.mjs`, `muha-fruit-blue-slushie-v7-egirl.mjs`).
Master case: `muha-mastercase-vN.mjs`, `muha-mastercase-v9-front.mjs` (holds the coordinate-locked prompt), `muha-mastercase-v13-front.mjs`, `muha-mastercase-v13-side.mjs`, `muha-mastercase-front-v7.mjs`, `muha-mastercase-front-v8.mjs`, `muha-mastercase-wholesale.mjs`, `muha-mastercase-wholesale-fix10.mjs`, `muha-mastercase-wholesale-cast.mjs`, `-cast-v2.mjs`, `-cast-v3.mjs`, `-cast-v6.mjs`, `-cast-v7.mjs`, `place-members-logo.py` (PIL compositor — rejected approach, kept).
Raffle cards: `muha-raffle-A-gpt-v14.mjs`, `muha-raffle-B-gpt-v15.mjs`, `muha-raffle-C-gpt-v29.mjs`, `muha-raffle-char01-aloha-gpt.mjs`, `muha-raffle-chars-batch-gpt.mjs`, `muha-raffle-chars-fix-logo.mjs`, `muha-raffle-lemon-fix.mjs`, `muha-raffle-chars-mustang.mjs`, `muha-raffle-backs-mustang.mjs`, `muha-raffle-backs-noqr.mjs`, `muha-raffle-backs-qr-panel.mjs`, `muha-raffle-euro-postcard.mjs`, `muha-raffle-euro-postcard-v2-20k.mjs`, `muha-raffle-euro-summer*.mjs`.
GTA giveaway: `muha-giveaway-extended-v4.mjs`.
Video: `eurosummer-clips.mjs` (Euro Summer generator, repo root), `seedance-run.mjs` (generic job-JSON runner), `budisland-entrances.mjs`, `budisland-groups.mjs`.

---

## 4. Campaigns run

### 4a. 2026 Ford Mustang giveaway — master-case poster (evolution → front-only v7)

**Status: v7 wholesale-cast fronts are current best; awaiting final pick.** Prize history: Ford F-150 XLT (spelled **F-150 XLT**, not "XTL"; band says **10 STRAINS**, not "STRAWS") → dropped → **sleek BLACK FORD MUSTANG**.

Evolution (what was tried, what stuck):
1. **Black-template replication phase** — faithfully reproduce `refs/master case ref.png` (black Von Dutch kustom pinstripe, F-150). v3/v5-FRONT approved for LAYOUT only. Vegas/Miami reskins with cast (v1/v2) rejected.
2. **Fruit-drama reskin** — keep v5 layout, restyle to Pixar/C4D/Octane Miami-Vice neon with the 10 characters around the F-150. Then theme corrected to **colorful FRUIT with only a HINT of frost** (v20 "too icy"; v21 = the mark).
3. **Winning layout technique (v9, locked):** gpt-image-2 EDIT with the approved front as image[0] (structural ground truth) + a COORDINATE-LOCKED prompt pinning all 15 layout zones as normalized [x,y,w,h] boxes, instructing "change ONLY (1) the visual style and (2) the central hero-zone interior." Text-only restyles kept reinventing the grid. The full coordinate prompt lives in `muha-mastercase-v9-front.mjs` — reusable.
4. **Panel-constraint rule:** each box panel = self-contained flat rectangle, clean margin, nothing bleeds across fold lines; never render the die-cut carton shape. **Top-guardrail rule:** the top band (dust-flap tagline → guard line → blank logo box → winged emblems → headline) must be clean; full-panel edits re-roll it, so generate several candidates and pick the cleanest top (prompt-only; masked inpaint wipes the body on gpt-image-2).
5. **v12–v13 split refs:** front and sides generated separately from split refs; top logo zone left BLANK for the designer to drop the real Members logo.
6. **FRONT-ONLY PIVOT (v7-front, 2026-06-08):** the full dieline was judged "too generic and ugly to work with." New deliverable = the FRONT PANEL as a self-contained portrait poster, **1024x1536** (closest gpt-image-2 size to the real ~624×1010 panel). Dark-luxe first pass (v7) → restyled (v8 lock): **"GIVEAWAY" headline in BLUE, "WIN A FORD MUSTANG" in WHITE**, full-bleed no border, much less gold (only the MM coin stays gold), lush glossy 3D fruit-world background.
7. **Wholesale stripped variant + the duplicate-character saga:** stripping badges/QR/bands off v8 caused duplicated/cloned characters. Group Truck Shot as "cast authority" FAILED (it contains a wrong Arctic Blueberry). **RELIABLE FIX (locked): pass the 10 INDIVIDUAL character refs from `Generated Characters/_small/*.jpg` + a numbered per-character checklist + the rule "exactly 10, each once, zero duplicates, ignore the refs' text banners/backgrounds, and every fruit-headed character's HEAD IS THE ACTUAL FRUIT — do NOT humanize."**
8. **Members-logo saga → accepted method:** reserved-band + PIL composite (`place-members-logo.py`) BOTH rejected ("do not composite the logo, regenerate the entire graphic to include it"). **Accepted method (v6): pass `refs/MMembers Logo.png` as an extra reference image and prompt "faithfully REPRODUCE the Members logo from reference image 12 at the top, copy exactly, do not redesign."**
9. **Current best: `muha-mastercase-wholesale-cast-v7.mjs` → `2026-06-09T06-04-20_*v7-c1/c2.png`** — Members logo at top (from ref), GIVEAWAY/WIN A FORD MUSTANG, 10 unique characters, black Mustang on stage, full-bleed, NO QR, NO bottom tagline.

### 4b. Muha Members raffle cards (F-150/$20k era → Mustang v4)

**Status: fronts final in `Per-Character Mustang v4 consistent/`; backs final in `Per-Character Backs v5 QR-panel/` (+ 90×43mm print files). Euro postcard A-stacked + C-banner approved.**

- **Physical spec (locked):** real sticker ticket = **90×43mm (2.093:1)**; generation size 2048×1024 is 2.000:1 — print files need an aspect fix. Inner peel-off zone = 82×32mm ≈ 1866×762px centered. Fit-to-die solution: scale to 2048×978 (~4.5% vertical squash, imperceptible) + embed dpi (578.04, 577.69) = exactly 90.00×43.00mm.
- **Locked design system (original era):** ornate gold Art-Deco ticket border (filigree in 4 corners only, double gold rule + bead, NO edge-midpoint starbursts, border is topmost layer — nothing crosses it); midnight-navy-purple body + faint gold pinstripe/micro-dot; hero lockup = Members logo → "GIVEAWAY" in chunky 3D vintage-Vegas gold-with-magenta-shadow → cream "WIN A FORD F-150 XLT"; Pixar/C4D/Octane 3D style; Miami-neon Vegas-strip bg on ensemble cards. Master template = `2026-05-31T02-02-35_muha-raffle-A-characters-only-v14.png` (always ref #1).
- **Three card families:** (1) Ensemble layouts A/B/C/D — approved A-characters-only-v5 (master), B-tailgate-v4, C-truck-hero-v7 (29 versions!), D-with-qr-v4. (2) 10 per-character solo cards — left 50% typography, right 50% character on per-character palette; Lemon/Diesel/Mango needed `-logofix`, Lemon a 2nd `-fix2`; all approved. (3) Euro big-letter postcard — vintage 1950s travel postcard, block letters spell **"MUHA MEMBERS"** (11 letters, each a window onto a European city: Monaco/Paris/Rome/Venice/Barcelona/Santorini/Amsterdam/London/Prague/Swiss Alps/Athens), headline **WIN $20,000** (full number, never "$20K"); v1 was wrong ("MUHA MEDS", no prize); v2-20k fixed; A-stacked + C-banner approved.
- **Mustang v2→v4 redesign (fronts):** each character HOLDS UP the Mustang key fob (`refs/mustang key.jpg`); "GIVEAWAY" in **BRIGHT luminous electric-blue** (first pass too dark), "WIN A FORD MUSTANG" in **PURE WHITE**; border went gold filigree → gold tech-line circuit (`refs/tech-line-border.png`) → **v3/v4 FULL BLEED, border removed entirely** (text ~40px safe inset). Text consistency = PROMPT-ONLY: one canonical card (v3 diesel) passed as "master text lockup" ref + TEXT_LOCK instruction (~90% consistent). Script `muha-raffle-chars-mustang.mjs` (slugs as CLI args, 3 concurrent, `findAnchor()` auto-anchors).
- **Backs:** character + Pixar-3D **2026 Ford Mustang (S650, glossy piano-black on ALL 10)**, headline "WIN A / 2026 FORD / MUSTANG" on three lines ALL WHITE 3D-beveled, Members logo top. v4 QR-space = composition pulled into LEFT ~68%, RIGHT ~32% intentionally EMPTY for a REAL QR in post. **v5 QR-panel (FINAL): mask-inpaint** (`muha-raffle-backs-qr-panel.mjs`, mask `refs/qr-mask-right.png`) fills the right third with a gold QR panel matching `refs/qr-panel-ref.png`: deep-black panel, gold corner-bracket frame, "Your Encrypted / Raffle Entry Ticket.", gold-on-black QR with baroque gold Muha "M" center, "Scan In Members App. / To Redeem 10 Entries!", "Raffle ID: G2T6A03" pill (placeholder, `RAFFLE_ID` env), "No Purchase Necessary". QR is decorative — swap a real scannable QR for production. **Reusable technique: to add a fixed panel to approved art, alpha-mask + inpaint the region, never full-regen.**
- **Recurring failure:** the Members wordmark garbles (extra M / misspelling) — needs an explicit logo-spelling lock + re-rolls.
- **What worked:** the master-template-as-ref system; per-character palette; mask inpaint for panels; prompt-only text lockup; individual `_small` character refs.

### 4c. GTA Challenger giveaway — "$25,000 Cash + Dodge Challenger" Vice-City posters

**Status: active/delivered; photoreal look LOCKED.**

- **Locked art/theme** (anchor: `Muha Giveaway Redesigned/Win Cash + Challenger.png`): glossy deep-red Dodge Challenger on a wet neon-reflecting Miami street at night, red-lit skyline + silhouetted palms, stacks of $100 bills, gold interlocking Muha "M" monogram, deep-black bg, distressed vintage-gold bold-condensed all-caps GTA loading-screen type with soft red glow.
- **"Giveaway Extended" follow-up (2026-07-01):** 4:5 format — gpt-image-2 edit can't do 4:5, so rendered via **Nano Banana Pro** (`muha-giveaway-extended-v4.mjs`, aspectRatio 4:5, 2K/4K), passing the master poster + a dialed-in render as refs. **Locked layout:** Muha "M" logo at the TOP edge (never mid-poster splitting headline from prize line); kicker; hero "GIVEAWAY EXTENDED" (client likes the big hero); "$25,000 CASH + DODGE CHALLENGER" grouped right under the hero as a legible subtitle (~1/3 hero height); car + cash fill lower ~45%; NO thin gold divider rule (client dislikes it).
- **GTA hooks must logically map to the giveaway.** Front-runner: **"THE HEIST IS BACK ON"** (prize = the score). Alternates: "STILL TIME TO MAKE THE GETAWAY", "OVERTIME IN VICE CITY". **Rejected:** cheat codes / "CHEAT CODE: HESOYAM" (confusing), "NEW OBJECTIVE" (out of place), ★★★★★ 5-star wanted level (already used previously).
- **Lester Crest easter egg + hard style lock:** client loved "LESTER JUST CALLED" with a subtle Lester (bald, glasses, plaid short-sleeve shirt, phone to ear) in the bg. A full-scene NB regen to enlarge him DRIFTED the poster into illustrated GTA-cover cartoon — client hated it. **FIX: never regen the scene; EDIT the approved PHOTOREAL render (single ref) and hammer "keep 100% PHOTOREALISTIC, do NOT illustrate/cartoon/comic/cel-shade" in prompt + negative.** "Flashy" prize line = subtle polished-gold + faint red neon glow, NOT garish.

### 4d. Euro-music flavor logos (9 → multiple workstreams of nightclub/luxury SKU logos)

**Status: multiple waves; several approved, some pending; Pacha Peach Gelato still broken.** Tool: **gpt-image-2** (2880×2880, quality high; no transparency → solid WHITE bg).

- **Locked rules:** these are FLAVOR BADGES — NO Muha logo/text/monogram of any kind; lead with the nightclub/destination THEME not fruit-forward produce; not every badge gets scenery (reserve scenic backdrops for a few); VARY format (stamps, shields, circles, free icon lockups); white bg; drop any cannabis leaf; one-at-a-time approval; wordmark always integrated INTO the logo (full lockup), woven creatively with the symbol (curved around medallions etc., not stacked under the icon — Scorpiog medallion v3 = exemplar); depth/dimension unless the brand doc calls for restraint; **each logo must correlate to the CITY the doc ties the brand to** (Loco Mango v3 = Es Vedrà + mango-as-sunset, the exemplar).
- Brand→city map: Keinemusik→Saint Tropez/Mykonos/Marbella; Scorpios→Mykonos/Bodrum; Afterlife→Hvar/Marbella/Sardinia; Circoloco→Ibiza/Sardinia; Pacha→Ibiza; Cercle→Paris/Cannes/Monaco; Boiler Room→Mykonos/Hvar/Ibiza; Ushuaïa→Ibiza; Hï Ibiza→Ibiza. Style cues: Keinemusik = hand-cut/jagged/tattooable; Scorpios = sculpted/embossed serif luxury; Circoloco = heavy condensed all-caps; Pacha = sensual pop-art cherries; Hï Ibiza = pure typographic w/ dieresis.
- **Wave 1 (abandoned after 3):** Kiwimusik Kush (APPROVED `01_..._LOGO_v4`), Scorpiog Punch, Afterlychee, Loco Mango, Pachaberry Ice, Cercleberry Dream, Boiler Berry, Ushuaiava, Hïberry Gelato.
- **Wave 2 — 10 CITY-named flavors** from `Current Strain Graphics.pdf`: 1 Saint Tropez Rosé (Riviera stamp; `_v1` = quality bar) · 2 Monaco Mocha→Cercle script (later superseded by Monaco Mango Truffle) · 3 Hvar Haze→Afterlife celestial gold/black · 4 Paris Dream→Cercle/Hï glossy nocturnal · 5 Ibizade Cherry→Pacha cherries · 6 Sardinia Limoncello→Boiler Room stamp · 7 Mykonos Kush→Scorpios minimal serif · 8 Bodrum OG→Scorpios scorpion+serif · 9 Cannes Peach→Cercle/Keinemusik peace motif · 10 Marbella Mango→Ushuaïa hot sunset (hummingbird+sun, NOT a mango).
- **City BACKGROUNDS workstream:** 16:9 3840×2160 animated-film matte paintings (Pixar/Disney semi-3D, NOT photoreal), prompt starts "A stylized ANIMATED-FILM skyline of <City>". **LOCKED: pure elevated skyline scenery only — NO cars, watches, storefronts, products, or people; the luxury brand is expressed ONLY through sky/lighting color palette.** Covers 10 NEW badge-less flavors (flavor · brand palette · city): London Berry·McLaren papaya·Thames; Budapest Melon·LV tan/gold·Danube; Barcelona Lychee·Balenciaga grey+lychee-pink·Sagrada; Milan Gelato·YSL black-gold+pastels·Duomo; Davos Cookies·Richard Mille red·Alps; Berlin Orange·Bugatti blue+orange·TV Tower; Prague Punch·Cartier red+gold·Castle/Vltava; Geneva Pear·Patek/AP navy+pear-green·Jet d'Eau; Maranello Hazelnut·Ferrari red·Emilian hills; Bologna Diesel·Lamborghini yellow-green·Two Towers. Approved: London `_v3`, other 9 `_v2`. TODO: backgrounds for the first 10 badge flavors.
- **LUXURY-BRAND ICONS workstream** (per `Muha_Meds_Brand_Direction_Brief.pdf`): compact CONTAINED badge/emblem centered on white (never full-page poster), original marks in the brands' spirit (never copy real trademarks), no letter monogram sigils. 2nd batch (8 flavors: Amalfi Spritz, DC-10 Diesel, Santorini Grape Pie, Amnesia Lemon Cherry, Pacha Peach Gelato, Mykonos Melon, Monaco Peach Truffle, Strawberry Matcha Bellini) = **FLAVOR-FORWARD** (skylines-in-icon rejected), "no-frame floating cluster + centered banner", "not too realistic / stylized", "switch up shapes (too many circles)".
- **Handoff state:** Canary Island Punch `_v6` LOCKED in Approved; Blue Marlin Berry `_v2` good as-is; Monaco Mango Truffle `_v3` unreviewed; DC-10 Diesel `_v2` (colored Ibiza club, lime, NO gas/fuel ever); Mykonos Melon `_afterlife_v5`; Amalfi Spritz `_v3`; Strawberry Matcha Bellini `_v7`. **STILL BROKEN: Pacha Peach Gelato** — the booty-peach keeps rendering as TWO peaches (`_v5` latest); needs ONE rounded peach w/ subtle crease (try a peach-emoji ref).
- Known error: gpt-image-2 fetch can time out (`UND_ERR_HEADERS_TIMEOUT`) — just rerun the script.

### 4e. Bud Island intro video

**Status: PAUSED (2026-06-08) at user's request — resume from the pending decisions.** Love-Island-style intro **"BUD ISLAND"** starring the 10 fruit characters, built clip-by-clip with **Seedance 2.0** (`bytedance/seedance-2.0` on Replicate). Output: `AI Fruit VIdeos Muha/Bud Island Intro/`.

- **Locked look:** 9:16 vertical, 1080p, Seedance audio ON per clip. Opener = plane skywriting "BUD ISLAND" → plane flies THROUGH the "D" → descent to a luxury villa — **photoreal/cinematic, NOT cartoony** (first glossy mobile-game 16:9 v1 rejected). Final opener `00_opener_budisland_v2.mp4` (animated from an NB Pro 9:16 still).
- **Character clips:** keep the cast ON-MODEL as their approved Pixar-3D fruit selves (stylized contestants in the realistic-ish villa) — never redesign realistic. Pass approved portraits as Seedance **`reference_images`** (NOT `image`/start-frame). Each does a signature Love-Island contestant entrance per personality. Use CURRENT personalities (e-girl Slushie, drip Blueberry) — older framings are WRONG.
- **504 fix:** full-4K portraits as base64 refs blow up the create call → HTTP 504. Pass downscaled `_small/*.jpg` (~1024px, ~120KB) refs and submit WITHOUT `Prefer: wait=5`. Single-portrait entrances OK at full res; groups need small refs.
- Delivered: approved opener + 10 entrances + 4 montage beats + `BUD_ISLAND_intro_v1.mp4` (83s ffmpeg concat: normalize 1080x1920/30fps h264+aac → concat demuxer).
- **Pending decisions on resume:** (a) tighten to ~40s w/ ~2.5s entrance beats; (b) one music bed (needs licensed track, or mute for user's editor); (c) more beats (fire-pit chat, beach walk, "bombshell arrives", recoupling); (d) leave v1 / user edits from the 15 clips.

### 4f. Fruit-drama character series

**Status: COMPLETE — all 10/10 characters approved (as of 2026-05-30, with Arctic Blueberry + Blue Slushie redesigned 2026-06-03).** (An older index note saying "5/10 approved + resume state" is stale — the project memory records completion.) Each character: unique personality, head IS the literal fruit, the flavor badge appears as a flat printed poster on the wall behind the character.

**Locked workflow:**
- **Model: Nano Banana Pro only** (`gemini-3-pro-image-preview`) — gpt-image-2 was rejected; NB renders fruit/3D better.
- 9:16, imageSize "4K".
- **References: ONLY the flavor badge PNG.** Never add the character-example PNG or previously-approved characters as style refs — they cross-contaminate the wall badge. Describe the Pixar-3D style purely in text.
- **Badge preservation:** the badge is a flat printed poster placed AS-IS on the wall. Strong negative: "do NOT redraw or restyle the badge poster — reference 1 placed AS-IS." (Saying "glowing neon sign" makes NB reinterpret the badge — learned on Blue Slushie.)
- Adult constraint, fruit-head construction, anatomy lock, unified-Pixar rule — see §2.
- Iteration loop: read badge PNG → write `muha-fruit-<flavor>-vN.mjs` → run in background → copy to `Generated Characters/`, open in Preview → iterate to approval → next flavor.

### 4g. EURO SUMMER — "$25,000 Europe Summer Trip" giveaway (deep dive)

The flagship 2026-07 campaign for **Muha Magnetic Disposables**. Two tracks: **still posts** and the **Seedance 2.0 video campaign**.

#### The product line: 10 city×flavor SKUs

SANTORINI/Bubble Gum · MYKONOS/Amnesia Lemon · MONACO/Jack Herer · CANNES/Blueberry Muffin · SICILY/Apple Gelato · CANARY/Diesel · AMALFI/Habibi · IBIZA/Purple Punch · SARDINIA/Pineapple Runtz · LONDON/Skywalker OG. Device art per strain in `~/Downloads/Magnetic Disposables/Assets/Strains/Gold Device|Black Device/`.

#### The raffle / insert card design

- **Front:** painted city scene + "MUHA, TAKE ME TO …" wish-quote in blue bubble caps + MUHA MEDS logo.
- **Back:** "$25,000 Europe Summer Trip" vintage-map card with a gold QR panel — "Your Encrypted Raffle Entry Ticket", "Scan In Members App. To Redeem 10 Entries!", Raffle/Giveaway ID: G2T6A03, "No Purchase Necessary".
- Supporting art: clean text-free city paintings (`Card art/`, timestamp mapping in §3), engraved city passport stamps ("SICILY ★ 03 AUGUST 2026"), engraved flavor stamps, glossy-3D flavor badges.

#### Video campaign — generator + settings

**Generator: `eurosummer-clips.mjs`** (repo root; runnable copy in `~/Movies/Muha Euro Summer/_work/`). Seedance 2.0 (`bytedance/seedance-2.0` on Replicate), **9:16, 1080p, 5s or 12s (`dur` field, up to 12 works), `generate_audio:true`**, `reference_images` downscaled to ≤1024px (504 fix). Run `node eurosummer-clips.mjs <slug|all>`. Refs in `Muha Euro Summer/refs/`, output `Muha Euro Summer/Clips/<slug>.mp4`. Rendered mp4s live with the user at `~/Movies/Muha Euro Summer/Clips/`, not in the repo.

**Creative arc (locked): suspense → wanderlust → hype.** Real-time pacing only (no slow-motion); realism anchors (name real cameras/lenses + real artifacts).

**The `DARK` film-language block:** a shared prompt constant in `eurosummer-clips.mjs`, **reused verbatim for all dark-macro clips**. Memory records its ingredients as: **ARRI macro, walnut table, one warm light shaft, dust motes, halation.** (The full verbatim text lives in the script and in `Muha Euro Summer/HANDOFF.md` — pull it from there; do not paraphrase-rewrite it per clip.)

**Card-front refs gotcha:** `refs/front_<city>.jpg` are auto-cropped INSIDE the red die-cut guide lines (red-mask bbox crop) — raw sheet crops leak red print guides into the video.

#### Clip-by-clip history (01 → 24)

| Clip | What it is | Verdict / notes |
|---|---|---|
| 01_ticket | Dark macro reveal of the $25k gold-QR card (ARRI/halation realism cues) | **THE winning direction** — user: "more like 01 ticket". Map labels garbled (fixed by 08) |
| 02_monaco | "Living painting" — camera pushes INTO the Monaco postcard, exact painterly style preserved, scene animates; NO photorealism drift, no text | Batch 1 |
| 03_ibiza | Same living-painting treatment, Ibiza | Batch 1 |
| 04_fan | 3 cards fanned like a poker hand | v1 went OFF-MODEL (Seedance redesigned the cards into portrait white-border postcards; kept as `04_fan_v1_offmodel.mp4`). Fixed with hard locks: "wide LANDSCAPE-format… reproduced 1:1… no white borders, no portrait cards, no re-arranged layouts" |
| 05_flip | Ibiza front flips to the $25k back | KEEPER |
| 06_qr | Macro gold-QR glint track | KEEPER (minor micro-text garble at extreme macro) |
| 07_stack | Cards dealt one by one | KEEPER |
| 08_ticket_flat | 01 retake, card square to camera | KEEPER — text-perfect ticket reveal; the fix for 01's garbled map labels |
| 09_ticket_12 | 12s suspense ticket clip | KEEPER (mid-clip text perfect; final map push softens 2 tiny city labels). **Its RENDERED end frame drifted off-script into a macro of a real-looking airliner flying low over the printed Europe map (Brandenburg Gate landmark, gold ticket panel top-right) — the user LOVES this plane-over-map shot; treat it as the true stitch point** |
| 10_dealfan_12 | 12s deal-fan | KEEPER (Seedance adds a slim white playing-card border — acceptable) |
| 11_flip_12 | 12s flip | Hit Seedance **E005 sensitivity flag** on "two fingers … building tension" phrasing → rephrased to "a hand calmly enters and pauses". Its ENDING is the preferred QR-glow beat |
| 12_qrglow_12 | 12s QR glow | v1 misspelled "Redemn" → retake w/ letter-by-letter spelling lock; v2 fixed Redeem but broke Entries/Necessary. Small-print garble is CHRONIC at macro — prefer 11_flip_12's ending for this beat |
| 13/14/15 | map-alive / scan / stack-crown sequels | Written but **PARKED** (user: "none of these were as good") |
| 16_planepov_ibiza_12 | THE transition concept: 09's suspense zoom into the painted plane → plane→POV landing in a flavor-badge city. 3 beats: macro map push → print dissolves to real sea/real airliner mid-zoom, no cut → POV golden-hour descent into Ibiza per card art | Was BLOCKED on Replicate credit (402, $0) — fire after top-up; then same device per city (Santorini/Monaco/Mykonos…), flavor-badge stamps as closers |
| 17_ticket_to_paris_12 | Earlier text-only ticket→Paris attempt | SUPERSEDED by 18 (image-to-video) |
| 18_gopro_window_eiffel_12 | **GoPro window reveal** (approved sequel concept): seeded on 09's end frame → macro morphs into a real airliner cabin → first-person GoPro-on-head passenger POV (wide FOV, head-bob) turns to the oval window → golden-hour aerial Eiffel reveal; flies THROUGH the glass into full aerial | DONE (2026-07-07) |
| 19_gopro_window_vienna_12 | Same, Vienna (St. Stephen's), holds the window POV | DONE |
| 20_gopro_window_berlin_12 | Same, Berlin (Brandenburg Gate + Fernsehturm), holds the window POV | DONE. More cities = copy a clip, swap the Beat-3 landmark |
| 21/22 endcard_members_6 | Dark end-card w/ card front + Members logo, 6s | 2026-07-17 additions |
| 23 members_title_outro_6 | Logo + gold-title-only outro that plays after 18's Paris reveal | 2026-07-17 |
| 24_eiffel_dive_12 | User supplied 18's aerial-Eiffel golden-hour end frame as `startFrame` (saved `refs/startframe_paris_aerial.jpg`, 1080×1920): FPV-drone dive from that exact frame down the tower lattice → low glide over the fountain pools → THROUGH the arch between the legs → tilt up into the sunburst | Generated OK, delivered to `~/Movies/Muha Euro Summer/Clips/` |

**Seamless-stitch technique (locked):** ffmpeg-extract the liked clip's last frame → `Muha Euro Summer/Clips/_liked_endframe.jpg` → feed as Seedance 2.0 **first frame** (`input.image` — which CANNOT be combined with `reference_images`). `eurosummer-clips.mjs` supports a `startFrame` field per clip. Convert PNG start frames to JPEG first (`toDataUri` labels everything `image/jpeg`).

**12-second clips:** write prompts as EXPLICIT timed beats ("Beat 1 (0-3s): …") or the extra runtime is wasted.

**Planned/next:** more living-painting cities (Santorini/Mykonos refs prepped), city-stamp slams, glossy flavor-badge tie-in clips (city↔flavor per SKU list), CTA closer ("Scan. Enter. Fly." / $25,000 Euro Summer).

#### Still posts (delivered 2026-07-14)

- **Locked copy:** headline "EUROPE. ANYWHERE. ON US." · subline "A $25,000 summer trip · You pick the destination" · CTA "Scan your Muha card to enter" · eyebrow "You pick the destination" · footer "MUHAMEDS.COM · @MUHAMEDS" (⚠️ the domain/handle were an assumption — CONFIRM with the user; also confirm whether the brand mark is the Muha Members ✓ logo vs Muha Meds).
- **Brand assets:** the gold/navy "$25,000 Europe Summer Trip" lockup (transparent, from the Euro-references zip) + `refs/MMembers Logo.png`.
- **APPROVED APPROACH: gpt-image-2, effects-heavy.** User rejected flat HTML/CSS overlay compositing twice ("basic / terrible / cluttered") and explicitly said "make sure ur using gpt 2 … more effects, more visibility with the text." `scratchpad/gen-euro-gpt.mjs`: gpt-image-2 EDIT, size 1024x1536, quality high, n1, THREE image[] refs (hero photo + `lockup_trim.png` + `members_trim.png`), prompt = reproduce the lockup + Members logo faithfully and design a dramatic luxury-sweepstakes poster around them (god-rays, gold sparkle particles, glow, navy vignette, gold foil frame, big glowing high-visibility text). gpt-image-2 slightly restyles the ornate "M" and redraws the lockup — acceptable/on-brand. Delivered: `Muha Euro Summer/Giveaway Posts (gpt-image-2)/Muha_EuroSummer_{Amalfi,Santorini,Spritz,Paris}.png`.
- **Superseded HTML pipeline** (keep only for pixel-exact-asset needs): NB 4K hero backgrounds (warm 35mm-film editorial, NO text) via `scratchpad/gen-euro-heroes.mjs` → HTML/CSS composite via headless Chrome (`scratchpad/build-euro-posters.py`, `--force-device-scale-factor=2`, MUST include `<meta charset="utf-8">` or "·" renders as "Â·"); navy/gold treatment, Didot headline + Futura labels, gold CTA pill; layouts `hype` + `editorial`; sizes 4:5 = 1080×1350 (→2160×2700), 9:16 story = 1080×1920 (→2160×3840). Delivered old set in `Muha Euro Summer/Giveaway Posts/`.

---

## 5. Generation playbook

### Model choice by task

| Task | Model | Why / settings |
|---|---|---|
| Fruit-drama characters | **Nano Banana Pro ONLY** (`gemini-3-pro-image-preview`) | gpt-image-2 rejected — NB renders fruit/3D better. 9:16, imageSize "4K", refs = flavor badge PNG only |
| Flavor badges (new SKUs) | Nano Banana batch (`nanobanana.mjs --batch`) | With `*_realistic_v1.jpg` refImages + "match the EXACT art style of the reference". Run: `OUTPUT_DIR="Flavor Badges" node nanobanana.mjs --batch <file>`; rename timestamped output to `<Flavor_Name>_realistic_v1.jpg`; batch json supports a per-job `_name` key for post-run renaming |
| Scenic backdrops behind badge text (sunsets/skies) | **gpt-image-2** | NB makes scenic backdrops ugly. gpt-image-2 has no transparent bg — prompt for the "light grey+white checkerboard transparency grid" to match the cutout set |
| Euro-music/luxury flavor logos | gpt-image-2 (2880×2880, quality high, WHITE bg) | `/v1/images/edits` with refs, or `/generations` with none |
| Raffle cards | gpt-image-2 `/images/edits`, quality high, 2048×1024 | Master-template ref system |
| Master-case poster | gpt-image-2 `/edits`, 1024x1536 portrait | Only 1024², 1536×1024, 1024×1536 available; 1024×1536 (0.667) closest to the real panel (0.618) |
| 4:5 posters (IG feed, e.g. Giveaway Extended) | **Nano Banana Pro** (aspectRatio 4:5, 2K/4K) | gpt-image-2 edit only does square/2:3/3:2 |
| Euro Summer giveaway still posts | gpt-image-2 EDIT, 1024x1536, high, effects-heavy | Approved over HTML compositing |
| All video (Bud Island, Euro Summer clips) | **Seedance 2.0** — `bytedance/seedance-2.0` on Replicate (note the dot in the slug) | 9:16, 1080p, audio on, 5–12s |

### Verbatim locked prompt language (copy these exactly)

Character render-style lock:
> "hyper-detailed Pixar / Cinema 4D / Octane 3D render, animated-feature-film look, unified Pixar-3D stylization across the entire character (head + face + hands + clothes), NOT photoreal, NOT live-action, NOT a real human-photo body with a cartoon head pasted on. Hands are PIXAR-CARTOON hands, clothes are PIXAR-CARTOON clothes."

Fruit-face negative:
> "no realistic human nose with nostrils, no realistic human lips, no human cheek/jaw bone structure, no human flesh tone anywhere"

Anatomy lock:
> "EXACTLY TWO ARMS, EXACTLY TWO HANDS, five fingers each — no extra limbs"

Badge-on-wall preservation negative:
> "do NOT redraw or restyle the badge poster — reference 1 placed AS-IS."

Cast-integrity lock (multi-character scenes; pair with the 10 individual `_small` refs + a numbered checklist):
> "exactly 10, each once, zero duplicates, ignore the refs' text banners/backgrounds, and every fruit-headed character's HEAD IS THE ACTUAL FRUIT — do NOT humanize"

Members-logo reproduction (logo passed as a reference image):
> "faithfully REPRODUCE the Members logo from reference image N at the top, copy exactly, do not redesign"

GTA poster photoreal lock (when editing the approved render):
> "keep 100% PHOTOREALISTIC, do NOT illustrate/cartoon/comic/cel-shade"

Animated wordmark lettering:
> "animated-movie / cartoon title lettering, soft cartoon finish, NOT hyper-realistic, NOT glassy candy gloss, NOT photographic."

Badge family match (new badge w/ refs):
> "match the EXACT art style of the reference"

Seedance card-text lock (any clip showing a card):
> "reproduce card text 1:1, letter-perfect, no invented text"

Seedance card-format lock (from the 04_fan fix):
> "wide LANDSCAPE-format… reproduced 1:1… no white borders, no portrait cards, no re-arranged layouts"

City-background opener (keeps output slugs unique per city):
> "A stylized ANIMATED-FILM skyline of <City>"

Prompt skeleton files (locked templates to copy + vary): `Flavor Badges/lemon-cheesecake-realistic.json`, `Flavor Badges/midnight-espresso-realistic.json`, `pineapple-poison-fix.json`. The coordinate-locked 15-zone master-case prompt lives in `muha-mastercase-v9-front.mjs`. The `DARK` film-language constant lives in `eurosummer-clips.mjs` (ARRI macro, walnut table, one warm light shaft, dust motes, halation) — reuse verbatim.

### Locked techniques

- **Logo fidelity = logo-as-reference.** Never recreate the Members logo from imagination, never PIL-paste it, never leave a reserved band (rejected). Pass `refs/MMembers Logo.png` as a reference image + the reproduction prompt above.
- **Layout fidelity = image-as-edit-base + coordinate-locked prompt.** To restyle while keeping a layout, pass the approved image as image[0] and pin zones as normalized [x,y,w,h]; "change ONLY the visual style and the hero-zone interior."
- **Fixed panel on approved art = alpha-mask inpaint** (transparent = editable region), never full-regen — keeps approved art pixel-identical (raffle-backs QR panel).
- **Fruit behind text = TWO-PASS:** (1) strip all decor to a clean text-only plate; (2) feed the plate back and add fruit as a backdrop ("lettering already exists in the FOREGROUND and must stay 100% visible — cluster fruit above top edge, below bottom edge, and at corners"). Single-pass re-layering fails (tried 3×).
- **Cross-card text consistency = prompt-only canonical-lockup ref** (one master card passed as "master text lockup" + TEXT_LOCK instruction; ~90% consistent, not pixel-identical; compositing declined).
- **Seedance character fidelity = `reference_images` (portraits), NOT start frames.** Seamless clip continuation = `startFrame`/`input.image` (extracted last frame) — the two CANNOT be combined in one call.
- **12s Seedance clips need explicit timed beats** ("Beat 1 (0-3s): …").
- **Chronic macro small-print garble:** spelling locks help ("letter-by-letter"), but at extreme macro the garble is chronic — prefer beats/endings that don't dwell on tiny print (e.g. use 11_flip_12's ending over 12_qrglow's).

### Known gotchas

1. **Seedance text drift:** always include the 1:1 text lock on any clip showing a card; Seedance also redesigns card formats (04_fan) — lock landscape/borders/layout explicitly.
2. **Seedance ref 504:** big base64 `reference_images` (full-4K portraits, especially 2–3 in parallel) → HTTP 504 on `POST /predictions`. Fix: downscale refs to ≤1024px (~120KB, `_small/*.jpg`) and submit without `Prefer: wait=5`.
3. **Replicate low-credit throttle:** <$5 credit throttles to 1-burst/min → 429s; `eurosummer-clips.mjs` has 429-retry + 20s staggered creates; parallel `Promise.all` creates trip the burst limit when credit is low. At $0 the API 402s — top up, then rerun.
4. **Seedance E005 sensitivity flag:** anatomy/tension phrasing (e.g. "two fingers … building tension") trips it — rephrase neutrally ("a hand calmly enters and pauses").
5. **Red die-cut guide crop:** card-front sheet scans must be bbox-cropped INSIDE the red die-cut guide lines (red-mask crop) or the red print guides leak into videos.
6. **Members wordmark garbles** on gpt-image-2 (extra M / misspelling) — explicit spelling lock + re-rolls; or logo-as-reference.
7. **gpt-image-2 timeouts:** `UND_ERR_HEADERS_TIMEOUT` on fetch — just rerun the script.
8. **gpt-image-2 has NO transparent background** — use solid white (logos) or prompt the checkerboard grid (badges).
9. **NB reinterprets badges described as objects:** saying "glowing neon sign" makes NB redesign the badge — always "flat printed poster reproduced AS-IS".
10. **Style-ref cross-contamination:** never pass the character-example scene or previously-approved characters as style refs for new characters — the wall badge gets contaminated. Badge PNG only; style in text.
11. **NB full-scene regens drift style** (GTA poster → cartoon) — edit the approved render with a single ref + hard photoreal lock instead.
12. **`toDataUri` labels everything `image/jpeg`** — convert PNG start frames to JPEG before use.
13. **Print aspect:** 2048×1024 art is 2.000:1 but the die is 90×43mm = 2.093:1 — fit-to-die squash (2048×978 + dpi 578.04×577.69) or generative width-extend (~95px).
14. **macOS TCC (as of 2026-07-17):** Terminal lost `~/Desktop` file access — the whole repo EPERMs on read. Fix: System Settings → Privacy & Security → Files & Folders → Terminal → enable Desktop (or Full Disk Access). Workaround: `osascript` Finder `duplicate ... with replacing` copies both directions (first call may hang ~2min on the one-time Automation prompt — approve it); runnable working copy at `~/Movies/Muha Euro Summer/_work/`.
15. **Prize framing differs by asset — never assume one unified prize.** Euro postcard tickets = "WIN $20,000" (full number). Fruit-character assets (IG + QR cards + master case) = "WIN A FORD MUSTANG" (black Mustang). GTA posters = "$25,000 CASH + DODGE CHALLENGER". Euro Summer = "$25,000 Europe Summer Trip". Legacy F-150 XLT assets are superseded. Confirm if unsure.
16. **Exact spellings that have burned before:** "MUHA MEMBERS" (never "MUHA MEDS" on giveaway assets) · "Members" wordmark (one M) · "F-150 XLT" (not "XTL") · "10 STRAINS" (not "STRAWS") · "WIN $20,000" (not "$20K") · "Redeem" (12_qrglow rendered "Redemn") · "Scan In Members App. / To Redeem 10 Entries!" · "Raffle ID: G2T6A03" · "No Purchase Necessary".
