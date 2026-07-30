# HANDOFF — Dialed Moods · SOCIAL ELIXIR launch content

**State 2026-07-29: creative direction APPROVED on piece 1. Replicate it across the other four.**

## The forever rule (learned the hard way this session)

**Generate the ENTIRE graphic with an image model. Never composite.** Do not place a supplied
product render into an HTML/CSS layout and screenshot it. Pass the renders as *references only* and
let the model produce background, can, type and layout together.

Two earlier attempts were rejected: an HTML/CSS composite read as "a flyer made on Canva", and the
supplied can scaled to fill a frame read soft/low-res. See memory
`feedback_never_composite_generate_whole_graphic`.

## What's here

```
dialed_social_elixir_gen.mjs   (repo root) the generator — all 5 briefs, both ratios
Dialed Moods Social Elixir/
  refs/       the 4 can renders the briefs use + dialedMoodsLogo.png
  approved/   APPROVED_1_announce_4x5.png  ← the signed-off look. Match it.
  out_4x5/ out_9x16/   generator output
```

Run: `node dialed_social_elixir_gen.mjs 4x5` or `... 9x16`, optionally with piece ids.
Pieces: `1_announce 2_whats_in_it 3_how_to_use 4_why_different 5_tomorrow_proof`

## Model — gpt-image-2 (default, 2026-07-29)

The OpenAI billing limit is **lifted**. `gpt-image-2` via `/v1/images/edits` is now the default path
and renders at **2560x3200** for 4:5 (a descending size ladder in `SIZES` steps down automatically
if the pixel budget is rejected). `--nb` still routes to Nano Banana as a fallback.

Two gotchas worth keeping:

- **`input_fidelity` is a gpt-image-1 param.** gpt-image-2 returns
  `invalid_input_fidelity_model` if you send it. Do not re-add it.
- gpt-image-2 at `quality: high` takes ~4 min per 4:5 piece. Always background the run.

**Why the switch mattered — measured, not assumed.** Nano Banana rendered the approved piece, but on
the sibling pieces it could not hold the can. Across two full passes it shipped `BOODS`/`DOOZS` for
BOOZE, `30mg` in place of a correct row, `358 ML` and `368 ML` for 355, and twice replaced the can
with an invented one. Character-exact locks in the prompt did not move it — it pattern-paints small
type rather than reading instructions. gpt-image-2 fixed all of it on the first attempt, because
`images/edits` puts the real can render *into* the edit instead of describing it.

The prompt blocks are model-independent and carried over unchanged.

## Style lock — how the siblings stay on the approved look

`approved/APPROVED_1_announce_4x5.png` is downscaled to `refs/_style_approved.png` and passed as
**REFERENCE 3**, with a `STYLEMATCH` block that says *look only — not the words, the flavour, the
layout content or the colour of the light*. Without it each run re-rolls a fresh art direction.
Regenerate the style ref with:

```
sips -Z 1400 approved/APPROVED_1_announce_4x5.png --out refs/_style_approved.png
```

**Do not switch models mid-set.** The approved frame is Nano Banana 4K; moving to gpt-image-2 now
would cost the look that was just signed off. Park the gpt-image-2 flip until the set is complete.

## The approved look (prompt blocks in the generator)

- **`BRAND`** — reproduce the can exactly from ref 1, logo from ref 2, charcoal/near-black ground,
  ONE metallic gold accent `#D2AC47`, premium cinematic/editorial, can sharp and never soft.
- **`TYPEDEPTH`** — the block that won approval. Type lives *inside* the scene: same key light
  rakes across headline and can, gold set as brushed metal (champagne → antique gold → bronze, with
  bevel and one specular streak), type casts a shadow and reflects in the glossy floor, bokeh and
  haze drift in front of it, eyebrow on a gold rule running off-frame.
  **Back layer is ATMOSPHERE ONLY — no lettering.** A ghosted oversized "DIALED" behind the can was
  tried and explicitly rejected; there is now a global ban on watermark/background type.
- **`LEGAL`** — `NON-ALCOHOLIC · 21+ · ID WILL BE CHECKED`, bottom, legible.

## The micro-copy defect — corrected diagnosis (2026-07-29)

The previous session logged this as "hallucinated micro-copy" and recommended cropping the panel
out. **That diagnosis was wrong and the fix would have made things worse.**

