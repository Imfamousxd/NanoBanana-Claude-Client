# Dialed Health

Standalone brand knowledge base. Everything an AI content app needs to produce on-brand Dialed
Health work with zero prior context. Repo root referenced below:
`/Users/mario/Desktop/Cursor Projects/NanoBanana-Claude-Client/`.

---

## 1. Brand identity

**Dialed Health** = a **clinical peptide / GLP-1 / research-compound supplement brand** sold in
vials, capsules, and oral drops. Aesthetic: clean, clinical, trustworthy. Member of the
"Dialed" family (sisters: Dialed Labs = sauna/cold-plunge equipment, Dialed Moods = nootropic
canned beverages).

- **Logo:** the "DIALED" / "HEALTH" wordmark with a **heartbeat / ECG-line motif**.
  **LOCKED LAYOUT (critical, models get this wrong):** `DIALED` sits **top-LEFT on the
  horizontal line**, the **EKG spike is mid-line**, `HEALTH` sits **bottom-RIGHT under the
  line** — the two words are OFFSET DIAGONALLY, NOT centered/stacked above and below the line.
- **Compounds seen in the work:** Semaglutide + B12, Tirzepatide, 5-Amino-1MQ, Apomorphine,
  Bacteriostatic Water — plus other research peptides.
- **Also in the catalog:** an at-home **blood-test kit** (round balloon-shaped collection
  device with a red puncture button, tiny graduated vial, DH-branded specimen bag, protector
  tube, FedEx mailer) — the subject of the 26-graphic instruction set below.
- **Rythm device rebrand:** a device rebrand project — 2 approved variants, generated with
  Nano Banana; outputs live in `Dialed Rythm Rebrand/`.

### The three product containers (user shorthand aliases)

When the user says one of these three words, it means a specific container + reference set:

- **"Vial"** → small injectable glass vial, black rubber cap + gold metal band.
  Container/source ref: `Dialed Health Injectable.png`. Style/scene anchor: the FIRST generated
  shot `generations/2026-04-17T21-19-49_Edit_the_reference_image_of_the_Dialed_H.jpg`
  (Semaglutide + B12) — use it as the scene/style reference for every new vial.
- **"Oral Drop"** → silver-white frosted glass dropper bottle, white ribbed collar, white
  dropper cap/bulb. Container shape ref: `Oral Drop Example.jpeg`. Label/scene style ref: the
  generated vial shot above.
- **"Capsule"** → clear glass pill bottle, brushed silver screw cap, filled with white
  capsules. Container shape ref: `Capsule Example.png`. Label/scene style ref: the generated
  vial shot above.

**Locked label style (all three containers):** matte BLACK label · white Dialed Health
heartbeat/ECG logo on top · centered product name below in white bold sans-serif · **NO dosing
line, NO extra text.** Logo reference file (clean white ECG wordmark): `DIaled Health.png`
(note the real filename's typo'd capital I).

---

## 2. Locked visual rules (hard rules + why)

1. **Logo layout is locked** (offset diagonal, EKG spike mid-line — see above). Early
   instruction graphics were REDONE because the model rendered a centered/stacked lockup.
   Pass `Product Refs/Dialed Health_Logo_Updated-02.png` as a ref whenever DH branding must
   appear.
2. **Label = logo + product name only.** No dosing text, no extra copy — locked since the
   first vial generation.
3. **Never composite / paste product renders** into scenes — always regenerate in-scene with
   references (house-wide rule; composites read as photoshopped).
4. **Label artwork is sacred in lifestyle shots** — it must come EXACTLY from the approved
   studio shot reference; the model must re-light it to the scene, never invent new text.
5. **Vial upright and vertical in hand-held shots** — tilting is what wrecks label fidelity.
6. **Realistic scale** — the vial is tiny (~2/3 the length of an index finger); oversized
   vials were rejected.
