# ENGINE HANDOVER — Muha video engine, on-set edition (2026-08-09)

One flow, four models, every rule measured. Nothing in here is a guess; where something is
unmeasured it says so out loud.

## THE FLOW (this is the whole job)

```
1. INTAKE     walk ENGINE-INTAKE.md with whoever wants the asset — 16 questions.
              Claude fills briefs/<id>.video.json. Nothing is ever inherited or assumed.
2. DRY RUN    node video-engine.mjs --brief briefs/<id>.video.json
              Validates claims against the registry, checks the script against the house
              bands, routes the model, quotes the cost. Fix every ✗. Costs nothing.
3. PROOF      --proof  (~$1.16, 5s) — REQUIRED whenever hands manipulate props (measured
              object-permanence weakness). Watch it. If objects melt, no prompt fixes it.
4. GO         --go --claims-initialed "<name>"
              Refuses without the name when the script makes claims. That is the point.
5. GATES      automatic: transcript check of required_tokens (a missed token = RE-ROLL,
              not a rewrite — pronunciation is a per-roll coin flip), loudness normalize
              to −16.5 LUFS into _post/ (raw kept).
6. DRAIN      node sd25-cost.mjs drain     ← BEFORE walking away. Paid tasks not on disk
              are recoverable for ~24h, then gone. It has already caught one live ($4.63).
```

## THE FOUR SEEDANCE MODELS — routed by SUBJECT, never by vibe

| You're making | Engine picks | Res | $/s | Status |
|---|---|---|---|---|
| A person talking | `dreamina-seedance-2-5-260628` | 720p hard cap | $0.233 | measured, the only photoreal-speech lane |
| Product / no human | `dreamina-seedance-2-0-260128` | up to 4K | $0.152 @720p · $0.376 @1080p · 4K unmeasured | measured, **0 failures in 32 tasks** |
| Product draft/variations | `dreamina-seedance-2-0-mini-260615` (`--draft`) | ? | **UNPROBED** | first run is the measurement |
| Product, speed | `dreamina-seedance-2-0-fast-260128` (`--fast`) | ? | **UNPROBED** | id verified in catalog, never fired |
| Approved artwork | 2.5 i2v, `--ratio adaptive`, `camerafixed` | follows the art | $0.233 | measured — but see Rolex rule below |
| **Same face across many pieces** | **Soul casting lane**: Higgsfield Soul portrait → Seedance 1.5-pro. ModelArk `seedance-1-5-pro-251215` (~$0.29 silent / ~$0.59 audio per 5s 1080p) OR Replicate `bytedance/seedance-1.5-pro` (~$0.62) — cost a wash, ModelArk cheaper | 1080p | ~$0.06–0.12/s | proven end-to-end 2026-08-09 — identity holds, speech verbatim. Avatar kits in `Avatars/` (Sol is the prototype, CASTING) |

## THE RULES THAT COST MONEY TO LEARN (the engine enforces all of these)

- **A person in ANY reference image = refused at submit.** People are generated from TEXT.
  A card/product image passes as `reference_image` next to a text-generated person.
- **2.5 extends ONLY people 2.5 itself created.** External human video AND other ModelArk
  models' human clips are refused identically ("may contain real person") — measured on a
  same-account 1.5-pro clip 90 seconds after generation. A 2.5 person is BORN in 2.5, period.
  The sanctioned doors (preset `asset://` digital persons; real-human registration — our
  account has 50 open slots) are mapped in `craft/DIGITAL-CHARACTERS.md`.
- **The Rolex rule:** a prominent rendered third-party mark = billed copyright refusal
  (measured on the Golden Hour card face). The own-brand QR side passes. SPOKEN brand
  names pass. When in doubt: say it, don't show it — or plate it in post for $0.
- **2.5 is 720p only.** 1080p/4k = bare "Bad Request" naming nothing. 4K = route to 2.0.
- **Unknown --flags are SILENTLY DROPPED** (measured: `--bogusflag 3` generated fine).
  A typo buys the default at full price. The engine owns the flags; don't hand-add.
- **`generate_audio:false` on a talking head = mute clip at full price.** Talking = true
  + music-only exclusion. NEVER write "no voices" on a talking head.
- **House UGC** (measured off our own approved work): one unbroken take, 9:16,
  5/10/30s ladder, 2.18–3.1 words/sec, extreme close-up cropped at the hairline, card
  beside the cheek never over the face, no on-screen text.
- **Claims come from `sieve/brands/<Brand>/campaigns/*.json` VERBATIM or they're slots.**
  Never from a law's evidence quotes (that's how a $35k Rolex almost got invented — then
  turned out real, which is a different lesson: register campaigns, don't vibe them).
- **Extension costs 66% MORE than fresh, not less.** It buys identity past 30s, nothing else.

## WHAT'S STILL HUMAN (the engine will refuse, not improvise)

- Disclosures: "No Purchase Necessary" + 21+ — recorded, NOT legally cleared, placement
  undecided. Every giveaway brief carries it as a `{{SLOT}}`.
- Claims sign-off name on every --go that speaks about a promotion.
- The proof-roll verdict when props are in hands — a human watches 5 seconds.

## IF SOMETHING FAILS ON SET

| Symptom | Meaning | Do |
|---|---|---|
| `InvalidParameter` "Bad Request" | out-of-range flag VALUE | free — check res/dur against the table |
| `TaskTypeConstraint` | prompt wording re-classified the task (editing verbs!) | free — reword, keep editing verbs out |
| `InputImageSensitive...PrivacyInformation` | a person in a ref image | free — drop the image, cast from text |
| `Output...PolicyViolation` | moderation, likely a rendered mark or undirected audio | BILLED — change the input, never re-roll identical |
| transcript gate misses a token | per-roll pronunciation flip | re-roll same brief; token-shape fix only if it repeats |
| watcher WARN you disagree with | possibly a scene the check doesn't understand | `node sieve-verdict.mjs log ...` — your ruling recalibrates it |

## FILES

```
video-engine.mjs          the engine (route/validate/fire/gate)      ENGINE-INTAKE.md   the 16 questions
briefs/*.video.json       one brief per asset (2 demo briefs ship)   sieve/brands/      what may be claimed
graph-fragments/          house_laws + seedance25_laws               sd25-cost.mjs      estimate · spent · drain
sieve-corpus.py           measure our own finished work              sieve-verdict.mjs  your eye, recorded
```
