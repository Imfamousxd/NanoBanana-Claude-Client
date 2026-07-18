import fs from "fs";
for (const line of fs.readFileSync(".env","utf-8").split("\n")){const m=line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);if(m&&!process.env[m[1]])process.env[m[1]]=m[2];}
const A="email_campaigns/noble_harbor/wholesale_outreach/assets";
const PROMPT="Reproduce this image EXACTLY — same vials, same label text, same composition, shadows and reflections — with exactly two changes: (1) make the entire background pure flat white #FFFFFF with no grey gradient at all, keeping only the soft natural contact shadow and faint reflection directly beneath the vials, fading cleanly into pure white; (2) on the blank upper band of each vial label, add a small light-grey dashed-outline rectangle containing the words YOUR LOGO HERE in small light-grey capital letters, like a white-label mockup placeholder. Spell it exactly Y-O-U-R L-O-G-O H-E-R-E on every label. No other changes, no other new text, no misspellings, no watermarks.";
const JOBS=[["gen2_hero01.png","gen3_hero01.png"],["gen2_hero02.png","gen3_hero02.png"],["gen2_hero03.png","gen3_hero03.png"]];
async function gen([src,out]){
  const form=new FormData();
  form.append("model","gpt-image-2");form.append("prompt",PROMPT);form.append("size","1536x1024");form.append("quality","high");form.append("n","1");
  form.append("image[]",new Blob([fs.readFileSync(`${A}/${src}`)],{type:"image/png"}),src);
  const res=await fetch("https://api.openai.com/v1/images/edits",{method:"POST",headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`},body:form});
  if(!res.ok){console.log(out,"API",res.status,(await res.text()).slice(0,150));return;}
  const d=(await res.json()).data||[];
  if(!d[0]?.b64_json){console.log(out,"none");return;}
  fs.writeFileSync(`${A}/${out}`,Buffer.from(d[0].b64_json,"base64"));console.log("SAVED",out);
}
await Promise.all(JOBS.map(gen));console.log("DONE");