7. **Motion blur rule (evolved, current preference): CAMERA-IN-MOTION full-frame blur**, not
   limb-localized. Subtle directional slow-shutter-pan blur permeates the ENTIRE frame
   (foreground + subject + background); subject is the relative anchor (most legible) but
   still softer than tack-sharp; background heavily smeared; slight Dutch tilt ~5–8°; shutter
   feel ~1/30s lateral pan. Say "NOTHING is rigorously tack-sharp" and "the blur is a property
   of the entire frame, not a single limb." (The older rule — blur must come from a visibly
   moving limb, never sprinkled on a static pose — still holds as the floor: static-pose
   sprinkled blur is always wrong.)
8. **Approved = copy, don't move.** Originals in `generations/` are style/scene anchors for
   future prompts; moving them breaks the reference chain.

---

## 3. Asset map (paths)

All inside `/Users/mario/Desktop/Cursor Projects/NanoBanana-Claude-Client/`:

- `Dialed Health Injectable.png` — vial container source ref.
- `Oral Drop Example.jpeg` — oral-drop container shape ref.
- `Capsule Example.png` — capsule container shape ref.
- `DIaled Health.png` — clean white DH ECG wordmark (logo ref; filename typo is real).
- `generations/` — every raw generation attempt (timestamped filenames), including the master
  style anchor `generations/2026-04-17T21-19-49_Edit_the_reference_image_of_the_Dialed_H.jpg`.
- `DH Shots/` — APPROVED gallery, organized:
  - `DH Shots/Vials/<Product Name>.jpg` — approved studio vial shots
  - `DH Shots/Oral Drops/`, `DH Shots/Capsules/` — same for the other containers
  - `DH Shots/Vials Lifestyle/<Product Name>/` — the 6-file lifestyle set per product
    (`man-gym.jpg`, `man-track.jpg`, `man-kitchen.jpg`, `woman-gym.jpg`, `woman-track.jpg`,
    `woman-kitchen.jpg`); `Oral Drops Lifestyle/` / `Capsules Lifestyle/` when that work
    begins.
- `DIaled Health Instruction Graphics/` (folder name typo is real):
  - source screenshots `Screenshot 2026-05-11 at H.MM.SS PM.png` — GOTCHA: filenames contain a
    U+202F narrow no-break space before "PM"; access via shell glob
    (`ls "DIaled Health Instruction Graphics/"Screenshot*"3.29.07"*.png`), not a literal space.
  - `Product Refs/` — real product photos: `package open.jpg`, `product in package.jpg`,
    `insert blood vial.jpg`, `where to place blood vial.jpg`, `protector tube.png`,
    `protector tube top.png`, `Dialed Health_Logo_Updated-02.png` (pristine DH lockup).
  - `Approved/01.png` … `26.png` — the finished instruction set.
  - `New Approved/` — copies of 22–26 for handoff.
  - loose refs: `bandage.jpeg`, `alcohol prep pads.jpeg`, `mailer.jpeg`.
- `Dialed Health Website graphics/` — website graphic outputs.
- `Dialed Rythm Rebrand/` — the 2 approved Rythm device rebrand variants (Nano Banana).
- Repo-root generation scripts: `dh-instruction-22-scan-qr*.mjs`,
  `dh-instruction-23-supplies*.mjs`, `dh-instruction-24-*.mjs`, `dh-instruction-25-mailer*.mjs`,
  `dh-instruction-26-fedex-dropoff.mjs`; historical batch scripts `batch-vials*.mjs`,
  `batch-capsule-*.mjs`, `batch-oral-*.mjs` (client-specific, untracked).

---

## 4. Campaigns run (status, deliverables)

### Studio product shots (ongoing catalog work)

One clean shot per product per container, black-label style, 4K, 5:4, via
`nanobanana.mjs --batch frames-batch.json`. On approval → copy (never move) into
`DH Shots/<Container>/<Product Name>.jpg`. Trigger words: "approved" / "good" / "use this
one" → immediately `cp` + rename; `mkdir -p` the container subfolder if missing.

### Lifestyle shot sets (spec locked 2026-04-20; Semaglutide + B12 = first approved set)

