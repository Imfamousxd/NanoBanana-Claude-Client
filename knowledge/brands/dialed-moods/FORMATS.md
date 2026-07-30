# Dialed Moods creative system

The approved formats, the layout law behind them, and the rejection history that produced each rule.
Read this before designing anything for Dialed Moods.

Tokens live in `design-system.json`. Products live in `catalog.json`. Copy lives in
`selling-points.json`. Prompt blocks live in `hero-prompts.json`. This document is the *reasoning*;
those files are the *data*. Do not duplicate values here — they drift.

**Approved reference:** `Brand Context/assets/Dialed_Moods/creative/style_master_4x5.png`.
Open it before you read another word. Everything below is an attempt to describe why that image
works, and every rule exists because something else was tried first and rejected.

---

## 0. Making a graphic — you should never write a prompt by hand

**Use `dialed_moods_gen.mjs`. It works for every Dialed Moods product, not just Social Elixir.**
It assembles the approved prompt for you and pulls each can's real printed copy out of the brand
pack, so a graphic physically cannot come out carrying the wrong product's numbers.

```bash
node dialed_moods_gen.mjs --list          # every product you can generate, and its status
```

Make any graphic in one command — no code editing, no prompt writing:

```bash
node dialed_moods_gen.mjs \
  --product cognitionBlueGlacier \
  --eyebrow  "CLEAN ENERGY" \
  --headline "Focus you can" \
  --gold     "actually feel." \
  --support  "A nootropic seltzer built for the long afternoon." \
  --ratio 4x5 --name focus_v1
```

That is the whole interface. `--headline` is the white part, `--gold` is the closing phrase set in
brushed metal. For anything with more structure — a spec list, numbered steps, a CTA button — put a
brief in `dialed_moods_presets.json` and run `--preset <name>`, or pass `--brief my-brief.json`.

Reproduce the approved launch set with:

```bash
node dialed_moods_gen.mjs --preset socialElixirLaunch --ratio 4x5
```

Needs `OPENAI_API_KEY` in `.env`. Output goes to `Dialed Moods Generated/<ratio>/`. About four
minutes per graphic — background the run.

> `dialed_social_elixir_gen.mjs` is the original, Social-Elixir-only script kept for provenance.
> Use `dialed_moods_gen.mjs` for new work.

**Never edit the shared prompt blocks to fix one graphic.** They live in `hero-prompts.json` and
carry the look for everything. Change the brief instead. Editing a shared block to rescue one image
silently degrades every other graphic the brand will ever make.

---

## 0b. The one thing that breaks most often

Every Dialed Moods can shares an architecture — chrome-and-gold vertical `DIALED` wordmark, the
`Prize With Every Can` strip, the QR/app-steps block, a nutrition column — but **the printed copy
differs by product line**:

| | Social Elixir | Cognition Elixir |
|---|---|---|
| Band | `UNWIND WITHOUT THE BOOZE` | `CLEAN ENERGY & CALM FOCUS` |
| Line | `SOCIAL ELIXIR` | `COGNITION ELIXIR` |
| Sub | `10 CALORIE - ZERO SUGAR` | `5 CALORIE - ZERO SUGAR` |
| Body | charcoal-grey, blue/gold mosaic bands | white/brushed-silver, flavour-coloured bands |
| Spec | 180mg / 200mg / 50mg / 20mg | different actives — **not yet verified** |

Put Social Elixir's band or numbers on a Cognition can and you have shipped false pack copy on a
supplement. The generator prevents this by reading `catalog.json`; you only reintroduce the risk by
hand-writing a prompt. Don't hand-write prompts.

**Cognition Elixir spec numbers are currently unverified.** Only `20mg L-Dopa` and `200mg Caffeine`
are legible on the supplied three-quarter renders — the middle two ingredient names wrap around the
can. While `specVerified` is `false` in `catalog.json`, the generator tells the model to rotate that
panel away from camera entirely. Do not add those numbers to a graphic until the client or a
straight-on render confirms them, then flip the flag.