Open `refs/Dialed_Seltzer_Kava_45_ArticBlue.png` and look at the can: the app/QR block with its
three numbered steps, the vertical "Prize With Every Can", the "Dialed Health" mark and the
`180 / 200 / 50 / 20mg` column are all **real printed pack copy**. The real can already says
**20mg**. So:

- The `30mg` was a one-off *render* error, not a design problem. The approved piece renders it
  correctly.
- Cropping or blanking that panel would have falsified the packaging — worse than soft small print.

The fix is therefore **faithfulness plus a hard numeric lock**, not erasure. See `CANFIX` in the
generator: reproduce REFERENCE 1's panel as it actually exists, lock the four figures, and let type
that is genuinely too small fall into natural photographic softness rather than sharp pseudo-letters.

## Where the models actually fail

Tracked across the first replication run — these are the things to check on every render:

- **Misspellings in headline type.** Shipped `the ocasion.` for "occasion".
- **Garbled can band.** `UNWIND WITHOUT THE BOOZE` came back as `BOODS` and `DOOZS`.
- **Wrong figures on the can.** One render put `30mg` in the magnesium row (should be 50mg);
  another printed `12 FL OZ (368 ML)` instead of 355.
- **Wholesale can redesign.** The centred composition once produced an entirely invented can —
  no mosaic bands, wrong logo, fabricated "PIXEL-MOSAIC FRUIT" and a nonsense `15 FL OZ (80 mL)`.
- **Hard-edged background shapes.** A flat cyan disc and a bright straight horizon streak instead
  of the approved soft volumetric haze.

The `CANFIX` and `SPELLING` blocks in the generator exist specifically to counter these. `SPELLING`
is deliberately the **last** block in the prompt so it is read last.

## Compliance — settled, do not re-open casually

Source: `~/Downloads/MARKETING ROAD MAP  - Social Elixir.csv`.

- **Use "Unwind without the booze."** — the line printed on the cans. The sheet lists "Buzz without
  the booze" as the hero claim, but its own compliance row says don't let "buzz" imply an
  intoxicating effect and flags it as the launch's highest-scrutiny copy. "Buzz" appears nowhere.
- Only greenlit structure/function language: *supports hydration*, *supports muscle function*.
- **Competitors unnamed.** The sheet names New Brew, Leilo, Mitra9 — naming them makes it a
  comparative claim.
- **No star ratings or customer counts.** No reviews exist yet; inventing social proof is off-limits.
- Age gate on every piece. Kava occasional-use posture (not daily/long-term, take breaks, not under
  21 / pregnant / nursing / liver condition / with alcohol) belongs on the how-to piece — the sheet's
  risk row forbids open-ended daily framing because of kava's hepatotoxicity history.
- The FDA dietary-supplement disclaimer was on the earlier HTML pieces but is **not** currently in
  the generated briefs — decide whether it must appear on-graphic or lives in the caption.

## Product facts

Kava seltzer, non-alcoholic. 180mg kavalactones (from 573mg kava root extract), 200mg potassium,
50mg magnesium, **20mg sodium**. 10 calories, zero sugar, no artificial flavors, gluten-free, vegan.
Flavors: Lemonade, **Arctic Blue** (note: filenames say "Artic" — the can art is correct),
Mango Peach. $5.99 a can · 6-pack $41.94 · 12-pack $83.88. Launch August. Full-tier launch.

Brand: white site, black type, gold `#D2AC47`. Logo is chrome italic "DIALED" with heavy gold
outline + "MOODS" lower right. Tagline "Your full potential with Herbal Bio-hacking."

## Next session

1. Pieces 2-5 are rendered at 4:5 in `out_4x5/` (gpt-image-2, 2560x3200) and **awaiting sign-off**.
   Every text lock verified correct on all four. Earlier attempts are kept as evidence in
   `out_4x5/_v1_rejected/` and `out_4x5/_v2_nb/` — do not ship from those.
2. On approval, copy each to `approved/` and run all five at 9:16
   (`node dialed_social_elixir_gen.mjs 9x16`).
3. Open question on piece 5: the render puts the headline left-of-centre with the can right, rather
   than the brief's headline-top / can-centred. It is arguably better — it matches the family — but
   it is a deviation, so confirm before locking.
4. Decide the FDA-disclaimer placement (on-graphic vs caption). Still open.
