import fs from "fs";
for (const line of fs.readFileSync(".env","utf-8").split("\n")){const m=line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);if(m&&!process.env[m[1]])process.env[m[1]]=m[2];}

const CAST="AI Fruit VIdeos Muha/Group Truck Shot/2026-05-30T23-09-09_muha-group-truck-2x1.png"; // authoritative 10-character cast
const BASES=[
  {slug:"c1", src:"AI Fruit VIdeos Muha/Master Case Designs/2026-06-09T04-52-47_mastercase-wholesale-c1.png"},
  {slug:"c2", src:"AI Fruit VIdeos Muha/Master Case Designs/2026-06-09T04-55-19_mastercase-wholesale-c2.png"},
];

const PROMPT=`Reproduce this Muha Members wholesale giveaway poster (reference image 1) — KEEP its vibrant fruit-drama world background, the sleek black Ford Mustang hero on its lit stage, and the blue "GIVEAWAY" headline with white "WIN A FORD MUSTANG" beneath. Keep it clean: NO coin, NO badges, NO checkered band, NO unit-count text, NO QR code, NO "scan to enter", NO top nameplate box.

FIX THE CAST — this is the critical change. The characters must be EXACTLY the 10 UNIQUE fruit-drama characters shown in REFERENCE IMAGE 2 (the cast group photo): each of those 10 characters appears EXACTLY ONCE. There are 10 characters total — no more than 10. ABSOLUTELY NO DUPLICATES: do not repeat any face, do not clone any character, do not invent new characters or extra background characters. Match their exact likenesses from reference image 2 (the cotton-candy blue-pink girl, the blue scowling guy, the red crossed-arms character, the green laughing character, the watermelon-bubblegum girl, the purple guy, the blonde horned girl, the yellow girl, the floral seated girl, the mint-green-haired girl). Arrange these 10 distinct characters as a balanced, deliberate cast lineup flanking and standing behind the Mustang — composed, not piled up.

Portrait 2:3 poster, vibrant, colorful, premium glossy 3D. Spell exactly "GIVEAWAY" and "WIN A FORD MUSTANG". Exactly 10 unique characters, zero duplicates.`;

const results=[];
for(const b of BASES){
  const form=new FormData();
  form.append("model","gpt-image-2");form.append("prompt",PROMPT);form.append("size","1024x1536");form.append("quality","high");form.append("n","1");
  form.append("image[]",new Blob([fs.readFileSync(b.src)],{type:"image/png"}),"base.png");
  form.append("image[]",new Blob([fs.readFileSync(CAST)],{type:"image/png"}),"cast10.png");
  const res=await fetch("https://api.openai.com/v1/images/edits",{method:"POST",headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`},body:form});
  if(!res.ok){console.error("HTTP",res.status,b.slug,(await res.text()).slice(0,300));continue;}
  const item=((await res.json()).data||[])[0];if(!item?.b64_json){console.error("no image",b.slug);continue;}
  const stamp=new Date().toISOString().replace(/[:.]/g,"-").slice(0,19);
  const out=`AI Fruit VIdeos Muha/Master Case Designs/${stamp}_mastercase-wholesale-fix10-${b.slug}.png`;
  fs.writeFileSync(out,Buffer.from(item.b64_json,"base64"));console.log("✓ "+out);results.push(out);
}
console.log("\nDone — "+results.length);
import{execSync}from"child_process";
if(results.length){try{execSync(`open -a Preview ${results.map(r=>`"${r}"`).join(" ")}`);}catch{}}
