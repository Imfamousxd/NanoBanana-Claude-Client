# Brand packs

A brand pack is the operational layer that lets a fresh clone produce correct work on the first
attempt instead of the fifth. `Brand Context/` holds the narrative — who the brand is, what it
sounds like, what its logo rules are. A pack holds what a *generator* needs: exact tokens, the
compound or SKU facts a prompt must pin, the copy matrix, the verbatim prompt blocks, and the
formats that have already survived client review.

```
knowledge/brands/<brand>/
  design-system.json     tokens: color, type, devices, disclosures, asset paths
  catalog.json           products with the facts a prompt or layout must state exactly
  selling-points.json    copy matrix; every point names its claim record
  hero-prompts.json      verbatim generative prompt blocks, approved and dropped styles
  <FORMAT>.md            the layout law and the rejection history behind it
  README.md              index and first-run instructions
```

Shipping packs: **nulumin**.

## Commands

```bash
npm run content -- brandkit list                 # packs present
npm run content -- brandkit new <brand>          # scaffold a valid pack and register it
npm run content -- brandkit validate [<brand>]   # structural check with a fix for each problem
npm run content -- brandkit kit <brand>          # what the pack knows + what is missing
npm run content -- brandkit fonts <brand>        # one-time offline webfont bundle
npm run content -- brandkit ad <brand> <format>  # deterministic layout render, no provider call
npm run content -- brandkit job <brand> hero     # emit a content job for the generative half
```

`brandkit kit` is the fastest way to orient: it lists the formats, compounds, variants, hooks and
hero styles the pack supports, reports whether the fonts are bundled and Chrome is available, and
flags any declared asset that is not on disk.

## The two halves of a creative

Most brand work in this repo splits cleanly:

| Half | Tool | Why |
|---|---|---|
| The **scene** — product, light, atmosphere | an image model | Only a generative model produces photoreal glass, skin, or environment. |
| The **layout** — logo, headline, copy, CTA, disclosure | HTML/CSS → headless Chrome | Exact copy, exact hexes, exact type. Free per render, seconds not minutes, and incapable of hallucinating a claim into the artwork. |

Never ask an image model to render legal copy, a logo, a certificate, a QR code, or a table. Never
hand-composite pixels to fix what a prompt should have specified.

## What ships, and what does not

**Ships (tracked):** the pack JSON and markdown, a small curated asset set under
`Brand Context/assets/<Brand>/ads/` — logo lockups, product cutouts at native resolution, and scene
anchors resized to the render size.

**Does not ship:** the font bundle (`.content-engine/fonts/`), trimmed-logo caches, and every
generated output. They are all reproducible and all gitignored.

## Requirements

- **Node 20+** and `npm install`.
- **Google Chrome or Chromium** for layout renders. `CHROME_PATH` overrides discovery.
  `npm run doctor` reports it.
- **Network, once**, to bundle the webfonts. After that renders are fully offline.
- An image-model key only for the generative half.

Headless Chrome frequently writes its screenshot and then fails to exit. The renderer therefore
watches for the output file to appear and stop growing, then kills the process group — it never
waits on the process. If you write a new renderer, do the same or every batch will stall.

## Claims

Packs ship claim records at `status: "draft"` with the source citation filled in. A published
statement is evidence that it is *published*, not that it is *approved for advertising*. A qualified
human sets `owner`, refreshes `reviewedAt`, and flips `status` to `approved`. Until then the engine
blocks any job whose prompt asserts purity, testing, certification, origin, or regulatory claims.

The deterministic layout generator does not enforce that block — it reports which claim records each
render depends on, in the run manifest and in the CLI output. Check them before anything ships.

## Adding a pack

The procedure and the rules around it live in **[`CONTRIBUTING.md`](../CONTRIBUTING.md)** — read that
rather than reconstructing the steps here. The short version:

```bash
npm run content -- brandkit new <brand-id> --name "Display Name" --compliance <profile>
# fill in the TODOs, commit the artwork, write the claim records
npm run content -- brandkit validate <brand-id>
npm run knowledge:build
```

`brandkit new` writes a structurally valid skeleton and registers the brand, the pack, and its asset
collection in `knowledge/graph.json`, so nobody has to remember the wiring.

## Validation

`brandkit validate [brand]` checks pack structure and reports each problem with a fix. It runs over
every pack inside `npm run doctor`, so a broken pack fails the environment check instead of surfacing
later as a bad render.

It catches, among others: a product referencing a category or color key that doesn't exist; an asset
that is declared but missing, or that points outside the repository; a selling point with no claim
record, or a claim record that is approved with no accountable owner; a variant that isn't exactly
three points; a prompt block using a placeholder nothing fills; and pack documents that were never
registered as knowledge sources.

Existing packs are covered automatically — the test suite validates every directory under
`knowledge/brands/`, so a new pack inherits the checks without anyone adding a test.
