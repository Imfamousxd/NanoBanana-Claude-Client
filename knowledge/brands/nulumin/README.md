# NuLumin brand pack

Everything needed to produce a brand-faithful NuLumin ad or creative on a **fresh clone**, without
re-deriving the design system, the prompt contracts, or the compliance boundaries.

## Files

| File | What it is |
|---|---|
| `design-system.json` | Colors, type, signature devices, disclosures. Two palettes — marketing vs packaging — that are **not** interchangeable. |
| `catalog.json` | Compounds used in creative work: category, accent, cap/cake colors to pin in prompts, canonical asset. |
| `selling-points.json` | The interchangeable selling-point matrix, hooks, CTAs, and the prohibited list. Each point names its claim record. |
| `hero-prompts.json` | Literal prompt blocks for Nano Banana hero scenes: product contract, composition, approved styles, dropped styles. |
| `AD_SYSTEM.md` | The three approved ad formats, the layout law, the rejection history, and the CSS gotchas. |
| `HERO_PROMPTS.md` | How to assemble and use the hero prompts; what renders wrong by default. |

Brand narrative, logo rules, label rules, and the full asset map stay in
`Brand Context/NuLumin_BioSciences.md`. This pack is the *operational* layer on top of it.

## First run

```bash
npm install
cp .env.example .env          # add GEMINI_API_KEY for hero scenes
npm run doctor                # checks Node, keys, ffmpeg, Chrome
npm run content -- brandkit fonts nulumin      # one-time: bundles the 4 webfonts offline
npm run content -- brandkit ad nulumin single --compound ghkcu --variant base
```

That renders a complete, on-brand static ad with no API call and no network access after the font
bundle. Add `--ratio 9:16,4:5,1:1` for the full placement set.

For a new hero scene:

```bash
npm run content -- brandkit job nulumin hero --compound ghkcu --style cryo --ratio 9:16 > job.json
npm run content -- plan job.json          # offline; fix every error
# set execution.approved:true after confirming scope and cost with the client
npm run content -- run job.json
```

## Claims are drafts until a human approves them

Every record in `knowledge/claims/claim.nulumin.*.json` ships with `status: "draft"`. The source
citation is filled in and was verified on the live site — that is evidence the statement is
*published*, not that it is *approved for advertising*.

To activate one, a qualified human must confirm the substantiation, then edit the record:

```json
"status": "approved",
"owner": "<accountable reviewer>",
"reviewedAt": "<today>",
"reviewAfter": "<review date>"
```

Until then the engine blocks any job whose prompt asserts purity, testing, certification, origin, or
regulatory claims. That block is intentional. The deterministic ad generator does not route through
it, so nothing stops you from *designing* — only from *shipping an unsourced claim*.

## The two hard rules

1. **Research use only.** Never depict or instruct human consumption, injection, reconstitution,
   dosing, or protocols. The RUO line is rendered deterministically and stays legible in the final
   pixels.
2. **Never invent a fact.** No efficacy, safety, purity, certification, lab, or regulatory claim
   without an approved record. A disclaimer does not cure otherwise noncompliant creative.
