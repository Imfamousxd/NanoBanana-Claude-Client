import fs from "fs";
import { execSync } from "child_process";
for (const line of fs.readFileSync(".env","utf-8").split("\n")){const m=line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);if(m&&!process.env[m[1]])process.env[m[1]]=m[2];}

const BASE="AI Fruit VIdeos Muha/Master Case Designs/2026-06-09T06-04-20_mastercase-wholesale-cast-v7-c1.png";
const KEY="AI Fruit VIdeos Muha/refs/mustang key.jpg";

const PROMPT=`Here is an approved Muha Members giveaway poster (reference image 1). Reproduce it EXACTLY — identical Members logo at top, identical "GIVEAWAY" / "WIN A FORD MUSTANG" headline, identical black Ford Mustang on the glowing stage, identical vibrant fruit-world background, and ALL 10 characters identical in their exact positions, poses, faces, outfits and colors.

THE ONE AND ONLY CHANGE: the WATERMELON BUBBLEGUM character — the one with a green watermelon head and a pink bubblegum quiff, blowing a pink bubble, standing front-and-center just behind the car — is currently making a PEACE SIGN with his raised hand. Replace that peace sign: instead he is HOLDING UP a black Ford Mustang KEY FOB (reference image 2 — a black smart key fob with the chrome running-horse Mustang pony emblem) in that same raised hand, gripping it and showing it off proudly. His hand now clearly holds the key fob and is NOT making a peace sign. Keep his watermelon head, pink bubble, jacket, and body position exactly the same.

Change NOTHING else — every other character, the black Mustang, the headline, the Members logo, and the background all stay exactly the same. Same Pixar / Cinema-4D / Octane 3D style, same 2:3 portrait poster.`;

const form=new FormData();
form.append("model","gpt-image-2");form.append("prompt",PROMPT);form.append("size","1024x1536");form.append("quality","high");form.append("n","2");
form.append("image[]",new Blob([fs.readFileSync(BASE)],{type:"image/png"}),"base.png");
form.append("image[]",new Blob([fs.readFileSync(KEY)],{type:"image/jpeg"}),"mustang-key.jpg");

const res=await fetch("https://api.openai.com/v1/images/edits",{method:"POST",headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`},body:form});
if(!res.ok){console.error("HTTP",res.status,(await res.text()).slice(0,400));process.exit(1);}
const data=((await res.json()).data||[]);
if(!data.length){console.error("no image");process.exit(1);}
const stamp=new Date().toISOString().replace(/[:.]/g,"-").slice(0,19);
const outs=[];
data.forEach((item,i)=>{if(!item?.b64_json)return;const out=`AI Fruit VIdeos Muha/Master Case Designs/${stamp}_mastercase-v7-watermelon-key-c${i+1}.png`;fs.writeFileSync(out,Buffer.from(item.b64_json,"base64"));console.log("✓ "+out);outs.push(out);});
console.log("\nDone — "+outs.length);
if(outs.length){try{execSync(`open -a Preview ${outs.map(r=>`"${r}"`).join(" ")}`);}catch{}}
