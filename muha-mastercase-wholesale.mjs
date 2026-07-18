import fs from "fs";
for (const line of fs.readFileSync(".env","utf-8").split("\n")){const m=line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);if(m&&!process.env[m[1]])process.env[m[1]]=m[2];}

const BASES=[
  {slug:"c1", src:"AI Fruit VIdeos Muha/Master Case Designs/2026-06-08T21-49-38_mastercase-front-v8c1.png"},
  {slug:"c2", src:"AI Fruit VIdeos Muha/Master Case Designs/2026-06-08T21-49-38_mastercase-front-v8c2.png"},
];

const PROMPT=`Here is an approved Muha Members giveaway box-front (reference image 1). Make a CLEANED-UP WHOLESALE version. Reproduce it EXACTLY — the SAME vibrant fruit-drama world background, the SAME sleek black Ford Mustang hero, the SAME 10 glossy Pixar-3D fruit-drama characters arranged as the cast, and the SAME bold blue "GIVEAWAY" headline with white "WIN A FORD MUSTANG" beneath it.

REMOVE these elements COMPLETELY and fill the area with a clean, natural continuation of the fruit-world background (no blank holes, no leftover fragments):
- the "ALL-IN-ONE" script text
- the gold winged coin / medallion above it (the coin AND its wings)
- the black-and-white checkered flag band
- the "100 UNITS | 10 CASES | 10 STRAINS" text
- the QR code
- the "SCAN TO ENTER" text
- the empty nameplate box at the very TOP above "GIVEAWAY", together with the winged crest emblems flanking it — leave the top CLEAN

KEEP ONLY: the fruit-world background, the black Mustang, the 10 characters, and the "GIVEAWAY" / "WIN A FORD MUSTANG" headline. Rebalance the composition so it looks intentional and clean with those elements gone — no floating coins, wings, badges, codes, or text fragments anywhere. Do NOT add any new text, logos, badges, or emblems.

Portrait 2:3 poster, vibrant, colorful, premium glossy 3D. Spell exactly "GIVEAWAY" and "WIN A FORD MUSTANG".`;

const results=[];
for(const b of BASES){
  const form=new FormData();
  form.append("model","gpt-image-2");form.append("prompt",PROMPT);form.append("size","1024x1536");form.append("quality","high");form.append("n","1");
  form.append("image[]",new Blob([fs.readFileSync(b.src)],{type:"image/png"}),"base.png");
  const res=await fetch("https://api.openai.com/v1/images/edits",{method:"POST",headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`},body:form});
  if(!res.ok){console.error("HTTP",res.status,b.slug,(await res.text()).slice(0,300));continue;}
  const item=((await res.json()).data||[])[0];if(!item?.b64_json){console.error("no image",b.slug);continue;}
  const stamp=new Date().toISOString().replace(/[:.]/g,"-").slice(0,19);
  const out=`AI Fruit VIdeos Muha/Master Case Designs/${stamp}_mastercase-wholesale-${b.slug}.png`;
  fs.writeFileSync(out,Buffer.from(item.b64_json,"base64"));console.log("✓ "+out);results.push(out);
}
console.log("\nDone — "+results.length);
import{execSync}from"child_process";
if(results.length){try{execSync(`open -a Preview ${results.map(r=>`"${r}"`).join(" ")}`);}catch{}}
