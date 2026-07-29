# Aevum+ (Aevum Plus)

New **peptide-sciences brand** the user is starting (began 2026-06-10). Currently in
the logo/identity-building phase — no packaging, campaigns, or site collateral yet.

This document is fully standalone — everything needed to produce on-brand Aevum+
content is written out below. Do not invent colors or directions beyond it.

---

## 1. Brand identity

- **Wordmark: "Aevum+"** — the "+" is PART of the mark; sometimes set all-caps
  "AEVUM+".
- **Tagline / descriptor: "PEPTIDE SCIENCES".**
- **Name meaning:** Aevum = "eternal / age / eternity" — the locked logo direction
  deliberately fuses A + infinity (∞) + an endless-ribbon/helix as symbols of that.
- **Brand colors (locked):**
  - **San Marino blue** — a muted slate-denim blue, ~`#4D6E9E` (the signature color)
  - White / silver / grey
  - Black / near-black navy
- **Visual language:** clean modern medical-science mark-making — the "Aevum+"
  wordmark paired with a science ICON (DNA double-helix, molecular node/atom
  clusters, sometimes inside a hexagon shield). Navy + grey two-tone, minimal,
  premium clinical. The inspiration board is saved at
  `Aevum Plus/inspiration-aevum-logos.png`.

---

## 2. Locked visual rules

- **Logo direction LOCKED (2026-06-11): the "eternal ribbon" mark — winner file
  `aevum-eternal-6.png`.** It is a sculptural premium **ribbon mark**: a continuous
  twisting ribbon (San Marino blue → near-black navy gradient, with a fine SILVER
  metallic edge) forming a tall capital **'A'** silhouette that resolves into an
  **infinity (∞) knot at the base**. Symbolism: A + ∞ + endless ribbon/helix =
  "eternal".
- **Rejected directions (do NOT revive):**
  - Literal A + helix + hexagon emblems — "too busy"
  - Plain minimal A+ marks — "too basic"
- All new logo work must continue THIS ribbon direction — the refinement family is
  `aevum-eternal6-v1..6` (batch file `aevum-eternal6-refine.json`, which anchors the
  winner as reference so the style carries between generations).
- Color discipline: San Marino blue + navy + silver on **white backgrounds**
  (gpt-image-2 cannot output transparency — white bg is the working standard until
  the export system exists).
- **Planned after final lock (not yet built):** an export system producing
  full-color / solid-black / white-knockout / transparent variants at the EXACT
  San Marino blue.

---

## 3. Asset map

- `Aevum Plus/` — brand root folder (repo).
  - `Aevum Plus/inspiration-aevum-logos.png` — the inspiration board (source of the
    visual language in §1).
  - `Aevum Plus/Logos/` — all logo outputs, copied in from `generations/` with
    stable names. Key files: **`aevum-eternal-6.png`** (the locked winner) and the
    refinement family `aevum-eternal6-v1..6`.
- Batch JSONs at repo root (e.g. `aevum-eternal6-refine.json`) — run with
  `node gpt-image.mjs --batch <file>.json`; raw outputs land in `generations/`,
  then get copied into `Aevum Plus/Logos/`.
- **`aevum-svg-render.py` exists at the repo root** — an Aevum SVG→render script
  (presumably part of the vector/export tooling for the mark); check its header
  before use to confirm exact behavior.

---

## 4. Campaigns run

None yet. Work to date is brand-building only:
1. Logo concept exploration (multiple distinct concepts via gpt-image-2).
2. Direction lock on the `aevum-eternal-6` ribbon mark + its `v1..6` refinement
   batch.
Next planned step is the logo export system (§2), then presumably packaging/
collateral in the San Marino blue + white/silver + black system.

---

## 5. Generation playbook

- **Model: gpt-image-2** (generations endpoint), **1:1, quality high, WHITE
  background** — gpt-image-2 cannot do transparent backgrounds, so all logo comps
  are generated on white and any knockout/transparent variants must come from a
  later export step.
- **Batch workflow:** write a batch JSON, run `node gpt-image.mjs --batch
  <file>.json`; outputs land in `generations/`; copy keepers into
  `Aevum Plus/Logos/` with stable descriptive names.
- **Refinement loop:** generate several distinct concepts → user picks →
  one-at-a-time refinement on the approved concept. When refining the locked mark,
  pass `aevum-eternal-6.png` as the reference image and instruct the model to keep
  its exact style/geometry (anchor-the-ref technique) — text-only prompts drift.
- **Prompt language that matters:**
  - Describe the mark as: "a continuous twisting ribbon forming a tall capital 'A'
    that resolves into an infinity (∞) knot at the base; San Marino blue
    (~#4D6E9E) flowing into near-black navy, with a fine silver metallic edge;
    sculptural, premium, minimal clinical branding; white background".
  - Wordmark text: spell exactly "Aevum+" (or "AEVUM+") and "PEPTIDE SCIENCES";
    add the negative "no other text, no misspellings".
  - Avoid drifting back to hexagon shields / literal DNA emblems (rejected) or
    stripped-down flat A+ marks (rejected).
- **General repo rules that apply:** small self-contained `.mjs` per job, 2–3
  candidates for subjective picks, timestamped output names, open results with
  `open -a Preview "<path>"`, never composite generated parts — iterate by prompt.
