# Getting Started — Your AI Content Studio (Mac)

This guide sets up **Claude Code** on your Mac and connects it to our **content engine** — a
project folder full of brand guidelines and tools. Once it's set up, you make content by simply
typing what you want in plain English, like:

> *"Make an Instagram post for NuLumin announcing our new product — give me 3 options."*

Claude does the rest: it writes the tools, generates the images or videos, and opens them on
your screen. **No design or coding skills needed.** Setup takes about 15 minutes, one time.

**Before you start, make sure you have:**
1. A Mac.
2. A Claude account — sign up at [claude.ai](https://claude.ai) (Pro or Max plan).
3. The **keys file** we sent you (it may be called `.env` or `env.txt`). Save it to your Desktop.
4. Access to our GitHub project link (we'll have added your GitHub account — if you don't have
   one, ask us).

---

## Step 1 — Open Terminal

Terminal is a built-in Mac app where you type instructions instead of clicking buttons.

1. Press **Cmd + Space** (the Spotlight search bar appears).
2. Type **Terminal** and press **Enter**.
3. A window opens with some text and a blinking cursor. That's it — you're in.

Everything below happens in this window. To "run" a command: copy it, paste it into
Terminal, and press **Enter**.

---

## Step 2 — Install Claude Code

Copy this whole line, paste it into Terminal, and press Enter:

```
curl -fsSL https://claude.ai/install.sh | bash
```

Wait for it to finish (under a minute). Then **quit Terminal completely** (Cmd + Q) and
**reopen it** (Step 1 again) — this makes the install take effect.

To check it worked, run:

```
claude --version
```

If you see a version number, you're good.

---

## Step 3 — Sign in

1. In Terminal, type `claude` and press **Enter**.
2. Follow the on-screen prompts (press Enter to accept the defaults).
3. Your web browser will open asking you to **log in to Claude** — log in and click
   **Authorize**.
4. Go back to Terminal. You should see the Claude chat box.
5. Type `/exit` and press Enter to close it for now.

---

## Step 4 — Create the `claudego` shortcut

Normally Claude pauses to ask "may I do this?" before every little action. For content work
that gets annoying fast, so we make a shortcut called **`claudego`** that launches Claude in
"just do it" mode.

Run this line in Terminal:

```
echo 'alias claudego="claude --dangerously-skip-permissions"' >> ~/.zshrc
```

Then **quit Terminal (Cmd + Q) and reopen it** so the shortcut becomes active.

From now on, you'll always start Claude by typing **`claudego`** instead of `claude`.

> The first time you run `claudego`, it shows a warning asking you to confirm — choose
> **"Yes, I accept."** This mode lets Claude work without stopping to ask permission, which is
> exactly what we want here. Just use it for this content project, not for anything sensitive.

---

## Step 5 — Install the content engine (let Claude do it for you)

You don't need to install anything by hand — you tell Claude to do it.

1. In Terminal, type `claudego` and press Enter.
2. Copy and paste this whole message into the chat box, then press Enter:

```
Set up my content engine. Clone https://github.com/Imfamousxd/NanoBanana-Claude-Client.git
into a folder on my Desktop, then run npm install inside it. If my computer is missing
anything it needs (like git or Node), install that too. If GitHub asks me to sign in,
walk me through it step by step. Tell me when everything is ready.
```

3. Claude will work through it and may ask you a question or two (for example, to sign in to
   GitHub). Just answer in plain words and follow along.
4. When Claude says everything is ready, type `/exit`.

---

## Step 6 — How you'll start EVERY work session

This is the daily routine — memorize (or bookmark) these two lines. Open Terminal, then run:

```
cd ~/Desktop/NanoBanana-Claude-Client
claudego
```

The first line moves you **into the project folder** (that's where all the brand knowledge
lives — Claude only sees it if you start from there). The second line launches Claude.

That's it. Every session starts this way.

---

## Step 7 — Add your keys file

The keys file (`.env`) is what lets the engine actually generate images and video. You only do
this once.

1. Start a session (Step 6).
2. In the chat box, type this — **but don't press Enter yet**:

   `Install this file into this project as ".env": `

3. Now **drag the keys file** we sent you (from your Desktop) **into the Terminal window**.
   You'll see the file's location appear in the message.
4. Press **Enter**. Claude will move it into the project and confirm.

---

## Step 8 — Test it

Still in your session, paste this and press Enter:

```
Read CLAUDE.md and check my setup: confirm my .env keys work and everything is installed.
Then generate one test image — a glossy red apple on a clean white background — and open
it for me.
```

If an apple pops up on your screen a minute later: **congratulations, you're fully set up.**
Everything from here on is just talking.

---

## What to say to make content

Talk to Claude like you'd talk to a designer sitting next to you. Describe what you want,
look at what comes back, and say what to change.

These are **fill-in templates** — copy one, paste it into the chat, and replace each
`[bracketed part]` with your own words before pressing Enter:

**Social media post**
```
Make an Instagram post for [brand] promoting [product or announcement] — 4:5 size.
Put the exact text "[the words on the image]" on it. Give me 3 options to pick from.
```
*Example: Make an Instagram post for Dialed Moods promoting the Blue Glacier flavor — 4:5 size.
Put the exact text "NEW FLAVOR. SAME FOCUS." on it. Give me 3 options to pick from.*

**Product shot**
```
Generate a clean white-background product shot of the [brand] [product].
```
*Example: Generate a clean white-background product shot of the NuLumin BPC-157 vial.*

**Lifestyle shot**
```
Make a lifestyle shot of [who — a woman, a man, an athlete] at [where — gym, kitchen,
track] holding the [brand + product]. Give me 2 versions.
```
*Example: Make a lifestyle shot of a woman at the gym holding the Dialed Health vial.
Give me 2 versions.*

**Video (Seedance)**
```
Make a [how many]-second [9:16 or 16:9] Seedance video of [what's happening in the
scene], camera [slowly pushing in / orbiting / locked off].
```
*Example: Make an 8-second 9:16 Seedance video of the Dialed Moods can on ice, camera
slowly pushing in.*

**Picking and iterating (this is where the magic is)**
```
I like option [number]. Make [first change], [second change], and try [one more idea].
```
*Example: I like option 2. Make the logo bigger, the background darker, and try the text
in white.*

**Using a reference** — drag any image into the chat window first, then:
```
Use this as the style reference — match this look exactly, but for [your product or flavor].
```
*Example: Use this as the style reference — match this look exactly, but for the Lemonade flavor.*

### Finishing moves — magic words that always make it better

Bolt any of these onto a request, or send one as a follow-up tweak. They're the difference
between "fine" and "looks expensive."

#### Text effects — layer styles

**Full layer styles** — the Photoshop treatment in one sentence; the biggest "designed vs typed" upgrade:
```
Style the headline with full layer styles — a gradient fill through the letters, a
glossy bevel highlight along the top edges, a thick outline in a deeper shade of the
fill color, and a soft drop shadow lifting it off the background.
```

**Neon glow** — great on dark backgrounds; nightlife energy, giveaways, hype posts:
```
Make the headline glow like a neon sign — a bright hot core with a soft colored halo
bleeding into the dark background.
```

**Gold foil & chrome** — instant premium; swap "gold foil" for chrome, brushed silver, or holographic foil:
```
Render the headline as stamped gold foil — metallic sheen, embossed depth, tiny sparkle
highlights where the light catches the letters.
```

#### Light & depth

**Backlight the hero** — a glow behind the product separates it and makes it the star:
```
Backlight the product with a soft halo of glow behind it, and rim-light its edges so
it pops off the background.
```

**Sharp hero, soft world** — real lenses blur the background; fake images keep everything in focus:
```
Keep the product tack-sharp and softly blur everything behind it — shallow depth of
field, like a real lens.
```

**Ice-cold atmosphere** — cold → condensation, hot → steam, moody → dust in the light beam:
```
Cover the can in fine condensation droplets with a touch of frosty mist — it should
feel ice cold.
```

**Filmed, not generated** — too smooth = AI; real grain and imperfection = photograph:
```
Make it look like a real photograph — 35mm film grain, real shadows, slightly
imperfect. Not smooth or computer-generated.
```

#### Clean layout — don't clutter

**One hero, one headline** — cluttered layouts scream amateur; empty space looks expensive:
```
Keep the layout clean and uncluttered — ONE hero product, ONE headline, generous empty
space around them. Don't fill every corner.
```

**Give text calm ground** — letters over busy artwork turn into unreadable soup:
```
Place all text over a calm, simple part of the background — never across busy details.
Every letter fully visible, no other text anywhere, no misspellings.
```

#### The follow-up move

**Change ONE thing at a time** — when a result is 90% there, don't re-roll it; adjust surgically:
```
Keep everything exactly the same as this image — change only [the one thing].
```

### Tips for asking well

- **Always name the brand** (Muha, NuLumin, Dialed Moods…). Claude automatically reads that
  brand's rulebook from the `Brand Context` folder, so it knows the logos, colors, and rules.
- **Say the size**: Instagram post = 4:5, story/reel = 9:16, square = 1:1, banner = 16:9.
- **Put exact wording in quotes.** If text must appear on the image, spell it out: put the
  exact text "20% OFF THIS WEEK" on it. Keep on-image text short.
- **Ask for 2–3 options** on anything subjective, then pick one and refine it.
- **Video is slower and costs more** — start with one clip, review it, then ask for more.

---

## Handy things to know about Claude Code

- **Enter sends your message.** Just write naturally — full sentences are perfect.
- **Press Esc to stop Claude** if it's heading the wrong direction. Then just tell it what
  you actually want.
- **Type `/clear` when you switch topics** (new brand, new campaign). It gives Claude a fresh
  head so old instructions don't leak into new work.
- **Drag files into the window** to show them to Claude — images, PDFs, spreadsheets, anything.
- **Screenshots**: press **Cmd + Shift + 4** and drag over part of your screen; the screenshot
  saves to your Desktop — then drag it into the chat.
- **Finished images open automatically** in Preview. They're also saved as files — ask Claude
  *"where did you save those?"* anytime.
- **`claudego -c`** (instead of `claudego`) reopens your **last conversation** if you closed
  Terminal and want to continue where you left off.
- **To quit**: type `/exit`, or just close the Terminal window.
- **You can't really break anything.** If you're unsure, just ask Claude — *"what should I
  say to get X?"* works surprisingly well.

---

## If something goes wrong

| Problem | Fix |
|---|---|
| Terminal says `command not found: claude` | Quit Terminal fully (Cmd + Q) and reopen. If it persists, redo Step 2. |
| Terminal says `command not found: claudego` | Redo Step 4, then quit and reopen Terminal. |
| Errors about "API key" when generating | The keys file isn't installed — redo Step 7. |
| GitHub won't let you download the project | Your GitHub account may not have access yet — message us. |
| Claude seems confused or stuck | Press Esc, type `/clear`, and re-ask in a fresh message. |
| Anything else | Copy the error message, paste it to Claude, and ask *"how do I fix this?"* — it will usually solve its own problems. |

Welcome aboard — now go make something.
