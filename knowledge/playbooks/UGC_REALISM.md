# Realistic creator-led UGC playbook

Use this playbook for `ugc-image` and `ugc-video`. The target is believable platform-native
communication with a clear creator point of view—not low quality, and not a polished commercial
with artificial phone-camera defects sprinkled on top.

## The realism stack

Build the shot in this order. Each layer must agree with the others.

1. **Human reason to record.** What just happened, what is the creator trying to show, and why now?
   A real clip has a social purpose: discovery, surprise, comparison, demonstration, confession,
   reply, or recommendation. "Holding a product and smiling" has no reason to exist.
2. **Creator behavior.** Give the creator an intention, a hand task, a gaze target, a thought beat,
   and one imperfect recovery. Direct observable actions, not adjectives such as authentic.
3. **Ordinary environment.** Choose a specific, plausible place with three useful background facts
   and some negative space. Avoid the generic beige influencer apartment unless it is strategically
   correct for the audience.
4. **Capture behavior.** State who holds the phone, camera height/distance, whether framing reacts,
   focus/exposure behavior, and how the clip starts/stops. Do not specify cinema lenses for selfie
   footage.
5. **Product truth.** Anchor the exact product/package as a reference. Describe when it is readable,
   what can be occluded, what cannot change, and how hands physically contact it.
6. **Platform grammar.** Define hook speed, safe zones, caption space, shot duration, sound, and the
   degree of polish expected on the target platform.

## Still-image grammar

A credible UGC still is a captured moment from a behavior. Favor mid-gesture hands, a gaze that has
a target, slightly imperfect framing, ordinary depth cues, and local texture. Use one or two camera
artifacts that have a cause: auto-exposure responding to a bright window, slight motion softness on
the moving hand, mixed practical/daylight white balance, or phone sharpening on hair and packaging.
Do not add every artifact at once.

Keep the subject and environment specific. "Woman in kitchen" is not a casting or location brief.
Define age range, style, energy, lived-in details, time of day, and why this person belongs with this
product. Avoid protected-trait stereotyping and do not infer demographic facts from a reference.

## Video grammar

Write beats in clock time. For each beat, identify subject action, camera response, sound, and the
continuity lock.

- **0.0–1.0s — interruption/hook:** begin in motion or mid-thought; no polished title-card opening.
- **1.0–3.0s — proof:** show the product, document, texture, or action that earns attention.
- **3.0–5.0s — reaction/context:** a small thought beat, reframing, or specific observation.
- **5.0–7.0s — payoff:** complete one idea; do not cram a campaign into a six-second generation.
- **End:** hold or return to a state that can cut or loop cleanly.

Use room tone and concrete sound cues. If dialogue is generated, keep it short enough for the
duration and write it verbatim. Product labels, faces, hands, wardrobe, handedness, room layout, and
time-of-day lighting are continuity invariants. Camera movement should follow the creator's behavior,
not float independently like a showroom render.

## Product and identity reference roles

- `product-canon`: shape, label hierarchy, cap, colors, proportions, and material truth.
- `creator-canon`: likeness only; never copy an unrelated person's setting, body, or clothing unless
  those roles are explicitly granted.
- `environment-reference`: architecture, light, and background—not creator identity.
- `style-reference`: color/texture/finish—not text, logo, subject, or composition.
- `first-frame`: exact launch state for image-to-video; do not also pass Seedance reference images.
- `logo-canon`: exact flat mark, normally composited after generation.

Name these roles in the prompt. "Use the references" is too ambiguous.

## Anti-patterns

- Generic prestige soup: `cinematic, 8K, masterpiece, award-winning, ultra-detailed`.
- Contradictory capture: handheld selfie plus stabilized dolly, phone camera plus 85mm cinema lens.
- Cosmetic perfection: poreless skin, symmetric hair, immaculate room, every object art-directed.
- Fake randomness: excessive Dutch angle, gratuitous blur, crooked framing with no behavioral cause.
- Floating product: weak grip, wrong contact shadows, changing box thickness, label facing the camera
  despite an incompatible wrist angle.
- "No AI look" as the only realism direction. Describe the observable alternative.
- Long generated typography. Use a deterministic overlay for hooks, claims, legal copy, QR, and CTA.

## Iteration ladder

Diagnose before regenerating. Preserve everything that passed.

1. **Identity/product failure:** strengthen or crop the canonical reference; reduce competing refs.
2. **Composition failure:** change blocking/framing only; keep identity and product locks verbatim.
3. **Performance failure:** rewrite the intention and observable beat, not the camera spec.
4. **Synthetic finish:** remove prestige language; add one causally correct capture behavior and more
   ordinary environment entropy.
5. **Text failure:** stop regenerating the entire image. Reserve calm space and overlay exact type.
6. **Series drift:** lock seed/reference hierarchy, shared invariants, and measured output QC.

An approved asset becomes the next iteration's primary reference. Store why it passed in the run
manifest; do not rely on the filename `final` as memory.

