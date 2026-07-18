#!/usr/bin/env node
// v5 surgical fixes on the winning v4 renders (curl transport — immune to fetch timeouts).
import fs from "fs";
import path from "path";
import os from "os";
import { execFileSync } from "child_process";
for (const line of fs.readFileSync(".env", "utf-8").split("\n")) {
  const m = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = "gemini-3-pro-image-preview";
const DIR = "NuLumin Influencer Box";

const KEEP = `Reproduce reference image 1 EXACTLY — same open box, same camera angle, same pure white studio background, same lid artwork, same insert, same cartons, same printed labels, same lighting and shadows —`;

const JOBS = [
  {
    slug: "closed_front_v6",
    base: "refs/base_front_v5.jpg",
    prompt: `Reference image 1 is a finished studio product photograph of the closed NuLumin box on a white sweep, shot straight-on: five flush color blocks on the front, color stripe along the lid's front edge, white lid top. Reproduce it EXACTLY — same box, same camera, same flush color blocks, same stripe, same soft shadow — with exactly TWO changes and nothing else:
(1) On the white lid top, fix the logo lockup: the small five-color spectrum bar currently sits to the LEFT of the wordmark — move it so it sits as a small horizontal five-color bar DIRECTLY ABOVE the wordmark "NuLumin", left-aligned with the start of the wordmark, with "BIO-SCIENCES" in small letterspaced capitals beneath the wordmark. The lockup stays centered on the lid as a whole. Spell exactly "NuLumin" and "BIO-SCIENCES".
(2) Replace the BACKGROUND with a pure, empty, seamless bright white studio sweep edge to edge — remove the grey streak band and any texture from the backdrop, keeping only the soft shadow under the box.
Do not change the box's faces, colors, blocks or anything else.`,
  },
];

async function run(job) {
  const parts = [
    { inline_data: { mime_type: "image/jpeg", data: fs.readFileSync(path.join(DIR, job.base)).toString("base64") } },
    { text: job.prompt },
  ];
  const body = {
    contents: [{ parts }],
    generationConfig: { responseModalities: ["TEXT", "IMAGE"], imageConfig: { aspectRatio: "4:5", imageSize: "4K" } },
  };
  console.log(`→ ${job.slug}...`);
  const reqFile = path.join(os.tmpdir(), `nb5_${job.slug}.json`);
  const resFile = path.join(os.tmpdir(), `nb5_${job.slug}_res.json`);
  fs.writeFileSync(reqFile, JSON.stringify(body));
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      execFileSync("curl", ["-s", "--max-time", "900", "-X", "POST",
        "-H", `x-goog-api-key: ${API_KEY}`, "-H", "Content-Type: application/json",
        "--data-binary", `@${reqFile}`, "-o", resFile,
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`]);
      const json = JSON.parse(fs.readFileSync(resFile, "utf-8"));
      if (json.error) { console.log(`  API error (attempt ${attempt}/3): ${JSON.stringify(json.error).slice(0, 200)}`); continue; }
      for (const p of json.candidates?.[0]?.content?.parts || []) {
        if (p.inlineData) {
          const out = path.join(DIR, `box_${job.slug}.png`);
          fs.writeFileSync(out, Buffer.from(p.inlineData.data, "base64"));
          console.log(`  ✓ ${out}`);
          return;
        }
      }
      console.log(`  no image (attempt ${attempt}/3)`);
    } catch (e) {
      console.log(`  curl failed (attempt ${attempt}/3): ${String(e.message).slice(0, 120)}`);
    }
  }
  console.error(`  FAILED ${job.slug} after 3 attempts`);
}

const want = process.argv.slice(2);
const jobs = want.length ? JOBS.filter(j => want.includes(j.slug)) : JOBS;
for (const j of jobs) await run(j);
console.log("Done.");
