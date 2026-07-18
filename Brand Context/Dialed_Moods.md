# Dialed Moods

Standalone brand knowledge base. Everything an AI content app needs to produce on-brand Dialed
Moods work with zero prior context. Repo root referenced below:
`/Users/mario/Desktop/Cursor Projects/NanoBanana-Claude-Client/`.

---

## 1. Brand identity

**Dialed Moods** = a functional **nootropic / adaptogen BEVERAGE brand** — canned drinks.
Member of the "Dialed" family (sisters: Dialed Health = clinical peptide supplements, Dialed
Labs = sauna/cold-plunge equipment).

- **Format:** 12 fl oz tall slim **cans**, sold/shown as a **6-can lineup**.
- **Product lines:** a **"Cognition Elixir"** and an **L-DOPA ("L-Doba") seltzer/elixir**.
- **Flavors seen:** **Lemonade** (yellow label, lemon-slice vertical ribbon), **Strawberry
  Kiwi**, and **Blue Glacier**.
- **The Blue Glacier can (the real, locked label design — reference asset below):** blue top
  band reading "CLEAN ENERGY & CALM FOCUS" · "BLUE GLACIER" vertical tab · "Prize With Every
  Can" · gold "DIALED" + "MOODS" wordmarks · blueberry artwork · ingredient list ·
  "COGNITION ELIXIR" · "DIETARY SUPPLEMENT / 5 CALORIE - ZERO SUGAR / 12 FL OZ". Do NOT use a
  simplified render of this can — only the real asset.
- **Backing data source — the "Dialed Moods R&D wall" MCP server:** a knowledge graph of real
  supplement ingredients (evidence tiers, doses, mechanisms, safety), finished product
  concepts, use-cases, and competitor products, organized in categories: energy, focus,
  recover, mood, immunity, libido, longevity. **Never invent ingredient numbers, doses, or
  IDs — pull them from that graph.**

### Creative style

Magazine-grade product photography on pure flat **WHITE / cream studio** surfaces
(`#FFFFFF` / cream gradient `#F0EBE2 → #D6D2CB`), glossy crisp can renders, and short
**can-reveal animations** (can floats / levitates / pops in mid-air with splashes, slow-mo
droplets). Hero stills via Nano Banana; motion via Seedance.

---

## 2. Locked visual rules (hard rules + why)

1. **NEVER composite the can into a scene.** The user is firm: PIL/sharp pasting a can render
   always looks photoshopped/unnatural — repeated rejects. Generate everything in-scene with
   the can asset passed as a reference.
2. **Use gpt-image-2 (not Nano Banana) whenever label-text legibility matters.** NB drifts
   the fine label text badly — this caused rejected lifestyle shots.
3. **Make the CAN the large PRIMARY subject in the frame** — front-facing, foreground,
   tack-sharp, filling a big portion of the frame — so the model has enough pixels to render
   the label text accurately. The person/background go soft behind it (shallow depth of
   field).
4. **Always pass the real can asset as reference:**
   `Dialed Moods L-Doba Generations/Product REfs/Blue glacier.png` (crisp Blue Glacier label;
   the "REfs" capitalization in the folder name is real). This is the REAL can design — never
   a simplified render.
5. **Label artwork must be preserved pixel-faithfully when animating** (can-reveal videos):
   the animation must not redraw or drift the label.
6. **Anti-"AI look" realism cues for lifestyle scenes (proven to help):** real camera/lens or
   iPhone-snapshot framing, natural uneven window daylight with real shadows, genuine skin
   texture, candid composition.
7. **Subject casting rule (from the "guy at laptop with the DIALED can" scene):** subject
   reads YOUNG (early-20s), masculine, put-together/successful — NOT scruffy/bum, NOT
   soft/preppy, NOT a flawless model.

---

## 3. Asset map (paths)

All inside `/Users/mario/Desktop/Cursor Projects/NanoBanana-Claude-Client/`:

