import fs from "fs";
for (const line of fs.readFileSync(".env","utf-8").split("\n")){const m=line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);if(m&&!process.env[m[1]])process.env[m[1]]=m[2];}
const TPL="AI Fruit VIdeos Muha/refs/master case.png";
const FRUIT="AI Fruit VIdeos Muha/Master Case Designs/2026-05-31T05-20-34_muha-mastercase-v21c1-FRONT.png";
const PROMPT=`Print-ready MASTER CASE box design for the Muha Members "AI fruit" giveaway — a PREMIUM, CINEMATIC, EDITORIAL design (NOT a bland, generic, oversaturated rainbow collage).

TEMPLATE / DIELINE LOCK — reference image 1 is the EXACT box dieline; keep its structure 100% identical for print: full unfolded box with every fold flap and crease line in the same positions; the TOP flap with the upside-down small text "Muha Meds is a spiritual wellness movement providing alternative medicine, for an enhanced quality of life"; the two narrow SIDE flaps; gold filigree corner frames; the gold "ALL-IN-ONE" band across the bottom with "100 UNITS | 10 CASES | 10 STRAINS"; the "Members" logo (blue scallop-check + ornate gold M + "embers" + ®) at the top; and "SCAN TO ENTER" with a QR code.

FRONT-PANEL DESIGN — REDESIGN the hero art (do NOT copy the bright collage of reference 2 — use reference 2 ONLY as the source for the 10 fruit-drama characters' likenesses). New art direction:
- A DARK, MOODY, PREMIUM background: deep midnight-navy-to-charcoal with subtle gold Art-Deco filigree, a soft radial spotlight and cinematic vignette. RESTRAINED color overall — let the characters' own colors pop against the dark ground instead of a busy rainbow.
- A sleek BLACK FORD MUSTANG sports car as the clear HERO, dramatically lit at a low cinematic three-quarter angle.
- The 10 glossy Pixar-3D Muha fruit-drama characters arranged as a deliberate, SPOTLIT "cast lineup" flanking and behind the Mustang (like a premium movie/Love-Island cast poster) — composed and balanced, not piled up.
- Bold, confident GOLD cinematic typography with strong hierarchy and breathing room: "GIVEAWAY" then "WIN A FORD MUSTANG".
- The gold MM winged coin as a clean emblem. Sophisticated, distinctive, high-end packaging — editorial and premium.

Spell exactly: "GIVEAWAY", "WIN A FORD MUSTANG", "ALL-IN-ONE", "100 UNITS | 10 CASES | 10 STRAINS", "Members". Keep the dieline, flaps, crease lines and bands exactly as reference 1; do not crop or reshape the box. Tone DOWN the saturation versus reference 2.`;
const form=new FormData();form.append("model","gpt-image-2");form.append("prompt",PROMPT);form.append("size","1024x1024");form.append("quality","high");form.append("n","1");
form.append("image[]",new Blob([fs.readFileSync(TPL)],{type:"image/png"}),"template.png");
form.append("image[]",new Blob([fs.readFileSync(FRUIT)],{type:"image/png"}),"fruit-chars.png");
const res=await fetch("https://api.openai.com/v1/images/edits",{method:"POST",headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`},body:form});
if(!res.ok){console.error("HTTP",res.status,(await res.text()).slice(0,300));process.exit(1);}
const item=((await res.json()).data||[])[0];if(!item?.b64_json){console.error("no image");process.exit(1);}
const stamp=new Date().toISOString().replace(/[:.]/g,"-").slice(0,19);
const out=`AI Fruit VIdeos Muha/Master Case Designs/${stamp}_mastercase-fruit-mustang-v2.png`;
fs.writeFileSync(out,Buffer.from(item.b64_json,"base64"));console.log("✓ "+out);
