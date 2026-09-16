# Dropbox render folders — one structure for every brand, keyed to the SKU books

Status 2026-09-16 · Owner: Mario · Inputs: the Muha Meds SKU Book (8 market sheets + accessories) and the
Dialed Moods SKU sheets (products, 2026 products, accessories), parsed into `knowledge/skus/*.json`;
the DAM's analysis of every render file in the team Dropbox (8,660 files).

The goal: a user names a product ("Frozen Pomegranate dispo", "Blue Glacier") and the content-gen MCP
finds that SKU's renders — device alone, packaging, display box, cutout, label — because every render
lives in a folder that carries the customer-facing name **and** the SKU code, in the same shape for every
brand.

---

## 1. What the SKU books say

| Brand | Sheets | Lines (product families) | Items (flavours / SKUs) | Unique SKU codes | Markets |
|---|---|---|---|---|---|
| Muha Meds | 9 | 122 | 976 | 243 | AZ, CA, MI, MO, NJ, NM, NY, OH |
| Dialed Moods | 3 | 36 | 159 | 84 | none (one catalogue) |

Muha lines by category: disposables 293 items · pre-rolls 207 · cartridges 143 · concentrates 118 ·
edibles 94 · flower 62 · pods 42 · accessories 23.
Dialed Moods lines: beverages (Motivation / Social / Cognition Elixir, energy drinks, seltzers), shots,
gummies, stick packs (Morning After, Recharge Me, Creatine + Collagen, Whey, Collagen, EAA, Fiber),
accessories, merch.

**Sheet issues worth fixing at the source** (they will otherwise become folder names):
- Spelling drift in line titles: "Distallite", "DistiIlate" (capital I), "Habenero", "Pomegranite",
  "Rasberry", "Watermeon". The registry keeps the sheet spelling; the folder plan uses the corrected one.
