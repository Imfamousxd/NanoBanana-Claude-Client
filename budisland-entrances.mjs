#!/usr/bin/env node
// BUD ISLAND — Love-Island-style CONTESTANT ENTRANCE clips for the fruit cast.
// Seedance 2.0, reference_images=[character portrait] for on-model consistency, 9:16, 1080p, audio.
// usage: node budisland-entrances.mjs <slug|all> [slug...]   (e.g. "aloha", or "all")
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const line of fs.readFileSync(path.join(__dirname, ".env"), "utf-8").split("\n")) {
  const m = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const TOKEN = process.env.REPLICATE_API_TOKEN;
const MODEL = "bytedance/seedance-2.0";
const PDIR = "AI Fruit VIdeos Muha/Generated Characters";
const OUT = "AI Fruit VIdeos Muha/Bud Island Intro";
fs.mkdirSync(OUT, { recursive: true });

const STYLE = `Glossy PREMIUM 3D animated-feature look (Pixar/DreamWorks quality), cinematic golden-hour lighting, lens flare, smooth confident slow tracking camera — a Love-Island-style CONTESTANT ENTRANCE. Setting: a sunny luxury tropical resort VILLA — pool, palm trees, turquoise lagoon, daybeds, beach behind. Match the referenced character EXACTLY (same fruit head, features, skin color, outfit, accessories). Solo character. Upbeat tropical house-music groove with ambient poolside sounds.`;

const CAST = [
  { slug: "aloha", file: "Aloha Passion Rush.png",
    who: "a passionfruit-purple fruit-headed young woman with green tropical-leaf hair, a pink hibiscus, glossy red lips, a coral tied-front tropical top and a flower lei",
    act: "struts confidently toward the camera along the poolside, hips swaying, then gives a slow sultry over-the-shoulder glance and a hair-flip with a smoldering half-smile" },
  { slug: "blueberry", file: "Arctic Blueberry.png",
    who: "a tall broad blueberry-blue round-headed young man with a small snow tuft, an iced-out diamond cuban-link chain, a light-blue hoodie and ripped light jeans",
    act: "walks in with effortless cool nonchalant swagger, one hand in his hoodie pocket, glances up with a chill half-lidded smirk and a tiny confident nod — pure drip" },
  { slug: "slushie", file: "Blue Slushie.png",
    who: "a blue-skinned gamer e-girl with pink-and-blue cotton-candy hair in space buns, a cat-ear gaming headset, blush-heart cheeks, a pink/blue tank and striped arm warmers",
    act: "bounces in bubbly and playful, throws up a peace sign with a wink and a quick tongue-out :P, full of hype energy" },
  { slug: "cookies", file: "Frosted Mint Cookies.png",
    who: "a cookie-textured round-headed young woman (cookie-brown with chocolate-chip flecks) with mint-green frosting and mint leaves on top, bashful blush, in a cozy mint-cookie patterned sweater",
    act: "walks in shyly, gives a small bashful little wave and a sweet blushing smile, tucking in slightly — gentle and endearing" },
  { slug: "pomegranate", file: "Frozen Pomegranate.png",
    who: "a hyper-buff bodybuilder with a deep crimson pomegranate head (leathery crown on top), pomegranate-red skin, a faint icy frost sheen, in a tight red muscle tank",
    act: "strides in heavily, flexes his massive arms and chest, then crosses his arms with an intimidating scowl and a slow menacing stare" },
  { slug: "diesel", file: "Galactic Diesel.png",
    who: "a cosmic rebel with a glowing cosmic-purple planet head, a thin orbiting Saturn ring, electric-green eyes, in a black leather moto jacket",
    act: "saunters in with a cocky lean, smirks, and flicks a small glowing cosmic spark between his fingertips — too-cool-for-this outlaw energy" },
  { slug: "mango", file: "Guava Mango.png",
    who: "a class-clown young man with a head split half mango-yellow / half guava-green, leafy mango hair, in a yellow tee under an open coral-pink button-up",
    act: "walks in already cracking up, throws his head back in a big belly-laugh with a hand on his stomach, then points at the camera grinning" },
  { slug: "horchata", file: "Horchata.png",
    who: "a flamenco drama queen with a cream cinnamon-swirl head, cinnamon-curl hair, a red rose behind one ear, in a ruffled deep-red flamenco dress",
    act: "makes a dramatic flamenco entrance — a sharp spin with the dress flaring, one arm raised in a graceful arc, ending with a fierce smoldering side-glance" },
  { slug: "lemon", file: "Lemon Cherry Fizz.png",
    who: "a smart nerd girl with a bright-yellow lemon head, green lemon-leaf bob, cherry earrings, round tortoiseshell glasses, in a pastel-yellow shirt under a cherry-red knit vest, a book under one arm",
    act: "walks in composed, pushes her glasses up the bridge of her nose with one finger and gives a soft knowing smirk" },
  { slug: "watermelon", file: "Watermelon Bubblegum.png",
    who: "a playful skater guy with a green watermelon head, a pink bubblegum quiff, in a green watermelon-rind bomber over a pink crewneck",
    act: "saunters in with an easy slouch, blows a big pink bubblegum bubble that pops, then throws up a peace sign with a fun grin" },
];

const want = process.argv.slice(2);
const run = want.includes("all") || want.length === 0 ? CAST : CAST.filter(c => want.includes(c.slug));

const toDataUri = (p) => `data:image/png;base64,${fs.readFileSync(p).toString("base64")}`;

for (const c of run) {
  const prompt = `${STYLE}\n\nThe character is ${c.who}. They ${c.act}.`;
  const input = {
    prompt,
    reference_images: [toDataUri(path.join(PDIR, c.file))],
    duration: 5,
    resolution: "1080p",
    aspect_ratio: "9:16",
    generate_audio: true,
  };
  console.log(`→ ${c.slug} entrance...`);
  const create = await fetch(`https://api.replicate.com/v1/models/${MODEL}/predictions`, {
    method: "POST", headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json", Prefer: "wait=5" },
    body: JSON.stringify({ input }),
  });
  if (!create.ok) { console.error(`  create failed ${create.status}: ${(await create.text()).slice(0, 200)}`); continue; }
  let pred = await create.json();
  while (!["succeeded", "failed", "canceled"].includes(pred.status)) {
    await new Promise(r => setTimeout(r, 5000));
    pred = await (await fetch(pred.urls.get, { headers: { Authorization: `Bearer ${TOKEN}` } })).json();
  }
  if (pred.status !== "succeeded") { console.error(`  FAILED ${c.slug}: ${pred.error}`); continue; }
  const url = Array.isArray(pred.output) ? pred.output[0] : pred.output;
  const out = path.join(OUT, `01_entrance_${c.slug}.mp4`);
  fs.writeFileSync(out, Buffer.from(await (await fetch(url)).arrayBuffer()));
  console.log(`  ✓ ${out}`);
}
console.log("Done.");
