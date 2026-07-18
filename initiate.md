# Initiate the engine

After you clone this repo, run `npm install`, copy `.env.example` to `.env`, and paste in your
API keys — then open the folder in **Claude Code** and send the prompt below as your first message.
It points Claude at the manual, verifies your setup, makes it restate the working conventions, and
runs one real generation to prove the pipeline works end to end.

## First-run prompt (paste this into Claude Code)

```
Read CLAUDE.md and README.md in this repo — that's the operating manual for this
content-gen engine. Then:

1. Check my setup: confirm .env exists and report which providers are ready
   (OPENAI_API_KEY for images, GEMINI_API_KEY for Nano Banana + Veo,
   REPLICATE_API_TOKEN for Seedance). Confirm Node is 20+ and that `npm install`
   has been run (sharp/qrcode available). Tell me anything that's missing.

2. Summarize back in 3-4 bullets how you'll generate here: the "write a small
   .mjs script per job → run with node → save a timestamped file → open in
   Preview" loop, generating 2-3 candidates for subjective work, anchoring
   consistency with reference images, and never faking fidelity by pasting.

3. Smoke test: write and run a tiny script that generates ONE gpt-image-2 image
   from the prompt "a glossy red apple on a clean white studio backdrop, product
   photo" at 1024x1024, save it to ./generations, and open it so I can confirm
   the pipeline works end to end.

Then wait for my first real request.
```

## Barebones version

```
Read CLAUDE.md, verify my .env keys and that `npm install` ran, then write+run a
script that generates one test gpt-image-2 image to ./generations and open it.
```

## After that

Just describe what you want ("make a 3:4 product poster of X with this reference image", "generate
a 9:16 8-second video of Y", etc.). Claude writes and runs the generation script, saves the output,
and opens it for you. Iterate by refining the prompt and passing reference images — see `CLAUDE.md`
for the full conventions.