**6 variants per product** — hand-holding-product: man/woman × gym/track/kitchen. Woman's hand
has long white-polished nails. Approved sets → `DH Shots/Vials Lifestyle/<Product>/` with the
6 standard filenames.

**Composition spec (locked across all products):**
- Top-down/overhead camera POV (camera above, aimed straight down)
- ONE single hand only — strictly no second hand or stray fingers
- Pinch grip: index fingertip on the cap top, thumb pad on the vial bottom, other fingers
  curled loosely
- Vial UPRIGHT and VERTICAL, label facing squarely toward camera (no tilt)
- Realistic scale: vial ~2/3 the length of an index finger
- Medium-close crop — vial + fingertips dominate; no full wrist/arm
- 5:4 aspect ratio, 4K, slightly off-center composition for candid feel

**Status:** Semaglutide + B12 approved (the composition anchor); subsequent products batch all
6 variants in one `frames-batch.json` run. Kits (3-vial shots) are awkward for hand-holding —
confirm treatment with the user first.

### 26-step instruction graphics (COMPLETE)

Recreation of 20 medical instruction screenshots + 6 added steps as ORIGINAL black line-art
illustrations for DH's at-home blood-test product. **All 26 approved** in
`DIaled Health Instruction Graphics/Approved/01.png`–`26.png` (22–26 also copied to
`New Approved/`). 1:1, 4K PNGs via `nanobanana.mjs`. Content per step (compressed): 01
handwash · 02 foil peel · 03 cap onto vial · 04 vial into device port · 05 alcohol-wipe
deltoid · 06 squeeze DH heat pack · 07 heat pack on deltoid · 08 pull cap off red button ·
09 peel adhesive backing / device on shoulder · 10 press red button · 11 blood fills vial ·
12 remove device · 13 detach vial · 14 cap blood-filled vial · 15 invert 10X · 16 write DOB
on label ("07/14/89" — it's the patient's birthdate, not today's date) · 17 protector tube
into DH bag (logo + QR, NO biohazard symbol) · 18 bag into opaque white FEDEX mailer pouch ·
19 box into rigid FedEx pouch · 20 waste bin · 21 vial into protector tube + cap · 22 scan
bag QR with phone · 23 supplies layout (gauze / DH alcohol prep pad / bandage strip) · 24 DH
round bandage on deltoid · 25 sealed bag into poly bubble mailer · 26 mailer into FedEx drop
box ("FedEx" wordmark + "EXPRESS DROP OFF").

### Rythm device rebrand (delivered)

2 approved rebrand variants generated with Nano Banana; outputs in `Dialed Rythm Rebrand/`.

---

## 5. Generation playbook

### Studio container shots (Nano Banana)

`node nanobanana.mjs --batch frames-batch.json`, aspect `5:4`, size 4K. Refs per job: the
matching container shape ref + the first generated vial shot (style/scene anchor) + the DH
logo ref. Prompt asserts the locked black-label style and the exact product name; nothing
else on the label.

### Lifestyle shots (proven technique)

- REFERENCE 1 = the clean studio product shot (label anchor), e.g.
  `./DH Shots/Vials/<Product>.jpg`
- REFERENCE 2 = the matching approved Semaglutide + B12 lifestyle variant (composition
  anchor), e.g. `./DH Shots/Vials Lifestyle/Semaglutide + B12/woman-gym.jpg`
- Prompt (verbatim pattern): "Edit REFERENCE 2 by replacing ONLY the vial with REFERENCE 1's
  product. Keep hand, scene, camera angle, grip, everything else identical. Re-light the vial
  to match REFERENCE 2's scene (glass reflections, cap highlights, ambient color cast all
  from the scene, NOT the studio)."
- Crucial: tell the model to RE-LIGHT the vial to the scene, not paste it flat (flat-pasted
  vials look unnatural). Label artwork stays EXACT from REFERENCE 1 — treat as sacred, no new
  text invented.
- Do NOT use the old `Hand Holding Product Example.png` ref — its orange product confuses
  label rendering.

