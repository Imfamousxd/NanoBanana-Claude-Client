import fs from "fs";
for (const line of fs.readFileSync(".env","utf-8").split("\n")){const m=line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);if(m&&!process.env[m[1]])process.env[m[1]]=m[2];}
const TPL="AI Fruit VIdeos Muha/refs/master case.png";
const FRUIT="AI Fruit VIdeos Muha/Master Case Designs/2026-05-31T05-20-34_muha-mastercase-v21c1-FRONT.png";
const PROMPT=`Print-ready MASTER CASE box design for the Muha Members "AI fruit" giveaway. 

TEMPLATE / DIELINE LOCK — reference image 1 is the EXACT master-case box dieline. Keep its structure 100% identical for print: the full unfolded box shape with every fold flap and crease line in the same positions; the TOP flap with the upside-down small text "Muha Meds is a spiritual wellness movement providing alternative medicine, for an enhanced quality of life"; the two narrow SIDE flaps; the gold filigree corner frames; the gold "ALL-IN-ONE" band across the bottom with "100 UNITS | 10 CASES | 10 STRAINS"; the "Members" logo (blue scallop-check + ornate gold M + "embers" + ®) at the top of the front panel; and the "SCAN TO ENTER" text with a QR code. Same proportions and layout.

FRONT-PANEL ARTWORK — replace ONLY the central hero art with our fruit-drama giveaway design in the vibrant colorful style of reference image 2: a lush, saturated fruit-world scene with ALL 10 glossy Pixar-3D Muha fruit-drama characters gathered around the prize — a sleek BLACK FORD MUSTANG sports car (NOT a truck). Big bold headline "GIVEAWAY" with "WIN A FORD MUSTANG" beneath it. The gold MM winged coin centered low on the panel. Keep the colorful premium fruit aesthetic of reference 2.

Spell exactly: "GIVEAWAY", "WIN A FORD MUSTANG", "ALL-IN-ONE", "100 UNITS | 10 CASES | 10 STRAINS", "Members". NO misspellings, no extra words. Keep the dieline, flaps, crease lines and bands exactly as reference 1 — do not crop or reshape the box.`;
const form=new FormData();form.append("model","gpt-image-2");form.append("prompt",PROMPT);form.append("size","1024x1024");form.append("quality","high");form.append("n","1");
form.append("image[]",new Blob([fs.readFileSync(TPL)],{type:"image/png"}),"template.png");
form.append("image[]",new Blob([fs.readFileSync(FRUIT)],{type:"image/png"}),"fruit-front.png");
const res=await fetch("https://api.openai.com/v1/images/edits",{method:"POST",headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`},body:form});
if(!res.ok){console.error("HTTP",res.status,(await res.text()).slice(0,300));process.exit(1);}
const item=((await res.json()).data||[])[0];if(!item?.b64_json){console.error("no image");process.exit(1);}
const stamp=new Date().toISOString().replace(/[:.]/g,"-").slice(0,19);
const out=`AI Fruit VIdeos Muha/Master Case Designs/${stamp}_mastercase-fruit-mustang-v1.png`;
fs.writeFileSync(out,Buffer.from(item.b64_json,"base64"));console.log("✓ "+out);
