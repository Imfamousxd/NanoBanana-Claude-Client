# ENGINE INTAKE — the questions Claude asks BEFORE anything is prompted

This is the script Claude (or any operator) walks through with the person requesting an asset.
Every question exists because skipping it has already cost real money. The answers fill a
`briefs/*.video.json` brief, which `video-engine.mjs` validates, routes and fires.

**The rule: nothing is inherited from an example, a recipe, or a previous job. If the brief
doesn't answer it, ASK. Never fill a slot silently.** (2026-08-09: "a person" became a woman at a
marina because gender was never asked and the setting was inherited from a playbook example —
$9.26 of wrong generations.)

---

## 1 — WHO IS THIS FOR (the claims layer)

**Q1. Which brand?** → `brand`
**Q2. Which campaign — by name, not by vibe?** → `campaign`
   Show the campaign table from `sieve/brands/<Brand>/campaigns/`. If their phrase ("the Golden
   Hour giveaway") is not a registered campaign name, resolve it HERE, not in the script.
   Prizes differ per campaign; five Muha campaigns carry five different prizes.
**Q3. Does the piece make claims — prize, entry mechanic, dates, odds?** → `claims_used`
   Only registry-SOURCED fields may be spoken, verbatim. Anything else is a `{{SLOT}}` a human
   fills. Disclosures (NPN / 21+) are always a slot until a human signs.
**Q4. Who signs off on the claims list before the paid submit?** → `claims_signoff`

## 2 — WHAT KIND OF PIECE (the routing layer)

**Q5. What's the subject — a person talking, a product, or artwork?** → `subject.type`
   This IS the model router:
   - person talking → **Seedance 2.5** (only lane with photoreal speech; 720p; ~$0.23/s)
   - product / no human → **Seedance 2.0** (up to 4K, ~35% cheaper, 0 failures in 32 tasks)
   - approved artwork → 2.5 i2v locked camera — but check `third_party_marks` first;
     the Rolex card face was refused for copyright, the QR side passes
   - drafts / variations, product only → **2.0-mini / 2.0-fast** (cheap tier, unprobed)
**Q6. Which lane — UGC or campaign?** → `lane`
   House-measured, they don't mix: UGC = one unbroken take, 9:16, ~2.3 w/s.
   Campaign = cuts every ~4.3s, 4:5 or 9:16, ~3.0 w/s.
   Also set **`creative_type`** (ugc / promo / product / commercial / ad-creative) — the plan then
   surfaces the GOLD references to match and points at that type's `craft/CREATIVE-RUBRICS.md`
   rubric, so the generation is anchored to what best-in-class looks like, not a blank page.
**Q7. How long?** → `duration`
   Offer the house ladder: **5 / 10 / 30**. Anything else needs a stated reason (nothing
   off-ladder has ever shipped).

## 3 — WHO'S ON SCREEN (the casting layer)

**Q8. Describe the person: age, background, accent, wardrobe. Every field, explicitly.** → `subject.casting`
   "A person" is not a casting. Gender unasked = a $4.63 re-shoot.
**Q9. What are they holding or handling, if anything?** → `subject.props`
   Hands manipulating objects is the measured weak point (object permanence). If the answer
   involves pulling/flipping/clicking things, the engine forces a 5s proof before the long take.

## 4 — REFERENCES (the fidelity layer — ask ALL of these, every time)

**Q10. Reference images?** → `refs.images[]`
   - Product/card/artwork ref → passed as `reference_image`, rendered faithfully. Resolve SKUs
     from `sieve/products/` — never accept a re-render of a real product.
   - **Avatar + a product in the SAME shot?** Seedance can't take a first frame AND reference
     images together, so you COMPOSE them at the image stage first:
     `node scene-frame.mjs --avatar <Name> --ref <path>:<role> --scene "…" --ar 9:16 --n 2`
     builds the avatar holding/near the product into one frame (Nano Banana, identity + product
     fidelity), you pick the winner, then the brief sets `subject.avatar_frame` to it and the
     avatar lane animates that. Review the cheap frame before the ~$0.59 clip (rule 8).
   - **Contains a person? → REFUSED at submit (privacy guard, any image role).** People are
     generated from text; say so up front rather than letting it bounce.
   - Third-party marks on the asset? Check the registry flag — it decides refusal risk.
**Q11. Reference video?** → `refs.video`
   A video ref is the only identity carrier on 2.5 (extension: "Continue [Video 1] forward…").
   Use for: continuing an approved person past 30s (+66% cost — buys identity, not savings).
**Q12. Reference audio — and WHAT KIND?** → `refs.audio`, `refs.audio_type`
   - `native` — 2.5 invents the voice with the face (default; its casting is good)
   - `cloned` — Fish S2-Pro clone of an approved voice → today: dub route (lipsync-2-pro);
     future: 2.0 `reference_audios` renders the body ACTING the voice (verified once at 0.9872
     similarity) — humans need Digital Character registration first
   - `file` — supplied VO for off-screen narration → 2.0 lane, works today
**Q13. Must this match an existing person/avatar — the SAME face across many pieces?** → `subject.avatar`
   Name an avatar (e.g. `"Sol"`) and the engine SWITCHES LANES: person+avatar routes to the
   **Soul casting lane** — Seedance **1.5-pro** with the avatar's canonical (`Avatars/<Name>/
   identity/*.png`, born on Higgsfield Soul) as the FIRST FRAME. This is the only lane that
   accepts a human frame (2.5/2.0 both refuse it), it runs **1080p**, and it costs ~$0.06/s
   silent / ~$0.12/s with audio on ModelArk — cheaper than the text-born 2.5 lane. Trade-off:
   1.5-pro's speech is good but 2.5's is better, so use avatars when IDENTITY matters more than
   voice ceiling. Casting-status avatars (`STATUS: CASTING` in AVATAR.md) are refused on `--go`
   until the founder approves — `--allow-casting` is throwaway-tests only. Anchors, not seeds,
   carry identity across shots. No avatar named → text-born 2.5 lane (720p, best speech).

## 5 — THE SCENE (the visualization layer)

**Q14. "Help me visualize the scene" — walk it together, don't accept a vibe.** → `scene`
   Claude leads, filling each concretely:
   - WHERE exactly? (not "somewhere normal" — "driver's seat of his own car, strip-mall lot")
   - LIGHT: time of day, where the sun sits, what it blows out
   - DISTANCE: house UGC default is extreme close-up, face cropped at the hairline — confirm
     or override deliberately
   - WHAT'S BEHIND: out the window, past the shoulder (background signage renders, and
     partially legible real-world signs have appeared — decide if that's acceptable)
   - WHAT THE HANDS DO, second by second, if anything
   Never name a device to describe a look ("like a phone camera" renders a phone). Describe
   artifacts positively: bobbing frame, hunting exposure, flare.
**Q15. Tone of the script — and how loose?** → `script.register`, `script.profanity`
   Profanity is measured-safe on 2.5. Written dirt ("So I— okay,") is what reads human.
   House UGC pace is UNHURRIED (2.18–3.1 w/s); the generic "write fast" law is overridden.

## 6 — DELIVERY (the finish layer)

**Q16. Where does it ship, and does anything get burned in?** → `post`
   - Loudness: house dialogue band −16 to −21 LUFS; engine normalizes in post
   - Card/logo plates: composited flat in post ($0, pixel-exact) — never regenerated
   - Disclosures: spoken, plated, or caption? (A claims question wearing a delivery costume —
     route it back to Q3/Q4.)

---

### What Claude does with the answers
Fill `briefs/<id>.video.json`, run `node video-engine.mjs --brief <file>` (dry-run by default —
validates, routes, prices, prints the plan), fix every ✗ it raises, then `--proof` if required,
review, `--go`. After delivery the engine transcribe-gates the required tokens, runs the watcher,
and normalizes loudness. Before walking away: `node sd25-cost.mjs drain`.
