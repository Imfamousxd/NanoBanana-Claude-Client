# Marcus — Scene Library (the influencer generator's location/wardrobe layer)

A scene = wardrobe + location + light. Every scene is generated FROM `identity/*.jpg`
(the face never comes from text), so Marcus stays Marcus in any world. Approved scene
frames live in `scenes/` and are the seed for that scene's videos — reuse them directly
for new lines, or generate fresh angles from identity refs + the descriptor below.

## Verified scenes (2026-07-22)

### couch — "golden hour loft"
Cream boucle designer sofa, sun-washed modern loft, tall windows, olive tree, layered
neutral pillows, warm golden afternoon light. Wardrobe: relaxed cream knit crewneck.
Energy: casual, lounged back, one arm along the sofa back. Seed: `scenes/couch.jpg`.

### jacket — "editorial camel"
Sharply tailored camel overcoat over clean white tee, cognac leather chair, moody
premium studio, deep charcoal gradient backdrop, warm key + crisp rim light, subtle
haze. Energy: leaned in, confident, direct. Seed: `scenes/jacket.jpg`.

### hallway — "old money marble"
Grand marble hotel hallway, tall arched ceiling, warm brass sconces receding into deep
perspective, polished reflective stone floor. Wardrobe: black bomber over white tee,
three-quarter framing, standing. Energy: poised, relaxed. Seed: `scenes/hallway.jpg`.

## Adding a scene
1. Write the descriptor here first (wardrobe + location + light + energy, 2–4 lines).
2. NB Pro: refs = `identity/portrait_neutral.jpg`, `identity/portrait_smile.jpg`,
   + product render if he holds one. Prompt = likeness lock + descriptor + (vial text
   + HAND-LOCK from AVATAR.md if product in hand) + "vertical 9:16, chest-up influencer
   framing, shot-on-phone realism, no text in frame".
3. QC the face against `identity/`, then save the approved frame as `scenes/<name>.jpg`.
4. Video: Seedance 1.5 from the scene frame per AVATAR.md rules (12s max, periods,
   phonetic acronyms, hand-lock, natural-cadence voice descriptor, Whisper-QC).

Scene ideas queued: rooftop at dusk · gym (35mm film per NuLumin lifestyle rule) ·
kitchen counter morning light · car passenger seat · walk-and-talk city street.
