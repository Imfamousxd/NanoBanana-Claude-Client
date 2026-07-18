import fs from "fs";
for (const line of fs.readFileSync(".env","utf-8").split("\n")){const m=line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);if(m&&!process.env[m[1]])process.env[m[1]]=m[2];}

const LAYOUT="AI Fruit VIdeos Muha/Master Case Designs/2026-06-08T21-44-31_mastercase-front-v7c1.png"; // approved composition to KEEP
const CHARS ="AI Fruit VIdeos Muha/Master Case Designs/2026-05-31T05-20-34_muha-mastercase-v21c1-FRONT.png"; // fruit-drama color world + 10 char likenesses
const MUSTANG="AI Fruit VIdeos Muha/refs/mustang key.jpg"; // Mustang identity / running-pony emblem

const PROMPT=`Restyle this approved giveaway FRONT-PANEL poster into the vibrant AI FRUIT-DRAMA world. Reference image 1 is the EXACT layout/composition to KEEP.

KEEP THE SAME COMPOSITION: top blank nameplate plate (leave it empty for the real "Members" logo); the big headline; the sleek BLACK FORD MUSTANG as the spotlit central HERO on its stage; the 10 glossy Pixar-3D fruit-drama characters as a balanced, deliberate cast lineup flanking and standing behind the car (movie-poster ensemble, not a piled-up collage); the round winged-M coin medallion below the car; the "ALL-IN-ONE" script over the slim checkered "100 UNITS | 10 CASES | 10 STRAINS" band; and the "SCAN TO ENTER" QR block at the bottom.

RESTYLE CHANGES:
- REMOVE the gold filigree border and all corner frames ENTIRELY. Full-bleed background edge to edge — NO border, NO frame, no ornate corner scrollwork.
- Drastically REDUCE gold. Only minimal subtle gold accents remain; this is NOT a gold-luxe design anymore.
- BACKGROUND: a lush, vibrant, glossy 3D AI FRUIT-DRAMA world — juicy stylized fruit, soft tropical color, cinematic depth and lighting. Make it SLIGHTLY MORE COLORFUL and playful than a dark panel, but still clean and well composed (NOT a flat, busy, oversaturated rainbow collage). Use reference image 2 for the fruit-drama color palette and the 10 characters' exact likenesses.
- HEADLINE COLOR: "GIVEAWAY" in bold vivid BLUE; "WIN A FORD MUSTANG" in clean bright WHITE. Crisp, confident, well-spaced typography with clear hierarchy.
- Keep the car a black Ford Mustang (reference image 3 for its identity and silver running-pony emblem).

Spell EXACTLY: "GIVEAWAY", "WIN A FORD MUSTANG", "ALL-IN-ONE", "100 UNITS | 10 CASES | 10 STRAINS". No other text, no misspellings. One flat self-contained portrait poster — no box flaps, no dieline, no crease lines.`;

const form=new FormData();
form.append("model","gpt-image-2");
form.append("prompt",PROMPT);
form.append("size","1024x1536");
form.append("quality","high");
form.append("n","2");
form.append("image[]",new Blob([fs.readFileSync(LAYOUT)],{type:"image/png"}),"layout.png");
form.append("image[]",new Blob([fs.readFileSync(CHARS)],{type:"image/png"}),"chars.png");
form.append("image[]",new Blob([fs.readFileSync(MUSTANG)],{type:"image/jpeg"}),"mustang.jpg");

const res=await fetch("https://api.openai.com/v1/images/edits",{method:"POST",headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`},body:form});
if(!res.ok){console.error("HTTP",res.status,(await res.text()).slice(0,500));process.exit(1);}
const data=((await res.json()).data||[]);
if(!data.length){console.error("no image");process.exit(1);}
const stamp=new Date().toISOString().replace(/[:.]/g,"-").slice(0,19);
const outs=[];
data.forEach((item,i)=>{
  if(!item?.b64_json)return;
  const out=`AI Fruit VIdeos Muha/Master Case Designs/${stamp}_mastercase-front-v8c${i+1}.png`;
  fs.writeFileSync(out,Buffer.from(item.b64_json,"base64"));
  outs.push(out);console.log("✓ "+out);
});
console.log(outs.join("\n"));
