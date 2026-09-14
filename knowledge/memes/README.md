# Muha memes — the `memes` context category

This is the entry point for anyone making memes around a Muha Meds device. It is its own context
category in the knowledge layer, separate from product packshots (`product-assets`), brand docs
(`brand`) and creator content (`ugc`), so a meme brief pulls meme context and nothing else:

```bash
npm run content -- knowledge categories                       # what categories exist, with counts
npm run content -- knowledge query "drake device in hand" --brand muha --category memes
npm run content -- knowledge query "dual flavor prompt block" --category memes
npm run content -- knowledge query "which model for a video meme" --category memes,providers
```

`--category` is a hard scope: only chunks filed under it compete, and term weighting is computed
inside that corpus. Combine categories with a comma when a brief genuinely spans them.

## What is in the category

| Piece | Path | Tracked? |
| --- | --- | --- |
| The meme registry (schema `meme-registry/1`) | `knowledge/memes/muha-meds.json` | yes |
| Taste playbook + sourcing notes (parallel session, cross-linked) | `knowledge/playbooks/MUHA_MEME_TASTE.json`, `docs/MEME_SOURCING.md` | yes |
| The two meme device bodies as product nodes | `knowledge/products/muha-meds.json` → `MM-dual-flavor-aio`, `MM-gen2x2-magnetic` (filed under both `product-assets` and `memes`) | yes |
| Per-project build notes, lessons and the handoff | `Muha Memes/<project>/README.md`, `Muha Memes/HANDOFF__MUHA_MEMES.md`, `Muha Memes/DEVICE_SPEC.md` | local-only, indexed where present |
| Device renders, templates, outputs, tools | `Muha Memes/DualFlavor/{refs,templates,out,final_genz*,clips,*.py,*.mjs,*.sh}`, `Muha Memes/MagneticDispo/{assets,strains,refs}` | local-only |

`Muha Memes/` is ignored by the curated allowlist, so the registry carries everything a fresh clone
needs to reason about a brief: the verbatim device prompt blocks, the fixed SKU/pair tables, the
grammars, the pipelines, the provider matrix, every shipped meme with its lessons, and the law bank.
Only the pixels stay on the build machine.

## The registry, section by section

| Section | Answers |
| --- | --- |
| `devices[]` | Which body: `mm-aio-slim`, `mm-gen2x2-magnetic` (the pair), `mm-dual-flavor-aio` (the "Switch"). Measured geometry, canonical ref paths, the verbatim prompt block (`deviceBlock`), SKU tables, locked rules, what has shipped on it |
| `grammars[]` | The joke mechanisms (prop-in-hand, held-large, resting-object, two-halves-meeting, character-replacement, …) and which device fits each |
| `pipelines[]` | A regen-scene (video), B v2v-edit (video), C still-edit-gpt, D still-edit-nb, E per-panel inpaint, F deterministic card, G targeted fix — with `when`, steps, tools, cost |
| `providers[]` | What gpt-image-2, Nano Banana Pro, Seedream, MiniMax H3, Veo, Seedance, Kling and Wan accept, refuse and do badly — measured, not assumed |
| `sourcing` | Template routes with provenance (imgflip API, Wikimedia Commons imageinfo), IP classes, where the library lives |
| `captionStyles` + `taste` | The card geometries and the operator's taste record: what was liked, what was called corny, and the Gen Z brand-page voice that replaced it |
| `templates[]` | Every meme built (Titanic … Mona Lisa, the Dual Flavor rounds 1–5, the text-free GIFs) with status, pipeline, outputs and lessons |
| `laws[]` | The law bank: claim / evidence / counterexamples / applies_to / confidence / source |
| `results` | Round-by-round outcomes and spend |
| `tools` | The scripts that implement the pipelines for the Dual Flavor device and what each does |

## The rules that matter most (all recorded as laws)

- **The device is reproduced from its reference, never described from memory.** Template frame in
  as REFERENCE 1 (layout master, "keep the meme exactly as it is, edge to edge"), device Front + 45°
  renders as references, the verbatim device block appended. Never invent readable words on its screen.
- **Voice (Dual Flavor, 2026-09-10 →):** lowercase deadpan first-person captions on a white bar
  (Helvetica Neue Medium, 1080x1350) or a TikTok-style overlay; never the product name, tagline or mg;
  the device is present, not the hero. Impact-caps product copy was judged corny.
- **Format:** every still is 4:5 portrait. GIF/video deliverables are the bare swapped clip, MP4 + GIF,
  no caption card; MP4s open in QuickTime, never a browser.
- **Compliance:** never depict inhaling or consumption; animals do not mouth the device unless the
  operator explicitly overrides; no drug slang; no child characters holding the device.
- **Moderation (measured):** family animation, Disney/Pixar/DreamWorks characters and superhero IP
  (Batman, Spider-Man) + a vape are refused on every still provider; public-domain paintings, line
  drawings, adult animation, hands-only photos and animals pass; real people are a per-candidate coin
  flip; MiniMax H3 refuses some actor footage (run the coin control first).
- **Video:** to preserve the original clip, MiniMax H3 v2v on the real footage first; a blocking-diagram
  re-stage + Kling frozen-device i2v second; free re-stages last. Size and orientation of an inserted
  object are set with a **size still** (composite the render at the wanted size into one source frame,
  clean it with a gpt-image-2 edit, pass it as the image reference), not with words.
- **Iterate one property per pass, then regenerate once from the clean source** with everything
  combined — chained passes degrade the picture.

## Adding to the category

1. New meme or round: append the concept to the local `concepts.json`, ship to the project folder,
   then add a `templates[]` entry (or extend the round's entry) and a `results.roundN` line.
2. New rejection, refusal or measured limit: add a `laws[]` entry with evidence paths.
3. New device body: add to `devices[]` with geometry, refs, the verbatim prompt block and locked rules,
   and register it in `knowledge/products/muha-meds.json` with `categories: ["product-assets","memes"]`
   on its graph node.
4. New source document: add it to `knowledge/graph.json` `sources[]` with `categories: ["memes"]`
   (`optional: true` if it lives in the local-only `Muha Memes/` tree), then `npm run knowledge:build`.