- The same line appears twice in a sheet (OH gummies block ×2, MI/CA "Muha Donuts" blocks, MI "Hash
  Rosin Mates" old + new). The OH sheet also contains MO and MI Mates blocks by copy.
- Newer lines have no SKU block number (CA Live/Cryo Sift, Temple Ball, Dry Sift, Greenhouse Joint,
  Dank Darts, Muharillos, Magnetic Dispo, Dual Dispo, MI "New 2G Disposable Flavors" second block).
  The plan assigns a **line code** for these (see §4) until the book gives them one.
- The whole **Hemp** line (THCP/HHC/Delta-8 carts, hemp disposables, King pre-rolls, flower bags,
  Gummiez), **Muha Moods** (10,000-puff disposables), **Mavricks**, **Muha Madness** pre-rolls and the
  **MI 2G Pod / Pod-Battery kits** are in the Dropbox but not in any sheet.
- Pod lines have no codes at all; some MI blocks carry the barcode in the SKU column.
- Dialed: "Products SKU Sheet" and "2026 Products" restate the same codes; the 2026 sheet carries the
  customer-facing line names (Motivation Elixir, Social Elixir, Cognition Elixir) — those win.

---

## 2. What the Dropbox has today (from the DAM)

**Muha** (`/2025 Full Ops/MUHA MEDS/Renders`, 5,362 analysed render files):
`Disposables` 1,348 · `Hemp` 1,158 · `Pre-Rolls` 553 · `Cartridges` 550 · `Concentrates` 364 ·
`Edibles` 306 · `Flower Jars` 158 · `Discontinued` 119 · `Accessories` 117 · `CA catalog resized` 90 ·
`Pod & Battery Kits` 84 · `Website Images` 68 · `Moods` 58 · `Motion` 53 · `MMxCookies` 45 · `TEMP` 43 ·
`Flower Bags` 34 · `HOTKNIFES` 31 · `Ai Resources` 24 · `Device` 23, plus a second curated tree at
`…/DAM 2, Muha THC = Asset Receiving/Approved Renders/Renders/<Market>/…` and copies under
`Design/Graphic Designer General SOP`. Inside a category the next level is sometimes the market
(`Disposables/MI/…`), sometimes the line (`Cartridges/Distillate/MI/…`), sometimes a date
(`CA_1G_MeltedDiamonds_TechDesign_June2025`). Versions live as `v1/v2/v3` folders or `_V1` suffixes.

**Dialed Moods** (`/2025 Full Ops/DIALED MOODS`, 2,059 files): `Renders/DialedMoods/Dialed Sku's/<Line>/
<Flavour>/…` (1,569), contract photos under `DAM 1 … /CP1 = Contract Photo and Video` (214), `Renders/
Assets for Amazon` (94), a `Moods` tree that actually belongs to Muha Moods (70, under the Muha source),
`DAM 2 … /Approved Renders` (34), `Website Assets/August 2026 SKU Images` (29), `Renders/Apparel` (27).

**Coverage after matching every SKU item to the analysed renders** (`knowledge/skus/*.coverage.json`):

| Brand | SKU items with ≥1 render | Renders matched to a SKU | Render folders matching no SKU |
|---|---|---|---|
| Muha Meds | 722 / 976 (74 %) | 3,812 / 5,362 | 111 |
| Dialed Moods | 124 / 159 (78 %) | 1,443 / 2,059 | 34 |

Biggest Muha gaps (SKU lines with few or no renders): CA hash concentrates V2 family (Live/Cryo Sift,
Bubble Hash Caviar, Temple Ball, Full Melt, Piatella V2, Dry Sift, Kief Caviar — 2–4 of 15 each),
CA Muha Fire Flower 1.5g (0/5), Muha Donuts / Donut Holes (0–1 of 3–6), Greenhouse Joint (1/8),
Pod & Battery kits (1–4 of 11), MI "New 2G Disposable Flavors" second wave (0/10), OH Magnetic Dispo
(5/20), MO 3.5g/7g Infused Flower (6/15), Accessories (2/23). Dialed gaps: Whey / Fiber stick packs,
Maeng Da powder and pills, new Kava Shots, accessories (3/15).

Muha render folders that match **no** SKU line (the "name these" list, §6): `Hemp/Cartridges` 187,
`Hemp/Disposables` 148, `Discontinued/Disposables` 84, `Pre-Rolls/Glass Jars` 75, `Concentrates/Old CA
Box OCT 2023` 70, `Hemp/FlowerBag` 48, `Hemp/Pre Rolls` 43, `Pre-Rolls/Metal Can (CA)` 36, `Pod &
Battery Kits/MI 2G Vape Pod` 36 + `MI 2G Pod Battery Kit` 31, `Accessories/Lighter` 36, `Concentrates/MO
Concentrate NOV 2025` 32, `Cartridges/Distillate (MO)` 30, `Moods` 29 (+58), `Flower Bags/THC` 27,
`Motion/MI Mambas Flying Gummies` 26, `Disposables/Device` 23, `Edibles/MI Gummies` 21,
`Cartridges/Hash Rosin` 20, `Edibles/Metal Cans` 19, `Hemp/Edibles` 19, `Pre-Rolls/MuhaMadness` 19,
`Mavricks` 13, `TEMP/5g cured rosin` 15, `TEMP/2g Infused Joints` 9, `Labubu` 10.

---

## 3. The target structure — identical for every brand

```
<Brand>/Renders/
  _README.md                       ← this convention in ten lines, kept in the folder
  _Inbox/                          ← drop new renders here; the DAM proposes the folder, a human confirms
  _Discontinued/                   ← same tree as below, kept for history, hidden from default search
  <Category>/                      Disposables · Cartridges · Pods · Concentrates · Pre-Rolls · Edibles · Flower
                                   · Beverages · Shots · Gummies · Stick Packs · Accessories · Merch
    <Market>/                      Muha only: AZ CA MI MO NJ NM NY OH (+ HEMP for the hemp line). Dialed skips this level.
      <Line — customer-facing>/                           "Melted Diamond Disposables 1G"   ← Dropbox tag: CA029
        <Flavour — customer-facing>/                      "Frozen Pomegranate"              ← Dropbox tag: CA091
          01 device/        the device / can / jar / stick ALONE — front, 45, side, back
          02 packaging/     box, bag or jar only, and box + device
          03 display/       display box, master case, 6-pack / 12-pack, multi-unit sets
          04 cutout/        transparent PNG of the product (web, compositing)
          05 label/         flat label / dieline PREVIEW as PNG (print sources stay in Packaging)
          _old/             superseded versions — never deleted
        _line/              flavour-less renders: hardware only, lineups, group shots, generic display
```

Rules that make it work:

1. **Folder and file names are the customer-facing names only — no codes.** Nobody browsing Dropbox
   sees a SKU. The correlation lives in two places that people never have to read: a **Dropbox tag** on
   the line folder and on the flavour folder (Dropbox tags sit on files and folders, up to 32
   characters, letters/digits/underscore — e.g. `CA029`, `CA091`, `DM_LDE_BGL`; visible only in the
   item's detail pane), and the **SKU registry** in the engine (`knowledge/skus/<brand>.json`), which
   maps every line + flavour name to its codes. The DAM reads the tags at discovery (`files/tags/get`)
   and falls back to the name match; the tag wins when both exist.
2. **Codes come from the SKU book**: the line's block number (CA029, MI031, NM006) or, where the book
   has none, the product-code prefix (Dialed `DM_LDE`) or an assigned code (§4). The flavour tag is the
   item's SKU. The tags are written once by the migration script, and `_Inbox` filing adds them to new
   folders automatically; a person never types a code.
3. **Compositions are folders, not file-name guesses.** `01 device` vs `02 packaging` vs `03 display`
   is the difference the content engine needs most (device-only close-ups vs packaging heroes vs
   display shots), so it is a folder, numbered so it sorts the same everywhere.
4. **Versions never overwrite.** New version → new file with `_v3`; the old one moves to `_old/`.
   The DAM already ranks the highest version first and marks `_old` as discontinued.
5. **One product line, one folder, one market.** If a line ships in five markets with different
   packaging, it has five folders (one per market); shared hardware renders go in `_line/`.
6. **Nothing but renders in `Renders/`.** Motion stills, website composites, ad mock-ups, AI resources,
   HQ environment renders and character art move to their own trees (`Motion/`, `Website Images/`,
   `Marketing/`) — the DAM classifies them separately anyway.
7. **`_Inbox/` is the only place new files land.** The watcher analyses them within minutes, proposes
   `Category/Market/Line/Flavour/composition` from the vision result plus the SKU registry, and a human
   confirms the move in the DAM UI. Files never go straight into the tree by hand.

File names inside the leaf folders stay human too: `<Flavour> <view> <composition> v<N>.png`, e.g.
`Frozen Pomegranate 45 device v2.png`, `Blue Glacier front can v1.png`. The folder and its tag carry
everything else.

---

## 4. Muha lines without a book code — proposed line codes (Mario to confirm)

| Dropbox folder today | Proposed line name | Proposed code | Note |
|---|---|---|---|
| Hemp/Cartridges (THCP/HHC/Delta-8) | Hemp Cartridges 2G | HEMP-CART | needs a hemp SKU sheet |
| Hemp/Disposables | Hemp Disposables (Live Resin 3.5g / Melted Diamonds) | HEMP-DISPO | split by format when the sheet arrives |
| Hemp/Pre Rolls (King) | Hemp King Pre-Rolls THC-A | HEMP-KING | |
| Hemp/FlowerBag, Flower Bags/THC | Flower Bags (Lollipop, Purple Wookies…) | HEMP-FLWB / CA-FLWB | |
| Hemp/Edibles (Mambas, Gummiez) | Hemp Gummies (Mambas) | HEMP-GUM | |
| Moods (10,000 puffs) | Muha Moods Disposables | MOODS | own line, own tree |
| Mavricks | Mavricks Hash Rosin Disposables 0.5G | MI023 | already MI023 in the book |
| Pod & Battery Kits/MI 2G Vape Pod, Pod Battery Kit | 2G Vape Pods · Pod & Battery Kits | MI028 / MI028-POD | book has MI028 for kits |
| Pre-Rolls/MuhaMadness | Muha Madness Pre-Rolls 1G | MADNESS | not in book |
| Pre-Rolls/Glass Jars, Metal Can | Mates (jars = old packaging) | CA035 / MI027 by market | classify by market, `_old` for jars |
| Concentrates/Old CA Box OCT 2023 | Hash Rosin Concentrate Jars (old box) | CA033 → `_old` | |
| TEMP/5g cured rosin, 2g Infused Joints | MO Cured Rosin 5g · MO 2G Infused Pre-Rolls | MO-ROSIN-5G / MO-IPR-2G | TEMP tree to be emptied |
| Disposables/Device (dual-flavor AIO, gen2x2 magnetic, Mist) | Hardware renders | `_line/` of the matching line | |
| Discontinued/Disposables (HHC, Delta 10) | Discontinued hemp disposables | `_Discontinued/HEMP/…` | |
| Labubu, HOTKNIFES, Ai Resources, Motion, Website Images | not product renders | move out of `Renders/` | |

Dialed Moods: every line has a product-code prefix already (`DM-EDK` Performance Elixir, `DM-NPE`
Motivation Elixir, `DM-KES` Social Elixir, `DM-LDE` Cognition Elixir, `DM-EMA` Morning After, `DM-ERM`
Recharge Me, `DM-GCR` Creatine Gummies, `DM-CPC` Creatine + Collagen, `DM-PHP` Electrolyte Packets,
`DM-PEP` Energy Packets, `DM-LSE` / `DM-LSK` / `DM-ESK` shots, `DM-KTG` Kratom Gummies, `DM-CTG` old
Creatine Gummies, `DM-SLJ`, `DM-SMO`, `DM-ESZ` seltzers). The unlisted `DM-secret-juice` folder needs a
name. Packs: `03 display/` holds the 6-pack, 12-pack and master-case renders; the item folder holds
the single can / stick / jar.

---

## 5. How the MCP uses it (already built; only the folder shape is new)

- `knowledge/skus/<brand>.json` — the SKU registry from the sheets (`npm run content -- skus import`).
- `knowledge/skus/<brand>.coverage.json` — every SKU item ↔ its renders, per composition, with the
  folders they came from; render folders that match nothing (`skus coverage`).
- The DAM's discovery step will read the Dropbox tags on each folder (`files/tags/get`, batched) into
  `flags.render.sku` / `flags.render.lineCode`, match the folder names against the registry when a tag
  is missing, and read the numbered composition folders into `flags.render.compositionFolder` — so a
  render is correctly typed and SKU-linked the moment it is discovered, before any paid analysis.
- The product kit (`dam_product_refs`, `context_pack`) resolves a request by SKU code, customer-facing
  name, or flavour + line words, and prefers the folder's composition over the model's guess.
- The Products view shows coverage per SKU line; `_Inbox` proposals appear there for confirmation.

---

## 6. Migration — phases

| Phase | What | Who | Cost |
|---|---|---|---|
| 0 | Confirm the names/codes in §4 and the category list; fix the sheet issues in §1 that you care about | Mario + Dropbox owner | — |
| 1 | Generate the **move map**: for every render file, current path → target path, from the SKU match (confidence ≥ high) and the vision composition, plus the tag each folder gets; export as CSV; verify the tags API on one test folder first (`files/tags/add`); files with low confidence go to `_Inbox/<current folder>` | me | free |
| 2 | Review the move map in the DAM UI (per line, with thumbnails); mark exceptions | Mario / Dropbox owner | — |
| 3 | Execute with the Dropbox API in batches (`move_batch`), dry-run first; the DAM watcher re-indexes the moves; content hashes mean nothing is re-analysed or re-paid | me | free (API), ~1 h |
| 4 | Drop `_README.md` in each brand's `Renders/`; switch the watcher's `_Inbox` rule on; retire the duplicate trees (`Approved Renders`, `Design/… SOP` copies) by leaving them read-only for 30 days, then archiving | me + Dropbox owner | free |
| 5 | Same for Dialed Labs, Dialed Health, NuLumin once their SKU sheets arrive (the parser handles both sheet layouts) | | |

Nothing moves until Phase 2 is signed off. The old paths stay resolvable in the DAM (every asset keeps
its content hash and history), so a wrong move is a second move, not a loss.