> A first pass at this proved the guard is necessary: the model rendered a *sharp* Cognition spec
> column that read `20mg L-Theanine` where the can actually says **L-Dopa**. It will invent a
> plausible supplement fact if you let it near one.

### Disclosures are per line too

`NON-ALCOHOLIC · 21+ · ID WILL BE CHECKED` belongs to **Social Elixir only**. It is there because
that product is a kava drink sold into an alcohol occasion. Cognition Elixir is a nootropic seltzer,
not an alcohol alternative — putting a 21+ age gate on it is a compliance error, not a styling
choice. That same first pass did exactly that.

No disclosure has been approved for Cognition Elixir yet, so `disclosures.byLine.cognitionElixir` is
`verified: false` and the generator renders **no small print at all** rather than borrowing another
line's. It also prints a warning when you run it. Get the real line from the client's reviewer,
then fill it in.

---

## 1. How work is built

| Half | Tool | Why |
|---|---|---|
| The whole graphic — scene, can, type, layout | `gpt-image-2` via `/v1/images/edits` | The look depends on type and product sharing one light. Splitting them is what made the early attempts read as flyers. |
| Nothing | — | There is no compositing step on this brand. |

**This brand's rule is the opposite of the repository default.** Most brands here render the scene
generatively and the layout deterministically in HTML/CSS. Dialed Moods does not, because the
approved look requires the headline to be lit by the can's key light, to cast a shadow into the
scene, and to reflect in the same floor. You cannot get that by laying CSS text over a render — it
was tried, and it was rejected as *"a flyer made on Canva"*.

The trade is real and you should know what you are accepting: because the image model draws the
legal line and the can's printed copy, **you must verify that copy by eye on every render**. See §5.
That verification is not optional and it is not a formality — see the failure table in §6.

Everything else in the repository still applies. Never ask an image model for a QR code, a table, a
certificate, or a claim.

---

## 2. The invariant spine

The element order every launch format shares. Rearranging it is what makes a creative stop reading
as Dialed Moods.

```
logo            small, chrome-and-gold lockup, top-left corner
     ─ gold rule running off the left edge
eyebrow         small gold letterspaced caps
HEADLINE        heavy geometric sans, sentence case, multi-line
                final phrase in brushed-metal gold
support         one or two short white lines, or a spec list, or numbered steps
                                                    +----------+
                                                    |   CAN    |  large, sharp, right side
                                                    |   hero   |  lit by one hard key light
                                                    +----------+
                                                     reflection
age gate        centred, very bottom, small caps
```

Three things are load-bearing:

1. **Type left, can right.** Every approved piece obeys this. The one render that centred the can
   drifted furthest from the set.
2. **One gold phrase.** The last phrase of the headline, in brushed metal. Not two, not a whole
   headline, not a second accent colour.
3. **The left half stays empty and dark.** Generous margin. The composition breathes; that is most
   of why it reads premium rather than busy.

---

## 3. Approved formats

The spine in §2 is the brand's format for **every** Dialed Moods graphic, not just the launch set.
Applying it to a different product is not a new design — it is the same design with a different can
and different words. That is the point: the look is what makes it Dialed Moods, and it must survive
the product changing.

Only two things move when you change product:

1. **The bloom colour**, taken from the product's `bloom` in `catalog.json`.
2. **The can**, taken from its reference asset.

Ground darkness, key light, camera height, can scale, margins, type rhythm, gold treatment and the
age gate all stay identical. Holding those constant is the entire reason a set reads as one campaign.

The five launch pieces below are the worked examples. What makes them *different in texture*, not
just different in content:

| Piece | Texture | Flavour / light |
|---|---|---|
| `1_announce` | Warm and spacious — a gold CTA pill is the only solid shape on the page | Lemonade, gold bloom |
| `2_whats_in_it` | Dense and factual — four spec rows on hairline rules, then a strip of outlined chips | Arctic Blue, cyan bloom |
| `3_how_to_use` | Rhythmic — three numbered steps, gold numerals against white lines; frosted condensation on the can | Mango Peach, peach bloom |
| `4_why_different` | Loudest type in the set — the headline is the whole left half, two short lines behind gold rules beneath it | Lemonade, gold bloom |
| `5_tomorrow_proof` | Split — a before/after pair divided by a vertical gold rule at the bottom | Arctic Blue, cyan bloom |

