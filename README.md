# Content-Gen Engine (Claude Code client)

> **New here and not technical?** Start with **`ONBOARDING.md`** — a plain-English,
> step-by-step guide from "open Terminal" to your first generated image.

A lightweight toolkit for generating **images and video** from the command line and from
Claude Code. It wraps three model providers behind small, dependency-light Node scripts:

| Capability        | Tool                  | Model                          | Key needed             |
|-------------------|-----------------------|--------------------------------|------------------------|
| Image gen / edit  | `gpt-image.mjs`       | OpenAI **gpt-image-2**         | `OPENAI_API_KEY`       |
| Image gen / edit  | `nanobanana.mjs`      | Google **Nano Banana Pro** (`gemini-3-pro-image-preview`) | `GEMINI_API_KEY` |
| Video (text/img→video) | `nanobanana-video.mjs` | Google **Veo 3.1**         | `GEMINI_API_KEY`       |
| Video (Seedance)  | `*seedance*.mjs`      | **Seedance** on Replicate      | `REPLICATE_API_TOKEN`  |

The dozens of other `*.mjs` / `*.py` files are **real generation jobs** kept as worked
examples — read them to see the patterns, copy one, and adapt.

> The intended way to use this repo is **with Claude Code**: open the folder, tell Claude what
> you want, and it writes/runs a small generation script for you. See `CLAUDE.md` for the
> conventions Claude follows.

## Prerequisites

- **Node 20+** (uses native `fetch`/`FormData` — no SDKs required for the core flow)
- macOS recommended (scripts call `open -a Preview` to show results; harmless elsewhere)
- A few scripts use post-processing helpers: `sharp` (resize/composite) and `qrcode`

## Setup

```bash
git clone https://github.com/Imfamousxd/NanoBanana-Claude-Client.git
cd NanoBanana-Claude-Client
npm install                 # installs sharp, qrcode, etc.
cp .env.example .env        # then paste your real API keys into .env
```

You only need the keys for the providers you'll use (OpenAI for images is the common default).

## Quick start

**Interactive image tool (OpenAI gpt-image-2):**
```bash
node gpt-image.mjs          # prompts you for prompt / aspect ratio / size / reference images
```

**Batch mode:**
```bash
node gpt-image.mjs --batch batch-example.json
```
`batch-example.json` is an array of `{ prompt, aspectRatio, imageSize, refImages? }`.

**Nano Banana (Gemini) images:**
```bash
node nanobanana.mjs         # interactive; great when you need strong reference-image fidelity
```

**Veo 3.1 video:**
```bash
node nanobanana-video.mjs   # submits a long-running job, polls, downloads the mp4
```

Outputs are written to `./generations/` (override with `OUTPUT_DIR`). Generated media,
`.env`, and `node_modules/` are gitignored.

## Aspect ratios & sizes (gpt-image-2)

`gpt-image.mjs` maps friendly ratios to high-res sizes (≤3840px edge, multiples of 16, ≤8.29 MP,
ratios up to 3:1). E.g. `1:1`→2880×2880, `9:16`→2160×3840, `16:9`→3840×2160, `2:3`→2048×3072.
When you write a **direct `/images/edits` call** with reference images, the safe per-call sizes
are `1024x1024`, `1024x1536`, `1536x1024`. (gpt-image-1 only supports those three.)

## What's in here

- `gpt-image.mjs`, `nanobanana.mjs`, `nanobanana-video.mjs` — the reusable CLI tools
- `*seedance*.mjs`, `recover-pred.mjs` — Replicate/Seedance video examples
- `batch-*.mjs`, `muha-*.mjs`, `dialed-*.mjs`, `nh-*.mjs`, … — real jobs as copy-paste templates
- `CLAUDE.md` — operating manual for Claude Code (read this if you're using Claude)
- `.env.example` — the keys to set

## Security

`.env` is gitignored — never commit real keys. There are no secrets in tracked files.
