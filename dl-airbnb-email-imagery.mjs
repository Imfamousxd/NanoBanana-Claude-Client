#!/usr/bin/env node
// Custom imagery for the Dialed Labs → Airbnb-host outreach email campaign.
import fs from "fs";
for (const line of fs.readFileSync(".env", "utf-8").split("\n")) {
  const m = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const OUT = "email_campaigns/dialed_labs/airbnb_outreach/assets";
fs.mkdirSync(OUT, { recursive: true });

const NEG =
  " No text, no words, no logos, no watermarks, no people, no faces. Photorealistic editorial product photography, dark moody premium grade, deep blacks, cinematic.";

const JOBS = [
  {
    name: "hero_sauna_cabin",
    size: "1536x1024",
    prompt:
      "Dusk exterior photograph of a premium modern barrel sauna sitting on the wooden deck of an upscale A-frame cabin vacation rental. Warm amber light glows from the sauna's circular glass door, subtle string lights on the cabin, tall pine forest and deep blue twilight sky behind. Moody, aspirational short-term-rental listing photography, warm highlights against near-black shadows." +
      NEG,
  },
  {
    name: "hero_plunge_patio",
    size: "1536x1024",
    prompt:
      "Blue-hour photograph of a sleek matte-black cold plunge tub with cedar wood trim, lid open with faint cold mist, on the stone patio of a luxury minimalist desert vacation rental. Cool ice-blue ambient lighting, warm interior house glow in the background, agave plants, editorial premium wellness photography, deep blacks." +
      NEG,
  },
  {
    name: "pod_sauna_interior",
    size: "1536x1024",
    prompt:
      "Interior photograph of a modern infrared sauna cabin: light hemlock wood benches and walls washed in warm ember-orange infrared light with a strip of deep red light panels glowing along the bench line, folded white towel, dark ambient edges. Premium spa product photography, cozy heat atmosphere." +
      NEG,
  },
  {
    name: "redlight_panel",
    size: "1024x1024",
    prompt:
      "Photograph of a tall slim red light therapy panel mounted on a dark charcoal wall, its LED array glowing intense red and near-infrared, faint red rim light spilling onto a wooden bench beside it, minimalist dark spa room, premium recovery-equipment product photography." +
      NEG,
  },
];

async function gen(job) {
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: "gpt-image-2", prompt: job.prompt, size: job.size, quality: "high", n: 1 }),
  });
  if (!res.ok) {
    console.log(`  [${job.name}] API ${res.status}: ${(await res.text()).slice(0, 200)}`);
    return null;
  }
  const data = (await res.json()).data || [];
  if (!data[0]?.b64_json) return console.log(`  [${job.name}] no image`), null;
  const fp = `${OUT}/${job.name}.png`;
  fs.writeFileSync(fp, Buffer.from(data[0].b64_json, "base64"));
  console.log(`  SAVED ${fp}`);
  return fp;
}

const saved = (await Promise.all(JOBS.map(gen))).filter(Boolean);
console.log(`DONE ${saved.length}/${JOBS.length}`);
