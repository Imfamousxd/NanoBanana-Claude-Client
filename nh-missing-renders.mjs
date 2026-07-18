import fs from "fs";
for (const line of fs.readFileSync(".env","utf-8").split("\n")){const m=line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);if(m&&!process.env[m[1]])process.env[m[1]]=m[2];}

const L = "Noble Harbor Wholesale";
const OUT = "email_campaigns/noble_harbor/wholesale_outreach/assets/generated";
fs.mkdirSync(OUT, { recursive: true });

const JOBS = [
  {
    slug: "b12",
    ref: `${L}/BPC-157 2/10mg/BPC-157_10mg_3ml_babyblue.jpg`,
    prompt: `Reproduce the reference image EXACTLY — the identical glass vial, identical light-blue cap, identical white label design and layout, identical light-blue accent stripe at the bottom of the label, identical lighting, shadows, framing and pure white background — with ONE change only: the large product name on the label must read "B-12" instead of "BPC-157". Keep every other label line exactly as in the reference: "10 mg · 3 ml", "FOR RESEARCH USE ONLY", "NOT FOR HUMAN CONSUMPTION", "LOT: NH-1024", same fonts, same sizes, same positions. Spell B-12 exactly (letter B, hyphen, numerals 1 and 2). No other text changes, no misspellings, no watermarks, photorealistic product render.`,
  },
  {
    slug: "cjcipa",
    ref: `${L}/BPC-157 - TB500 2/10-10mg/BPC-157_-_TB500_10-10mg_3ml_red.jpg`,
    prompt: `Reproduce the reference image EXACTLY — the identical glass vial, identical dark-red cap, identical white label design and layout, identical red accent stripe at the bottom of the label, identical lighting, shadows, framing and pure white background — with TWO changes only: (1) the large product name line on the label must read "CJC-1295 / IPAMORELIN" instead of "BPC-157 / TB500" (same bold font, typeset slightly smaller so it fits on one line), and (2) the dose line beneath it must read "5/5 mg · 3 ml" instead of "10/10 mg · 3 ml". Keep every other label line exactly as in the reference: "FOR RESEARCH USE ONLY", "NOT FOR HUMAN CONSUMPTION", "LOT: NH-1024", same fonts, same sizes, same positions. Spell "CJC-1295 / IPAMORELIN" and "5/5 mg · 3 ml" exactly as written. No other text changes, no misspellings, no watermarks, photorealistic product render.`,
  },
];

async function gen(job, i) {
  const form = new FormData();
  form.append("model", "gpt-image-2");
  form.append("prompt", job.prompt);
  form.append("size", "1024x1536");
  form.append("quality", "high");
  form.append("n", "1");
  form.append("image[]", new Blob([fs.readFileSync(job.ref)], { type: "image/jpeg" }), "ref.jpg");
  const res = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST", headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }, body: form,
  });
  if (!res.ok) { console.log(`${job.slug} c${i} API`, res.status, (await res.text()).slice(0, 300)); return; }
  const d = (await res.json()).data || [];
  if (!d[0]?.b64_json) { console.log(`${job.slug} c${i} none`); return; }
  fs.writeFileSync(`${OUT}/${job.slug}_c${i}.png`, Buffer.from(d[0].b64_json, "base64"));
  console.log(`SAVED ${job.slug}_c${i}.png`);
}

await Promise.all(JOBS.flatMap(j => [1, 2].map(i => gen(j, i))));
console.log("DONE");