### Instruction graphics (line-art)

Tool: `node nanobanana.mjs --batch dh-instruction-NN.json`, aspect `"1:1"`, ImageSize `"4K"`.

**Workflow rule:** generate from a TEXT-ONLY prompt describing the action generically —
`refImages: []`, never pass the source screenshot (outputs must be fresh originals, not
reproductions). Describe the real product from the Product Refs photos in words instead of
passing them to the generator.

**Locked style prompt (verbatim, proven):**
> "A generic medical-product instruction illustration in simple black line-art on a pure white
> background, in the universal patient-information-leaflet style. Uniform medium-weight black
> ink lines on clean white, no color anywhere. Minimal short parallel hatching only for soft
> shadow / volume. No frame, no border, no caption, no labels, no logos, no numbers, no
> arrows, no decorative elements. Subject centered in a 1:1 square composition with generous
> clean white margins. Drawn-by-hand line work."

**Locked object specs (use for any future step):**
- *Device:* balloon-shaped white plastic — round main body + small cylindrical neck at the
  bottom where the vial seats (NOT a plain disc). Top face: large solid RED circle (the only
  color allowed) — raised red cylindrical button pre-activation; FLUSH flat circle with a
  solid black center dot post-activation (step 11 onward). Connector port is circular with a
  short blunt stepped tongue on the OPPOSITE side from the vial's tongue (mirror-complementary
  jaws).
- *Vial:* tiny, finger-sized (body ≈ thumb-width, height ≈ 2× diameter). Asymmetric stepped
  rim (back half raised, flush with the wall, blunt-angular). Double-line graduation ring
  fully encircling the body at ~55–60% up. Interior always empty unless the step shows blood.
  Ribbed fingertip-sized cap.
- *Heat pack:* 5-sided DIAMOND-GEM silhouette (flat top, sharp bottom point), clear plastic,
  DH logo (locked offset layout) mid-face, small oval activation OUTLINE lower-middle,
  crimped serrated seal edges allowed.
- *Protector tube:* white cylindrical body with "HEALTH" embossed on the side + black cap
  with "DIALED" embossed — assembled it reads "DIALED HEALTH". Refs:
  `Product Refs/protector tube.png` / `protector tube top.png`.
- *Scale/action rules:* hand reads clearly bigger than the product; depict MID-action, not
  post-action; unpeeled foil is opaque; package silhouette hugs the device with a thin
  ~3–5mm flange; small lot stamp on the flange top edge is OK.

**Iteration patterns (proven):**
- "Almost perfect except X" → pass the prior gen as `refImages` and prompt: "take this image
  PIXEL-FAITHFULLY, ONLY modification: …".
- Scale changes: the model anchors hard to ref size — switch to a NO-ref prompt that bakes
  the new scale into the spec from scratch.
- Capsule-visible-through-bag shots: anchor on `Approved/17.png` (the only graphic where
  capsule-in-bag renders correctly). Iterating off broken attempts never recovers.
- Logo fixes: re-run with prior gen + `Product Refs/Dialed Health_Logo_Updated-02.png` as
  refs.
- Review side-by-side:
  `REF=$(ls "DIaled Health Instruction Graphics/"Screenshot*"H.MM.SS"*.png); open -a Preview "$REF" "generations/<gen>.jpg"`
- Approve: `cp generations/<latest-gen>.jpg "DIaled Health Instruction Graphics/Approved/NN.png"`

### Motion/action lifestyle prompts (gpt-image-2)

Lead with "CAMERA-IN-MOTION motion blur" as the dominant directive; spell out: "directional
motion blur permeates the ENTIRE frame, distributed evenly across foreground and background",
"subject is the relative anchor (most legible) but still softer than tack-sharp", "background
elements heavily smeared from camera pan", "slight Dutch tilt 5–8°", "shutter ~1/30s during a
lateral pan track", "NOTHING is rigorously tack-sharp", "the blur is a property of the entire
frame, not a single limb." Pair with documentary photojournalism / Cinestill 35mm grain /
halation language.
