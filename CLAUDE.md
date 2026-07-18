# CLAUDE.md — operating manual for this content-gen engine

This repo generates **images and video**. When the user asks for a visual, you generate it by
writing and running a small Node script (or using the bundled CLI tools), then showing the result.

## Golden rules

1. **Write a small, self-contained `.mjs` script per generation**, run it with `node`, save the
   output with a timestamped name, and **open it for review**: `open -a Preview "<path>"` (macOS).
   This is the core loop. Copy an existing `*.mjs` as a template — they all follow the same shape.
2. **Iterate by PROMPT, not by pixel-pushing.** Never hand-composite or "paste" generated parts
   together to fake a result (no PIL/sharp paste of a face/product/logo onto art to force fidelity).
   Re-generate or edit with a better prompt + reference images. (Compositing a *flat logo/QR/text
   plate* onto a deliberately-reserved clean area in post is fine; faking hero/product fidelity is not.)
3. **Generate 2–3 candidates** for anything subjective and let the user pick. Use `n` or a loop.
4. **Anchor with reference images.** To keep a character/style/product consistent, pass the real
   reference image(s) into the request and instruct "use ONLY the likeness from reference image N".
   Text-only prompts drift; references lock it.
5. **Spell text exactly** in the prompt and add a negative ("no other text, no misspellings").
   Image models garble small text — keep it short and call out each exact string.
6. Default to **gpt-image-2** for images. Switch to **Nano Banana (Gemini)** when you need stronger
   reference-image fidelity at hero scale. Use **Veo 3.1** or **Seedance (Replicate)** for video.

## Setup assumptions

- Node 20+. Keys live in `.env` (gitignored). Required: `OPENAI_API_KEY` (images),
  `GEMINI_API_KEY` (Nano Banana + Veo), `REPLICATE_API_TOKEN` (Seedance). See `.env.example`.
- Every script loads `.env` with this snippet at the top:
  ```js
  import fs from "fs";
  for (const line of fs.readFileSync(".env","utf-8").split("\n")){const m=line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);if(m&&!process.env[m[1]])process.env[m[1]]=m[2];}
  ```
- Save outputs to a project folder and stamp the name:
  `const stamp = new Date().toISOString().replace(/[:.]/g,"-").slice(0,19);`

## Pattern A — gpt-image-2 EDIT (with reference images)

Use for: restyle/extend an image, place a character/product from a reference, multi-ref composition.
Endpoint `POST https://api.openai.com/v1/images/edits`, `multipart/form-data`. Pass one or more
`image[]` parts (refs/base) and an optional `mask`. Per-call sizes: `1024x1024`, `1024x1536`, `1536x1024`.

```js
const form = new FormData();
form.append("model", "gpt-image-2");
form.append("prompt", PROMPT);          // describe the change; name each reference image's role
form.append("size", "1024x1536");
form.append("quality", "high");
form.append("n", "2");                   // 2 candidates
form.append("image[]", new Blob([fs.readFileSync(BASE)], {type:"image/png"}), "base.png");
form.append("image[]", new Blob([fs.readFileSync(REF)],  {type:"image/jpeg"}), "ref.jpg");
const res = await fetch("https://api.openai.com/v1/images/edits", {
  method:"POST", headers:{ Authorization:`Bearer ${process.env.OPENAI_API_KEY}` }, body: form,
});
const data = (await res.json()).data || [];
data.forEach((it,i)=> fs.writeFileSync(`out_c${i+1}.png`, Buffer.from(it.b64_json,"base64")));
```

Tips: to change ONE thing, pass the approved image as the first `image[]` and say "reproduce
EXACTLY except …". To preserve a region precisely, supply a `mask` (transparent = repaint).

## Pattern B — gpt-image-2 GENERATE (no references)

Same as A but endpoint `POST /v1/images/generations`, JSON body `{ model, prompt, size, quality, n }`,
no `image[]`. Or just run the interactive tool: `node gpt-image.mjs` (supports `--batch batch.json`).
`gpt-image.mjs` exposes friendly ratios → high-res sizes (`16:9`→3840×2160, `9:16`→2160×3840, etc.).

## Pattern C — Nano Banana Pro (Gemini images)

Model `gemini-3-pro-image-preview`. Reference images go in as `inline_data` parts *before* the text.
Use it when gpt-image-2 won't hold a reference's likeness. See `nanobanana.mjs` for the full call;
quickest path is `node nanobanana.mjs` (interactive: prompt, aspect ratio, size, ref images).

## Pattern D — Video

- **Veo 3.1 (Gemini):** `node nanobanana-video.mjs` — submits `:predictLongRunning`, polls, downloads
  the mp4. Supports text→video and image→video (`durationSeconds`, `aspectRatio`). Uses `GEMINI_API_KEY`.
- **Seedance (Replicate):** create a prediction then poll. See `seedance-tube-animate.mjs`.
  ```js
  const create = await fetch("https://api.replicate.com/v1/models/bytedance/seedance-1-pro/predictions", {
    method:"POST",
    headers:{ Authorization:`Bearer ${process.env.REPLICATE_API_TOKEN}`, "Content-Type":"application/json" },
    body: JSON.stringify({ input: { prompt: PROMPT /*, image, duration, aspect_ratio, resolution */ } }),
  });
  // poll create.urls.get until status === "succeeded", then download output.
  ```
  Confirm the current model slug on Replicate (e.g. `bytedance/seedance-1-pro`); newer versions exist.
  Video is slow and costs money — confirm scope (count, length, aspect ratio) before firing a batch.

## Conventions checklist (do these every time)

- [ ] Small `.mjs` per job; `.env` loaded; output stamped + saved to a sensible folder.
- [ ] `open -a Preview "<path>"` after generating so the user can review.
- [ ] 2–3 candidates for subjective work; let the user choose.
- [ ] References passed for any consistency requirement; roles named in the prompt.
- [ ] Exact spellings + a tight negative for any on-image text.
- [ ] Long/expensive runs (video, big batches) → run in the background and report when done.
- [ ] Never fake fidelity by pasting; iterate the prompt instead.
