#!/usr/bin/env node
// Build the Noble Harbor 6-new-size-token job matrix.
//   Amber 5 ml (5ml-dark) + Amber 10 ml (10ml-dark) for ALL products, reproduced from _3ml-dark_ (change "3 ml"->TO).
//   NAD+ & Glutathione ONLY also get:
//     Clear 20 ml (20ml)      from _5ml_        (change "5 ml"->"20 ml")
//     Amber 20 ml (20ml-dark) from _3ml-dark_   (change "3 ml"->"20 ml")
//     Clear 30 ml (30ml)      from _5ml_        (change "5 ml"->"30 ml")
//     Amber 30 ml (30ml-dark) from _3ml-dark_   (change "3 ml"->"30 ml")
// Emits nh-sizes-all.json. Skips jobs whose source ref is missing (logged).
import fs from "fs";

const ROOT = "Noble Harbor Wholesale";
const COLORS = ["navy","black","white","red","green","babyblue","yellow","pink","purple"];
const BIG = new Set(["NAD+", "Glutathione"]); // get the 20/30 ml tokens

const products = fs.readFileSync("nh-peptides.txt","utf-8")
  .split("\n").map(s=>s.trim()).filter(s=>s && !s.startsWith("#"));

// token -> { srcToken, from, to }
const tokensFor = (product) => {
  const t = [
    { dst:"5ml-dark",  src:"3ml-dark", from:"3 ml", to:"5 ml"  },
    { dst:"10ml-dark", src:"3ml-dark", from:"3 ml", to:"10 ml" },
  ];
  if (BIG.has(product)) t.push(
    { dst:"20ml",      src:"5ml",      from:"5 ml", to:"20 ml" },
    { dst:"20ml-dark", src:"3ml-dark", from:"3 ml", to:"20 ml" },
    { dst:"30ml",      src:"5ml",      from:"5 ml", to:"30 ml" },
    { dst:"30ml-dark", src:"3ml-dark", from:"3 ml", to:"30 ml" },
  );
  return t;
};

const jobs = [], missing = [];
for (const product of products) {
  const stem = product.replace(/ /g, "_");
  const dir = `${ROOT}/${product}`;
  for (const c of COLORS) {
    for (const { dst, src, from, to } of tokensFor(product)) {
      const ref = `${dir}/${stem}_${src}_${c}.jpg`;
      const out = `${dir}/${stem}_${dst}_${c}.jpg`;
      if (!fs.existsSync(ref)) { missing.push(ref); continue; }
      jobs.push({ product, color:c, token:dst, ref, out, from, to });
    }
  }
}

fs.writeFileSync("nh-sizes-all.json", JSON.stringify(jobs, null, 2));
const byTok = {};
for (const j of jobs) byTok[j.token] = (byTok[j.token]||0) + 1;
console.log(`Products: ${products.length}  Jobs: ${jobs.length}`);
console.log("By token:", byTok);
const already = jobs.filter(j=>fs.existsSync(j.out)).length;
console.log(`Already-existing outputs (will be skipped by driver): ${already}`);
if (missing.length) { console.log(`Missing source refs (${missing.length}):`); missing.forEach(m=>console.log("  "+m)); }
