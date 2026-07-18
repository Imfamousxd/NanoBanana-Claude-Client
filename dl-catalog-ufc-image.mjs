#!/usr/bin/env node
// UFC-partnership page visual for the Dialed Labs catalog (no logos, no faces).
import fs from "fs";
for (const line of fs.readFileSync(".env", "utf-8").split("\n")) {
  const m = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const OUT = "email_campaigns/dialed_labs/airbnb_outreach/catalog/images";
const PROMPT =
  "Cinematic wide photograph inside a dark elite MMA training facility at night: in the foreground a sleek matte-black cold plunge tub with faint cold mist, beside it a warm-glowing barrel sauna, an octagonal training cage blurred deep in the background under dramatic overhead rim lighting. Ember-orange and ice-blue accent lighting, haze in the air, deep blacks, premium sports-recovery editorial photography. No people, no faces, no text, no words, no logos, no brand marks, no watermarks.";

const res = await fetch("https://api.openai.com/v1/images/generations", {
  method: "POST",
  headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
  body: JSON.stringify({ model: "gpt-image-2", prompt: PROMPT, size: "1536x1024", quality: "high", n: 1 }),
});
if (!res.ok) { console.log(`API ${res.status}: ${(await res.text()).slice(0, 300)}`); process.exit(1); }
const data = (await res.json()).data || [];
fs.writeFileSync(`${OUT}/ufc_recovery.png`, Buffer.from(data[0].b64_json, "base64"));
console.log("SAVED ufc_recovery.png");
