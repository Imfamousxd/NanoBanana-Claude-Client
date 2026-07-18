import fs from "fs";
for (const line of fs.readFileSync(".env","utf-8").split("\n")){const m=line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);if(m&&!process.env[m[1]])process.env[m[1]]=m[2];}
const W="Noble Harbor Wholesale";
const OUT="email_campaigns/noble_harbor/wholesale_outreach/assets";
const STYLE="Minimal premium pharmaceutical studio packshot: seamless bright white-to-pale-grey sweep background, one soft key light from upper left, realistic soft contact shadow under the glass, a faint subtle reflection on the glossy surface below. Nothing else in frame — no props, no lab equipment, no environment. Reproduce the reference vial EXACTLY: clear glass, white Noble Harbor label with its text as shown, colored flip-cap. No added text, no watermarks, no people.";
const JOBS=[
 {out:"gen2_hero01.png",size:"1536x1024",
  refs:["BPC-157/10mg/BPC-157_10mg_3ml_navy.jpg","BPC-157/10mg/BPC-157_10mg_3ml_green.jpg","BPC-157/10mg/BPC-157_10mg_3ml_red.jpg","BPC-157/10mg/BPC-157_10mg_3ml_black.jpg","BPC-157/10mg/BPC-157_10mg_3ml_babyblue.jpg"],
  prompt:"Five of these exact reference vials — navy, green, red, black and baby-blue caps — standing in one straight evenly-spaced row, photographed head-on at label height. "+STYLE},
 {out:"gen2_hero02.png",size:"1536x1024",
  refs:["GHK-Cu/100mg/GHK-Cu_100mg_3ml_green.jpg"],
  prompt:"This exact reference vial standing alone, slightly right of center, photographed head-on at label height with crisp focus on the label. "+STYLE},
 {out:"gen2_hero03.png",size:"1536x1024",
  refs:["BPC-157/10mg/BPC-157_10mg_3ml_navy.jpg","GHK-Cu/100mg/GHK-Cu_100mg_3ml_green.jpg","NAD+/500mg/NAD+_500mg_3ml_babyblue.jpg"],
  prompt:"These three exact reference vials — BPC-157 navy cap, GHK-Cu green cap, NAD+ baby-blue cap — standing in a tight group of three, the middle one a step forward, photographed head-on at label height. "+STYLE},
];
async function gen(j){
  const form=new FormData();
  form.append("model","gpt-image-2");form.append("prompt",j.prompt);form.append("size",j.size);form.append("quality","high");form.append("n","1");
  for(const r of j.refs) form.append("image[]",new Blob([fs.readFileSync(`${W}/${r}`)],{type:"image/jpeg"}),r.split("/").pop());
  const res=await fetch("https://api.openai.com/v1/images/edits",{method:"POST",headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`},body:form});
  if(!res.ok){console.log(j.out,"API",res.status,(await res.text()).slice(0,150));return;}
  const d=(await res.json()).data||[];
  if(!d[0]?.b64_json){console.log(j.out,"none");return;}
  fs.writeFileSync(`${OUT}/${j.out}`,Buffer.from(d[0].b64_json,"base64"));console.log("SAVED",j.out);
}
await Promise.all(JOBS.map(gen));console.log("DONE");
