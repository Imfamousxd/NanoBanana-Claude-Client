#!/usr/bin/env python3
# Build parallel batch JSONs for the 52 NEW themed action scenes (locked grit-film recipe).
# All render into one staging dir; finalize step grades + names them by theme afterward.
import json, math, os

R = "Nulumin lifestyle shots"
REF = {
    "r03": f"{R}/1 by 1/3bcd045bdf96fdf2b4571e657ce74af8.jpeg",
    "r04": f"{R}/1 by 1/501466320a6fdd52c8331cb69b2106b2.jpeg",
    "r06": f"{R}/1 by 1/Blur_e00779a33adf8edf1949f92bb7a2c4a8.jpeg",
    "r09": f"{R}/1 by 1/ee1ac568636ed4848282817f51ee7968.jpeg",
    "r10": f"{R}/3 by 4/35878ba459433b75c226a935b5d4ce8b.jpeg",
    "r12": f"{R}/3 by 4/dfe23d3eef2f19645cd79b485b62928a.jpeg",
}
for k, v in REF.items():
    assert os.path.exists(v), f"MISSING {k} {v}"

GRADE = {
    "r03": "warm golden, heavily directional-blurred, near-abstract",
    "r04": "dark teal-and-olive, moody, glowing halation",
    "r06": "soft, muted grey-toned interior, candid and unposed",
    "r09": "near-abstract heavy directional smear with ghosting",
    "r10": "muted earthy dawn-outdoor tones, naturalistic",
    "r12": "muted, soft, candid daylight",
}

FILM = ("A real, raw, scanned 35mm FILM photograph (Cinestill 800T / pushed Portra): soft film focus, halation/bloom on highlights, "
        "muted desaturated faded color (NOT vivid, NOT HDR, NOT clean digital), candid and unposed with imperfect off-kilter amateur framing, "
        "natural imperfect skin. It must NOT look polished, cinematic, or AI. Use the reference ONLY as a film-look + motion-blur anchor — "
        "match its grade and blur character — but IGNORE its scene, people and composition.")
ACTION = ("This is an ACTION photograph: the subject is actively DOING something physical, caught candidly in the very middle of the act, "
          "body in motion — never posed, never static, never calm.")
EXTREME_BLUR = ("THIS IS A LONG-EXPOSURE MOTION SHOT WHERE MOTION IS THE SUBJECT. The moving person is almost entirely DISSOLVED into long "
                "directional motion-blur streaks with ghosted, doubled, smeared edges — barely recognizable as a figure, abstracted into streaks "
                "exactly like the reference. The WHOLE frame is swept with heavy motion. Do NOT keep the subject sharp or legible — it must be "
                "aggressively, obviously, heavily blurred and smeared across a large part of the frame. The blur is by far the dominant feature.")
FROZEN = ("Frozen sharp at a fast shutter, catching the person in the very middle of the physical action — caught in the act, body clearly "
          "mid-motion but crisp. Dynamic and candid.")

CODE = {"weight-loss": "wl", "recovery": "rec", "longevity": "lon", "performance": "perf", "cognitive": "cog", "sexual-health": "sex"}

concepts = json.load(open("nulumin-expansion-concepts.json"))
jobs = []
for theme, items in concepts.items():
    code = CODE[theme]
    for i, c in enumerate(items, 1):
        tag = f"nul-{code}-new-{i:02d}"
        motion = EXTREME_BLUR if c["mode"] == "blur" else FROZEN
        prompt = (f"{tag}: A raw, grainy 35mm film ACTION photograph. {c['scene']} Subject: {c['subject']}. {ACTION} {motion}\n\n"
                  f"{FILM}\n\nMatch the {GRADE[c['ref']]} film look of the reference image, but render THIS new action scene.")
        jobs.append({"prompt": prompt, "aspectRatio": c["aspect"], "imageSize": "4K", "refImages": [REF[c["ref"]]]})

# split into 8 parallel batches
N = 8
batches = [jobs[i::N] for i in range(N)]
for i, b in enumerate(batches, 1):
    json.dump(b, open(f"nulumin-exp-p{i}.json", "w"), indent=2)
print(f"{len(jobs)} new jobs across {N} batches:", [len(b) for b in batches])
