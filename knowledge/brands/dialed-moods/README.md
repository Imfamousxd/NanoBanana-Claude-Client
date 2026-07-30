# Dialed Moods brand pack

Everything needed to produce a brand-faithful Dialed Moods graphic on a **fresh clone**, without
re-deriving the design system, the prompt contracts, or the compliance boundaries.

**Start here:** open the approved reference, then read `FORMATS.md`.

```
Brand Context/assets/Dialed_Moods/creative/style_master_4x5.png
```

## Files

| File | What it is |
|---|---|
| `FORMATS.md` | **The guideline.** The layout law, the approved formats, the rejection history, the pre-ship checklist, the styling playbook (§8) and which model to use. Read this one. |
| `design-system.json` | Colors, type rules, signature devices, disclosures, assets. Two surfaces — `launchDark` vs `whiteStudio` — that are **not** interchangeable. |
| `catalog.json` | The three Social Elixir flavours, the product facts, and the exact words printed on the can. |
| `selling-points.json` | The copy matrix, approved headlines, greenlit structure/function language, and the prohibited list. |
| `hero-prompts.json` | The eight literal prompt blocks that produce the approved look, plus the provider config and the dropped styles. |

Brand narrative and the wider asset map stay in `Brand Context/`. This pack is the *operational*
layer on top of it.

## First run

```bash
npm install
cp .env.example .env          # add OPENAI_API_KEY
npm run doctor                # checks Node, keys, ffmpeg, Chrome
```

Then generate. The working generator is at the repository root:

```bash
node dialed_social_elixir_gen.mjs 4x5                  # all five launch pieces
node dialed_social_elixir_gen.mjs 4x5 3_how_to_use     # one piece
node dialed_social_elixir_gen.mjs 9x16                 # the vertical set
```

Output lands in `Dialed Moods Social Elixir/out_<ratio>/`. Roughly four minutes per piece —
background the run. **Then review every render against the checklist in `FORMATS.md` §5.**

Reference art is read from `Brand Context/assets/Dialed_Moods/creative/`, declared in
`design-system.json` under `assets`. The generator resolves paths from its own location, so a fresh
clone works anywhere — no path editing.

Finished examples of the approved look live in `Dialed Moods Social Elixir/out_4x5/`. Open one
beside your own output before deciding you are done.

**If you want the graphics to come out right every time, read `FORMATS.md` §8.** It is the styling
playbook: the five habits that do most of the work, the prompt-craft that measurably worked, and a
symptom-to-fix table for diagnosing a bad render.

## The two rules that matter most

1. **Generate the entire graphic. Never composite.** Do not place the supplied can render into an
   HTML/CSS layout and screenshot it. Pass the renders as *references* and let the model produce
   background, can, type and layout together. This is the opposite of most brands in this
   repository, and `FORMATS.md` §1 explains why.

2. **Use `gpt-image-2`, not Nano Banana, whenever the can's printed copy has to be correct.** This
   is a measured result, not a preference — `FORMATS.md` §6 has the evidence.

## Claims are drafts until a human approves them

Every record in `knowledge/claims/claim.dialed-moods.*.json` ships with `status: "draft"`. Those
values were transcribed from the client-supplied pack render — that is evidence the number is
*printed*, not that it is *approved for advertising*.

To activate one, a qualified human must confirm the substantiation, then edit the record:

```json
"status": "approved",
"owner": "<accountable reviewer>",
"reviewedAt": "<today>",
"reviewAfter": "<review date>"
```

## Open questions — do not silently decide these

1. **The brand typeface is unverified.** The approved renders came from a prompt description, not a
   font file. `design-system.json` carries Archivo + Inter as a documented stand-in so the pack
   validates. Ask the client for the real family before setting any type deterministically.
2. **FDA supplement disclaimer placement.** The cans are labelled DIETARY SUPPLEMENT. Whether the
   structure/function disclaimer must appear on-graphic or may live in the caption is unresolved.
3. **Kava safety posture on the how-to piece.** The client sheet's risk row requires an
   occasional-use framing. Confirm the exact wording with the client's reviewer.

---

Validate after any change: `npm run content -- brandkit validate dialed-moods`
