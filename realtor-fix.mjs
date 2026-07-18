#!/usr/bin/env node
// Fix Lily (uppercase domain) & Lexi (spaced domain) — anchor-derive from each
// approved flier so the design is preserved, only the email is corrected to
// clean all-lowercase, no spaces. 2 takes each.
import fs from "fs";

const D = "Realtor Fliers";
const FIX = [
  { name: "lily",  email: "lily@puroratehq.com",  ref: `${D}/lily.png` },
  { name: "lexi",  email: "lexi@oviocrewhq.com",  ref: `${D}/lexi.png` },
];

const jobs = [];
for (const f of FIX) {
  for (const take of [1, 2]) {
    jobs.push({
      prompt: `Reproduce this exact realtor flier PIXEL-FAITHFULLY — keep the identical person, photo, layout, colors, graphics, name and "REALTOR" title unchanged. Change ONLY the email text so it reads, crisply and correctly, in ALL LOWERCASE letters with NO spaces and no capital letters anywhere: "${f.email}". The "@" and "." stay as normal symbols. Everything else stays exactly as in the reference.`,
      aspectRatio: "3:4",
      imageSize: "4K",
      refImages: [f.ref],
      _meta: { name: `${f.name}-fix-take${take}` },
    });
  }
}

fs.writeFileSync("realtor-fix.json", JSON.stringify(jobs, null, 2));
console.log(`Wrote ${jobs.length} email-fix jobs (3:4 / 4K) -> gpt-image.mjs --batch`);
