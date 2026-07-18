import fs from "fs";
for (const line of fs.readFileSync(".env","utf-8").split("\n")){const m=line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);if(m&&!process.env[m[1]])process.env[m[1]]=m[2];}

const LAYOUT="AI Fruit VIdeos Muha/refs/front master case.png"; // front-panel-only premium layout/style anchor
const CHARS ="AI Fruit VIdeos Muha/Master Case Designs/2026-05-31T05-20-34_muha-mastercase-v21c1-FRONT.png"; // 10 fruit chars likeness source
const MUSTANG="AI Fruit VIdeos Muha/refs/mustang key.jpg"; // Mustang identity / silver running-pony emblem

const PROMPT=`Single self-contained PORTRAIT FRONT-PANEL poster for the Muha Members "AI Fruit" giveaway — a PREMIUM, CINEMATIC, high-end cannabis-brand package front. This is ONE flat rectangular panel (NOT an unfolded box — no fold flaps, no side rails, no dieline, no crease lines) with a clean even margin all around.

USE REFERENCE IMAGE 1 ONLY for the PREMIUM LAYOUT + DARK LUXE STYLE: the rich near-black background with subtle tone-on-tone gold/silver Art-Deco pinstripe filigree, thin electric-teal accent edge lines, gold filigree corner frames, and the vertical zone stack (top emblem banner -> big beveled headline -> central hero stage/dais -> gold winged-M coin medallion -> bottom script band). Keep that exact premium structure and dark luxe mood. Do NOT copy any of reference 1's text or its truck.

REPLACE the content:
- TOP emblem banner: gold winged-M Muha crest emblems flanking a clean reserved nameplate. LEAVE the central nameplate plate clean and EMPTY (no text, no logo) for a real "Members" logo to be dropped in later. Remove ALL Von Dutch / Kulture House branding — Muha-branded only.
- HEADLINE: bold chrome-and-gold beveled type, "GIVEAWAY" on top then "WIN A FORD MUSTANG" beneath, with small star bullets. Strong hierarchy, generous breathing room, crisp and perfectly spelled.
- CENTRAL HERO: a sleek BLACK FORD MUSTANG sports car at a low cinematic three-quarter angle, dramatically spotlit on the framed stage/dais medallion — NOT a truck. Use reference image 3 for the Mustang's identity and its silver running-pony emblem.
- CAST: the 10 glossy Pixar-3D Muha fruit-drama characters from reference image 2 (use ONLY for their exact likenesses) arranged as a deliberate, balanced, SPOTLIT cast lineup flanking and standing behind the Mustang — composed like a premium movie-poster ensemble, NOT a piled-up busy collage. Let their saturated colors pop against the dark ground.
- COIN: the gold MM winged coin medallion centered just below the car.
- BOTTOM: elegant gold script "ALL-IN-ONE" over a slim checkered band reading "100 UNITS | 10 CASES | 10 STRAINS".
- A small tasteful "SCAN TO ENTER" QR block.

Overall mood: restrained, editorial, luxury — deep blacks, controlled gold accents, a cinematic spotlight on the car and cast. AVOID a generic flat oversaturated rainbow collage; this must look expensive and distinctive. Spell EXACTLY: "GIVEAWAY", "WIN A FORD MUSTANG", "ALL-IN-ONE", "100 UNITS | 10 CASES | 10 STRAINS". No other text, no misspellings.`;

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
  const out=`AI Fruit VIdeos Muha/Master Case Designs/${stamp}_mastercase-front-v7c${i+1}.png`;
  fs.writeFileSync(out,Buffer.from(item.b64_json,"base64"));
  outs.push(out);console.log("✓ "+out);
});
console.log(outs.join("\n"));
