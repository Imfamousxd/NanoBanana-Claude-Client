#!/usr/bin/env node
// Ref-swap fixer: reproduce a CLEAN same-color sibling vial but change ONLY the product name to
// the target's name (keeps the sibling's already-correct volume, cap color, layout, clean bg).
// The proven fix for vials the model smudges on 100% of same-source draws.
//   env: REF (clean sibling image), OUT, FROM_NAME (sibling product name), TO_NAME (target name),
//        VOLUME (e.g. "10 ml", lowercase)
import fs from "fs";
for (const line of fs.readFileSync(".env","utf-8").split("\n")){const m=line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);if(m&&!process.env[m[1]])process.env[m[1]]=m[2];}
const KEY=process.env.GEMINI_API_KEY, MODEL="gemini-3-pro-image-preview";
const { REF, OUT, FROM_NAME, TO_NAME, VOLUME } = process.env;
const RATIO="3:4";
function readRetry(p,t=5){let e;for(let i=1;i<=t;i++){try{return fs.readFileSync(p);}catch(x){e=x;const end=Date.now()+800*i;while(Date.now()<end){}}}throw e;}
function writeRetry(p,b,t=5){let e;for(let i=1;i<=t;i++){try{fs.writeFileSync(p,b);return;}catch(x){e=x;const end=Date.now()+800*i;while(Date.now()<end){}}}throw e;}
const b64=readRetry(REF).toString("base64");
const PROMPT=`The reference image is an APPROVED Noble Harbor Wholesale amber vial product shot for "${FROM_NAME}". Reproduce it EXACTLY as a photo retouch — the SAME amber glass vial, the same crimped cap and its exact color, the same white label design and layout, the same charcoal-grey text style, the same volume text "${VOLUME}", the same solid bottom accent bar and its color, the same pure #FFFFFF seamless background, and the SAME camera framing, zoom, crop, and vial scale.
Change ONLY the product name printed on the label from "${FROM_NAME}" to "${TO_NAME}". Keep it in the same charcoal-grey medical sans-serif, same weight, same centered position; if the new name is longer, wrap it naturally onto two lines exactly like other Noble Harbor labels. Keep the volume exactly "${VOLUME}" in LOWERCASE (lowercase m, lowercase l — never "mL").
Everything else must be pixel-for-pixel identical.
Negative: do NOT change the vial, cap, colors, label layout, volume, framing, zoom, or crop; do NOT add any background marks, smudges, shadows, or texture — keep the background pure clean #FFFFFF; change no text other than the product name; no uppercase "mL".`;
const body={contents:[{parts:[{inline_data:{mime_type:"image/jpeg",data:b64}},{text:PROMPT}]}],generationConfig:{responseModalities:["TEXT","IMAGE"],imageConfig:{aspectRatio:RATIO,imageSize:"4K"}}};
const ac=new AbortController(); const timer=setTimeout(()=>ac.abort(),150000);
try{
  const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,{method:"POST",headers:{"x-goog-api-key":KEY,"Content-Type":"application/json"},body:JSON.stringify(body),signal:ac.signal});
  if(!r.ok){console.error(`HTTP ${r.status}: ${(await r.text()).slice(0,160)}`);process.exit(1);}
  const d=await r.json();
  for(const p of d?.candidates?.[0]?.content?.parts||[]) if(p.inlineData){writeRetry(OUT,Buffer.from(p.inlineData.data,"base64"));console.log("✓ "+OUT);process.exit(0);}
  console.error("no image");process.exit(1);
}catch(e){console.error(ac.signal.aborted?"timeout":String(e).slice(0,160));process.exit(1);}
finally{clearTimeout(timer);}