- `Dialed Moods/` — general brand folder (stills, lineups).
- `Dialed Moods Drink Short Animation/` — can-reveal animation outputs (Seedance).
- `Dialed Moods L-Doba Generations/` — the L-DOPA seltzer/elixir generations.
- `Dialed Moods L-Doba Generations/Product REfs/Blue glacier.png` — THE locked can reference
  asset (real Blue Glacier label). Primary ref for any shot where the can appears.
- Data: the "Dialed Moods R&D wall" MCP server (knowledge graph — ingredients, doses,
  mechanisms, product concepts, competitors). Query it; never fabricate.

Note: no email identity exists for Dialed Moods yet (a past request that mentioned it was
confirmed to be a slip — the email work was Dialed Labs only). In the Remotion email project
(`email_campaigns/remotion/`), the unused `Bars` audio/EQ component is explicitly reserved
for a future Dialed Moods footer.

---

## 4. Campaigns run (status, deliverables)

- **White-studio hero product photography** (ongoing): glossy can packshots and 6-can lineups
  on white/cream studio surfaces. Hero stills generated with Nano Banana.
- **Can-reveal short animations** (delivered set in `Dialed Moods Drink Short Animation/`):
  can floating/levitating/popping mid-air, splashes, slow-mo droplets; animated with Seedance
  from approved stills, label preserved pixel-faithfully.
- **L-Doba (L-DOPA seltzer) generation set** (in `Dialed Moods L-Doba Generations/`):
  product-line stills for the L-DOPA elixir, including the Blue Glacier can work.
- **Lifestyle shots** (iterated to a locked recipe): e.g. the "guy at laptop with the DIALED
  can" scene — the never-composite / can-as-hero / gpt-image-2 rules above came from repeated
  rejects on this work.

---

## 5. Generation playbook

### Studio hero stills

Nano Banana (`nanobanana.mjs`), white or cream studio surface (`#FFFFFF` /
`#F0EBE2→#D6D2CB`), glossy magazine-grade product-photography language, real can asset passed
as reference. Generate 2–3 candidates and let the user pick.

### Lifestyle shots (locked recipe)

- Model: **gpt-image-2** (`/v1/images/edits`), NOT Nano Banana — label legibility is the
  bottleneck.
- Pass `Dialed Moods L-Doba Generations/Product REfs/Blue glacier.png` as a reference image
  and name its role in the prompt ("the can must match reference image 1 exactly").
- Composition: can = large front-facing foreground hero, tack-sharp, big in frame; person and
  environment soft behind (shallow DoF).
- Realism language: real camera/lens or iPhone-snapshot framing, natural uneven window
  daylight with true shadows, genuine skin texture, candid framing. Subject: early-20s,
  masculine, put-together (not scruffy, not preppy, not a flawless model).
- NEVER composite; if the label drifts, iterate the prompt / regenerate — don't paste.

### Can-reveal animations

Seedance (Replicate) image-to-video from an approved still. Prompt for float/levitate/pop
motion with splashes and slow-mo droplets; instruct that the label artwork stays
pixel-identical to the input frame throughout the motion.

### Copy / formulation facts

Any ingredient, dose, mechanism, or evidence claim comes from the **Dialed Moods R&D wall
MCP** knowledge graph. Never invent numbers or IDs.

## Canonical can renders (added 2026-07-17)
`Brand Context/assets/Dialed_Moods/` — official Cognition Elixir 12oz can renders, use as refs for all can generations: `Blue-Glacier.png` (the locked primary ref), `Lychee.png`, `Sour-Watermelon.png`, `Black-Cherry-Vanilla.png`, `Lemonade.png`. All: gold "DIALED" wordmark + MOODS tab, "Clean Energy & Calm Focus", DNA watermark, "Prize With Every Can" QR rail, "Cognition Elixir — Dietary Supplement, 5 Calorie, Zero Sugar, 12 FL OZ (355 mL)".

**Official logo:** `Brand Context/assets/Dialed_Moods/Dialed-Moods-Logo-Q4-Dec-2025.pdf` — the Q4 Dec 2025 Dialed Moods logo package (source of truth for the wordmark).
