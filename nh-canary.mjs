#!/usr/bin/env node
// Noble Harbor canary: reproduce an approved amber vial EXACTLY, change ONLY the volume text.
import fs from "fs";
for (const line of fs.readFileSync(".env","utf-8").split("\n")){const m=line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);if(m&&!process.env[m[1]])process.env[m[1]]=m[2];}
const KEY=process.env.GEMINI_API_KEY, MODEL="gemini-3-pro-image-preview";
const REF=process.env.REF, OUT=process.env.OUT, FROM=process.env.FROM, TO=process.env.TO, RATIO=process.env.RATIO||"3:4";
const b64=fs.readFileSync(REF).toString("base64");
const PROMPT=`The reference image is an APPROVED Noble Harbor Wholesale amber vial product shot. Reproduce it EXACTLY as a photo retouch — the SAME amber glass vial, the same crimped cap and its exact color, the same white label design and layout, the same product name and charcoal-grey text, the same solid bottom accent bar and its color, the same pure #FFFFFF seamless background, and the SAME camera framing, zoom, crop, and vial scale. Change ONLY the volume marking on the label from "${FROM}" to "${TO}". Everything else must be pixel-for-pixel identical.
Negative: do NOT change the vial, cap, label design, product name, colors, framing, zoom, or crop; do NOT add any background marks, smudges, shadows, or texture — keep the background pure clean #FFFFFF; change no text other than the volume.`;
const body={contents:[{parts:[{inline_data:{mime_type:"image/jpeg",data:b64}},{text:PROMPT}]}],generationConfig:{responseModalities:["TEXT","IMAGE"],imageConfig:{aspectRatio:RATIO,imageSize:"4K"}}};
const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,{method:"POST",headers:{"x-goog-api-key":KEY,"Content-Type":"application/json"},body:JSON.stringify(body)});
if(!r.ok){console.error(`HTTP ${r.status}: ${(await r.text()).slice(0,200)}`);process.exit(1);}
const d=await r.json();
for(const p of d?.candidates?.[0]?.content?.parts||[]) if(p.inlineData){fs.writeFileSync(OUT,Buffer.from(p.inlineData.data,"base64"));console.log("✓ "+OUT);process.exit(0);}
console.error("no image returned");process.exit(1);
