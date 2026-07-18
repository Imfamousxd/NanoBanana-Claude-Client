# Brand Context — the knowledge base for this content-gen engine

Rebuilt 2026-07-17. One file per brand: identity, locked visual rules, asset map, every campaign
run, and a generation playbook with verbatim prompt language. A new operator (human or app) should
be able to pull this repo and produce on-brand work from these files alone.

**Read `00_ENGINE.md` first** — the four model back-ends (gpt-image-2, Nano Banana Pro, Veo 3.1,
Seedance 2.0), batch formats, and the global rules every brand assumes. Repo-wide operating manual:
`CLAUDE.md` at repo root.

## Brands

| File | Brand | One-liner |
|------|-------|-----------|
| `Muha_Meds.md` | Muha Meds | Cannabis/THC brand — AI-Fruit universe, Members program, giveaways incl. **EURO SUMMER $25k trip** |
| `Dialed_Labs_UFC.md` | Dialed Labs | Sauna/cold-plunge recovery brand, Official Partner of UFC — trailer + Airbnb-host email campaign |
| `Dialed_Health.md` | Dialed Health | Clinical peptide/GLP-1 supplements — container system, DH Shots, instruction graphics |
| `Dialed_Moods.md` | Dialed Moods | Nootropic/adaptogen canned beverages — white-studio + can reveals |
| `NuLumin_BioSciences.md` | NuLumin | Research peptides — spectrum bands, 31 SKUs, film-grit lifestyle, white-bg packshots |
| `Becca_Boo_x_NuLumin.md` | Becca Boo × NuLumin | Co-brand flyer pipeline |
| `Noble_Harbor.md` | Noble Harbor | Peptide wholesale/white-label — vial system + 3-email & 48-email campaigns |
| `Stanton_Medical.md` | Stanton Medical | Clinical navy/teal — Peptide Prep Kit label system |
| `Aevum_Plus.md` | Aevum+ | New peptide brand — logos, San Marino blue |
| `Other_Brands.md` | (index) | Realtor fliers, retail posters, Cactus Cloud × Muha, misc — needs documentation |

## Assets
`assets/<brand>/` holds quick-grab canonical refs (logos, hero product shots, character canon) so
generations can be anchored without hunting. The FULL asset libraries live in the per-brand project
folders at repo root (each brand doc's "Asset map" section lists them) — those folders are committed
to this repo too, so a fresh clone carries every ref.

## Keep it in sync
When a brand evolves, update BOTH the matching `Brand Context/<Brand>.md` AND the operator memory
note, in the same session. This pack was distilled from operator memory + ~450 generation scripts.
