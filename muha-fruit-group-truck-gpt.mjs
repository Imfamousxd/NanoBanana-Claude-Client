#!/usr/bin/env node
// gpt-image-2 group shot — all 10 Muha fruit-drama characters in the back of a pickup truck.
// Outputs 4:3, 2:1, and 16:9 versions for a Muha members giveaway raffle graphic.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const line of fs.readFileSync(path.join(__dirname, ".env"), "utf-8").split("\n")) {
  const m = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const API_KEY = process.env.OPENAI_API_KEY;
const MODEL = "gpt-image-2";

const TRUCK_REF = "AI Fruit VIdeos Muha/refs/truck.jpg";
const CHAR_DIR = "AI Fruit VIdeos Muha/Generated Characters";
const CHARACTERS = [
  "Aloha Passion Rush.png",
  "Arctic Blueberry.png",
  "Blue Slushie.png",
  "Frosted Mint Cookies.png",
  "Frozen Pomegranate.png",
  "Galactic Diesel.png",
  "Guava Mango.png",
  "Horchata.png",
  "Lemon Cherry Fizz.png",
  "Watermelon Bubblegum.png",
];

const PROMPT = `Group cast shot for a giveaway graphic. Build a single wide cinematic Pixar-3D scene with ALL TEN of these fruit-drama characters from the reference images posed together in and around the back of the BLACK FORD F-150 PICKUP TRUCK shown in the truck reference. Wide landscape composition, hero ensemble layout, like a movie poster cast lineup.

THE TRUCK — match the truck reference: a glossy BLACK Ford F-150 pickup, rear/three-quarter view with the TAILGATE DOWN. Render the truck in the same Pixar / Cinema 4D / Octane 3D animated style as the characters (NOT photoreal — stylized animated truck with cartoon-clean panels, animated material shading, slightly exaggerated proportions to match the character world). Do NOT include any "Chicago Motor Cars" text, no dealership signage, no license plate text, no real brand logos, no Ford emblem text — strip all logos and text from the truck. The truck is parked, tailgate open, ready to be loaded with the cast.

THE TEN CHARACTERS — pose all of them together in/around the open truck bed and tailgate. Maintain each character's locked design from their reference images (same head fruit, same outfit, same personality, same Pixar 3D rendering). Each character is fully present and recognizable. Suggested arrangement (you can adjust for natural composition flow):
- ALOHA PASSION RUSH — sitting on the edge of the tailgate, leg crossed, sultry smolder, passionfruit head with hibiscus crown
- ARCTIC BLUEBERRY — standing in the truck bed at the back, arms folded, broody scowl, plain blue hoodie + plain blue tee + dark sweats, blueberry head with snow tuft
- BLUE SLUSHIE — leaning against the side of the truck bed, hands on either side of head mid-brain-freeze gasp, dramatic over-reactor
- FROSTED MINT COOKIES — gently sitting in the truck bed, knees slightly together, soft bashful smile, cookie-textured head
- FROZEN POMEGRANATE — standing tall on the tailgate, arms crossed, mean-girl smirk, pomegranate head, queen-bee energy
- GALACTIC DIESEL — leaning casually on the tailgate corner, cocky smirk, cosmic-purple planet head with Saturn rings, leather jacket, holding a small cosmic spark
- GUAVA MANGO — laughing with her head thrown back, sitting in the truck bed, mango head with full leafy hair, mid-belly-laugh joy
- HORCHATA — standing in the truck bed in a graceful flamenco arm-up pose, creamy-cinnamon-swirl head with cinnamon-stick curls + red rose, plain red flamenco dress
- LEMON CHERRY FIZZ — sitting in the bed holding a book, tortoiseshell glasses, cherry earrings dangling, leafy bob, plain yellow shirt + red vest + red skirt, smart smirk
- WATERMELON BUBBLEGUM — standing on the tailgate, peace sign up, mid-bubblegum-blow, whole watermelon head with pink-gum quiff hair, green bomber + pink crewneck + dark cargos, fun playful skater-guy energy

STYLE LOCK — UNIFIED PIXAR / CINEMA 4D / OCTANE 3D RENDER across the entire scene. Truck, characters, environment all rendered in the same stylized animated feature-film look as the character references. NOT photoreal, NOT live-action, NOT a real photo with cartoon characters pasted on. Everything is one cohesive Pixar 3D world. Match the same render quality, lighting style, and cohesion as a movie poster ensemble shot.

ENVIRONMENT — the truck is parked outside in a vibrant Pixar-stylized outdoor scene: warm golden-hour sunset sky with soft pink-and-orange clouds, palm trees or stylized urban setting blurred in the background, soft bokeh, dust particles catching warm light. Atmospheric, cinematic, hero-shot quality.

LIGHTING — warm cinematic golden-hour key light from the side, soft pink/orange rim light, cool shadow fill on the opposite side, dramatic hero-poster lighting that flatters the whole group.

COMPOSITION — wide landscape group shot. The truck and full cast fill the frame, all 10 characters clearly visible and identifiable. Hero-poster framing: like the cast of an animated film posing together for the promotional artwork. Slight dynamic camera angle (gentle three-quarter perspective on the truck) makes it feel alive.

NEGATIVE — do NOT add ANY brand logos, text, signage, Muha branding, Ford emblems, dealership text, license plates, or written words anywhere in the image. Do NOT include the "Chicago Motor Cars" text from the reference background. Do NOT photoreal-render the truck or any element — everything must be unified Pixar 3D animated style. Do NOT lose any of the 10 characters — all ten must be present and recognizable. Do NOT change any character's locked design (head fruit, outfit, personality). Do NOT add extra characters beyond the ten. Do NOT add humans / real people / extras.`;

const SIZES = [
  { label: "4x3",  size: "2048x1536" },
  { label: "2x1",  size: "2048x1024" },
  { label: "16x9", size: "2048x1152" },
];

function mimeForExt(ext) {
  return { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg" }[ext.toLowerCase()] || "image/png";
}

function buildForm(size) {
  const form = new FormData();
  form.append("model", MODEL);
  form.append("prompt", PROMPT);
  form.append("size", size);
  form.append("quality", "high");
  form.append("n", "1");
  const truckBuf = fs.readFileSync(TRUCK_REF);
  form.append("image[]", new Blob([truckBuf], { type: mimeForExt(path.extname(TRUCK_REF)) }), "truck.jpg");
  for (const charFile of CHARACTERS) {
    const p = path.join(CHAR_DIR, charFile);
    const buf = fs.readFileSync(p);
    form.append("image[]", new Blob([buf], { type: "image/png" }), charFile);
  }
  return form;
}

const outDir = "AI Fruit VIdeos Muha/Group Truck Shot";
fs.mkdirSync(outDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);

for (const { label, size } of SIZES) {
  console.log(`Generating ${label} (${size})...`);
  const form = buildForm(size);
  const res = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: { Authorization: `Bearer ${API_KEY}` },
    body: form,
  });
  if (!res.ok) {
    console.error(`HTTP ${res.status} (${label}): ${(await res.text()).slice(0, 400)}`);
    continue;
  }
  const data = await res.json();
  const item = (data.data || [])[0];
  if (!item?.b64_json) { console.error(`no b64_json (${label})`); continue; }
  const outPath = `${outDir}/${stamp}_muha-group-truck-${label}.png`;
  fs.writeFileSync(outPath, Buffer.from(item.b64_json, "base64"));
  console.log(`✓ ${outPath}`);
}