A sixth piece that is another hero-can-plus-headline with new words is a **re-skin** and will read as
filler. Give a new piece a texture no existing piece has: a different information shape, a different
density, a different physical behaviour of the can.

The bloom colour is the only thing that changes with flavour. Ground darkness, key light, camera
height, can scale, margins and type rhythm all stay identical — that is what holds the set together.

---

## 4. Rejection history — do not regress

A rule without its rejection history gets undone by the next person. This table is the most valuable
part of the document.

| What was tried | Verdict | Rule it produced |
|---|---|---|
| Can render placed in an HTML/CSS layout, screenshotted | Rejected — "a flyer made on Canva" | Generate the ENTIRE graphic with the image model. Never composite. |
| Supplied can render scaled up to fill the frame | Rejected — soft, low-res beside crisp generated type | The model re-renders the can from the reference; it is never enlarged. |
| Giant ghosted "DIALED" behind the can as a depth cue | Rejected on sight | Back layer is **atmosphere only**. Global ban on ghosted / watermark / oversized background type. |
| Flat cyan disc + bright horizon streak behind the can | Rejected — reads as a poster template, not a lit scene | The bloom has no detectable edge. No discs, halos, rings, spotlight cut-outs or horizon lines. |
| "Buzz without the booze" (the client sheet's own hero line) | Blocked on compliance | Use **"Unwind without the booze."** — it is printed on the cans. See `selling-points.json`. |
| Cropping the can's spec panel out of frame to dodge garbled micro-type | Wrong fix, reverted | That copy is **real printed pack copy**. Removing it falsifies the packaging. Reproduce it and lock the numbers instead. |
| Nano Banana for the sibling pieces | Rejected after two passes | See §6. Use gpt-image-2 whenever the can's own printed copy has to survive. |
| Prompt blocks that hardcoded one line's can ("the same charcoal-grey body, the same pixel-mosaic bands") | Rejected — rendered a Cognition can in Social Elixir's charcoal-and-gold finish | The can's body and band colours come from REFERENCE 1, never from the prompt. Per-line facts live in `catalog.json`. |
| Letting the model near an unverified spec column | Rejected — it invented `20mg L-Theanine` where the can says L-Dopa | Unverified nutrition panels are rotated out of frame entirely, not shrunk or blurred. |
| One shared legal line for the whole brand | Rejected — stamped a 21+ age gate on a nootropic seltzer | Disclosures are per line and gated on `verified`. An unverified line gets no small print at all. |

---

## 5. Before you ship

Steps 1-4 are the repository's standard gate. Step 5 is specific to this brand and exists because
the image model draws the pack copy.

1. Every selling point maps to an **approved** claim record.
2. Required disclosures are legible in the final pixels.
3. Every CTA and QR code resolves to what its caption says.
4. A qualified human owns final legal, brand, and platform approval.
5. **Zoom to 100% and read every word in the image**, including the words printed on the can.

For step 5, open `catalog.json` → `packagingCopy` → **your product's line**, and check the render
against it word by word. Each of these has actually shipped wrong at least once:

- [ ] Can band matches that line exactly — Social Elixir renders have come back `BOODS`, `DOOZS`
- [ ] Can spec column matches that line, in order — a `30mg` has appeared in a correct row
- [ ] Can volume reads `12 FL OZ (355 ML)` — `358`, `368` and `15 FL OZ (80 mL)` have all shipped
- [ ] The line name (`SOCIAL ELIXIR` / `COGNITION ELIXIR`) is **the right one for this can**
- [ ] `DIETARY SUPPLEMENT` present and spelled correctly
- [ ] Headline spelling — `occasion` and `kavalactones` are the repeat offenders
- [ ] Age gate present, centred, bottom, correctly spelled
- [ ] The can is *the real can* — mosaic bands top and bottom, heavy chrome-and-gold italic
      wordmark, correct flavour tab, fruit artwork
- [ ] Logo is the chrome lockup with a **heavy** gold outline, not a thin outline version
- [ ] No lettering of any kind behind the can

A wrong number on a supplement pack is not a cosmetic defect. If a figure is wrong and you cannot
fix it by regenerating, turn that panel away from camera rather than shipping it.

---

## 6. Which model, and why it is not a preference

**Use `gpt-image-2` for anything where the can's printed copy must be correct.** This is a measured
result, not a taste call.

Nano Banana (`gemini-3-pro-image-preview`) rendered the *first* approved piece and is perfectly good
at scene work. But across two full passes on the sibling pieces, with character-exact string locks in
the prompt, it shipped:

- `BOODS` and `DOOZS` in place of `BOOZE`
- `30mg` substituted into a correct nutrition row
- `358 ML` and `368 ML` in place of `355 ML`
- and twice **replaced the can entirely** with an invented one — wrong wordmark, no mosaic bands,
  fabricated "PIXEL-MOSAIC FRUIT", a nonsense `15 FL OZ (80 mL)`

Adding more explicit instructions did not fix it. Nano Banana pattern-paints small type rather than
reading the instruction about it. gpt-image-2 got every one of those right on the first attempt,
because `/v1/images/edits` puts the real can render *into* the edit instead of describing it.

One useful exception: Nano Banana **does** respond to a spelling instruction for *headline* type — it
fixed `ocasion` to `occasion` once the proof-reading block was moved to the very end of the prompt,
where it is read last. The failure is specific to type printed on the referenced product.

Two API gotchas, both already handled in the generator:

- `input_fidelity` is a **gpt-image-1** parameter. gpt-image-2 rejects it outright.
- `quality: high` at 2560x3200 takes ~4 minutes per image. Background the run.

---

## 7. Style lock — how a new piece stays on-model

Pass three references, **in this order**, on every generation:

| # | File | What the model takes from it |
|---|---|---|
| 1 | the flavour's can render | exact can geometry, artwork, and every printed word |
| 2 | `dialedMoodsLogo.png` | the brand mark |
| 3 | `style_master_ref_1400.png` | the **look only** — light, layering, gold, type rhythm, margins |

Reference 3 is what stops each run re-rolling a fresh art direction. Its prompt block says
explicitly: *look only — not the words, not the flavour, not the layout content, not the colour of
the light.* Without that sentence the model copies the approved piece's headline.

Use the 1400px copy, not the full-size master — three full-resolution references risk the request
size limit, and the style anchor does not need the pixels.

If the approved direction ever changes, replace the master and regenerate the downscaled ref:

```bash
cd "Brand Context/assets/Dialed_Moods/creative"
sips -Z 1400 style_master_4x5.png --out style_master_ref_1400.png
```

---

## 8. Styling playbook — how to hit it 10 times out of 10

Everything above is *what* the brand is. This section is *how to actually get it* out of the model
every time. These are the habits that separated the runs that worked from the runs that did not.

### 8.1 The five things that do all the work

If you remember nothing else:

1. **Always pass all three references, in order.** Can, logo, style master. Dropping the style
   master is the single fastest way to get a graphic that is *fine* but not *ours*.
2. **Never edit a shared prompt block to fix one piece.** Fix it in the piece's own brief. Shared
   blocks carry the look for the whole set; editing one to rescue a single graphic silently
   degrades the other four.
3. **Change one thing per attempt.** Two changes and you cannot tell which one worked. A candidate
   is an experiment, not a reroll.
4. **The spelling block goes last.** Not because it is least important — because it is read last.
   Moving it to the end is what finally fixed `ocasion`. Order is a real dial.
5. **Read every word at 100% before you call it done.** The model draws the legal line and the pack
   copy. §5 is the checklist.

### 8.2 Prompt-craft that measurably worked

| Technique | Why it works |
|---|---|
| **Geometry, not percentages.** "ONE can on the RIGHT, the LEFT half empty" beats "can at 65% width". | Percentage briefs get ignored. Spatial relationships get followed. |
| **Name the reference by number.** "REFERENCE 1 is the actual can. Reproduce it EXACTLY." | The model maps refs by position. Un-numbered refs get blended into a vague average. |
| **Say what a thing is made of, not what colour it is.** "a vertical gradient from pale champagne through antique gold to dark bronze, with a bevelled edge and one specular streak" beats "gold text". | Material descriptions produce brushed metal. Colour names produce flat fill. |
| **Ban the failure explicitly, with its name.** "no hard-edged circle, disc, halo, ring or spotlight cut-out" | A general "soft background" does not stop a disc. Naming the artefact does. |
| **Quote every literal string.** Anything the model must letter goes in quotation marks, verbatim. | Un-quoted copy gets paraphrased and re-broken. |
| **Separate look from content when using a style ref.** "Reference 3 supplies the LOOK ONLY — not its words, flavour, layout or colour of light." | Without that sentence the model copies the approved piece's headline. |
| **Describe layers front-to-back.** back = atmosphere, mid = can, front = headline. | Turns "make it look deep" into instructions the model can actually execute. |

### 8.3 Diagnosing a bad render

Symptom → most likely cause → fix. Work down the list; the top rows are far more common.

| What you see | Cause | Fix |
|---|---|---|
| Garbled words on the can (`BOODS`, `358 ML`) | Wrong model | Use gpt-image-2. Prompt wording will not fix this. §6 |
| The can is not the real can | Composition pulled too far from the references | Restate the can contract inside the piece's own brief, and make the can bigger. The centred layout is the risky one. |
| Looks like a poster template, not a photograph | Hard-edged bloom | The glow must have no detectable edge. Check for discs, halos, horizon streaks. |
| On-brand but flat / lifeless | Type is sitting on top of the scene | The `typeDepth` block is missing or was trimmed. Type needs the shared key light, a shadow, and a floor reflection. |
| Reads like a different campaign | Style master not passed, or its "look only" clause was cut | Restore reference 3 and its block. |
| Headline misspelled | Spelling block not last | Move it to the end of the prompt. |
| Copy crowded, no room to breathe | Too much content in the brief | Cut a line. The empty left half is a feature, not wasted space. |
| Second colour fighting the gold | Flavour bloom bled into the type or a UI element | The bloom tints the *background only*. Type stays white + one gold phrase. |

### 8.4 Working efficiently

- **Background every run.** ~4 min per piece at `quality: high`. Four pieces is ~16 minutes.
- **Proof one piece before running the set.** Validate the brief on a single graphic, then fan out.
  Every wasted full-set run costs four renders.
- **Review downscaled, ship full-size.** A 1500px copy is enough to judge composition and catch
  most text errors; zoom the original for the final §5 pass.
- **Keep rejects until the set ships.** They are the evidence for §4. Delete them after.
- **Never hand-edit a final in an image editor.** If it is wrong, regenerate. A retouched final
  cannot be reproduced by the next person, which breaks the whole point of this pack.

### 8.5 What "10/10" actually means here

A graphic is done when all four are true. Three out of four is not done.

1. **On-brand** — it obeys the spine in §2 and would sit beside the approved piece without looking
   like a different campaign.
2. **Factually correct** — every word and number in the image, including on the can, matches
   `catalog.json`.
3. **Compliant** — age gate legible, no prohibited claim, no competitor named, no invented social
   proof.
4. **Distinct** — it has a texture no other piece in the set has. A re-skin fails even if 1-3 pass.

---

## 9. Two surfaces, do not mix them

Dialed Moods has two live looks and they are not interchangeable:

- **`launchDark`** — the Social Elixir launch set described in this document. Near-black, cinematic,
  one gold accent.
- **`whiteStudio`** — the brand's magazine-grade packshots on flat white/cream, used for product
  photography and can-reveal animation.

Both are correct Dialed Moods. Putting them in one set is not. Pick the surface from the deliverable
before you pick anything else, and record which one you used.

---

Validate the pack after any change: `npm run content -- brandkit validate dialed-moods`
