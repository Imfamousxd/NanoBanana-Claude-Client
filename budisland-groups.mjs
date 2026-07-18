#!/usr/bin/env node
// BUD ISLAND — group MINGLE / DANCE / INTERACTION clips (Love-Island montage).
// Seedance 2.0, reference_images=[the characters in the scene] for on-model consistency, 9:16, 1080p, audio.
// usage: node budisland-groups.mjs <id|all> [id...]
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const line of fs.readFileSync(path.join(__dirname, ".env"), "utf-8").split("\n")) {
  const m = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const TOKEN = process.env.REPLICATE_API_TOKEN;
const MODEL = "bytedance/seedance-2.0";
const PDIR = "AI Fruit VIdeos Muha/Generated Characters/_small";
const OUT = "AI Fruit VIdeos Muha/Bud Island Intro";

const STYLE = `Glossy PREMIUM 3D animated-feature look (Pixar/DreamWorks quality), a Love-Island-style social montage moment at a sunny luxury tropical VILLA — pool, palms, daybeds, string lights, turquoise lagoon. Match each referenced character EXACTLY (same fruit head, features, skin color, outfit). Warm golden-hour / sunset party light, lens flare, lively fun energy, smooth handheld-ish camera. Upbeat tropical house party music with happy chatter and laughter.`;

const SCENES = [
  { id: "mingle_aloha_blueberry", refs: ["Aloha Passion Rush.png", "Arctic Blueberry.png"],
    desc: "The two heartbreakers flirt by the pool — the purple passionfruit-headed woman (green leaf hair, hibiscus, coral tropical top) and the blue blueberry-headed guy (light-blue hoodie, diamond chain) lean in close, laughing and chatting with tropical cocktails in hand, clearly into each other." },
  { id: "dance_party_trio", refs: ["Watermelon Bubblegum.png", "Blue Slushie.png", "Guava Mango.png"],
    desc: "Three friends dance energetically together at the sunset pool party — the green watermelon-headed skater guy, the blue cotton-candy-haired gamer e-girl, and the half-mango/half-guava class-clown guy — hands up, vibing and laughing under string lights." },
  { id: "toast_cheers", refs: ["Horchata.png", "Lemon Cherry Fizz.png", "Galactic Diesel.png"],
    desc: "On the villa deck, the cream cinnamon-swirl flamenco woman, the yellow lemon nerd girl with glasses, and the cosmic-purple planet-headed guy in a leather jacket raise tropical drinks together in a cheerful toast, clinking glasses and laughing." },
  { id: "mingle_joke", refs: ["Guava Mango.png", "Frosted Mint Cookies.png", "Frozen Pomegranate.png"],
    desc: "The half-mango/half-guava class clown cracks a big joke and laughs hard; the shy cookie-headed girl (mint frosting, cozy sweater) giggles bashfully beside him; the huge red buff pomegranate guy in a red tank crosses his arms, unimpressed — a funny group beat by the pool." },
];

const want = process.argv.slice(2);
const run = want.includes("all") || want.length === 0 ? SCENES : SCENES.filter(s => want.includes(s.id));
const toDataUri = (p) => `data:image/jpeg;base64,${fs.readFileSync(p).toString("base64")}`;

for (const s of run) {
  const input = {
    prompt: `${STYLE}\n\nSCENE: ${s.desc}`,
    reference_images: s.refs.map(f => toDataUri(path.join(PDIR, f.replace(".png", ".jpg")))),
    duration: 6,
    resolution: "1080p",
    aspect_ratio: "9:16",
    generate_audio: true,
  };
  console.log(`→ ${s.id} (${s.refs.length} chars)...`);
  const create = await fetch(`https://api.replicate.com/v1/models/${MODEL}/predictions`, {
    method: "POST", headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ input }),
  });
  if (!create.ok) { console.error(`  create failed ${create.status}: ${(await create.text()).slice(0, 200)}`); continue; }
  let pred = await create.json();
  while (!["succeeded", "failed", "canceled"].includes(pred.status)) {
    await new Promise(r => setTimeout(r, 5000));
    pred = await (await fetch(pred.urls.get, { headers: { Authorization: `Bearer ${TOKEN}` } })).json();
  }
  if (pred.status !== "succeeded") { console.error(`  FAILED ${s.id}: ${pred.error}`); continue; }
  const url = Array.isArray(pred.output) ? pred.output[0] : pred.output;
  const out = path.join(OUT, `02_${s.id}.mp4`);
  fs.writeFileSync(out, Buffer.from(await (await fetch(url)).arrayBuffer()));
  console.log(`  ✓ ${out}`);
}
console.log("Done.");
