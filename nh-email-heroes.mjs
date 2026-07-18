import fs from "fs";
for (const line of fs.readFileSync(".env","utf-8").split("\n")){const m=line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);if(m&&!process.env[m[1]])process.env[m[1]]=m[2];}
const W="Noble Harbor Wholesale";
const OUT="email_campaigns/noble_harbor/wholesale_outreach/assets";
const KEEP="Use ONLY the vial design from the reference image(s): clear glass vial, white Noble Harbor label with black text exactly as shown, colored flip-cap. Reproduce label text faithfully (compound name large; fine print may soften). Bright clinical editorial photography, soft daylight, white/neutral lab environment, shallow depth of field, muted navy-slate accents. No people, no hands, no extra text or logos, no watermarks.";
const JOBS=[
 {out:"gen_hero01.png", size:"1536x1024",
  refs:[`${W}/BPC-157/10mg/BPC-157_10mg_3ml_navy.jpg`,`${W}/BPC-157/10mg/BPC-157_10mg_3ml_green.jpg`,`${W}/BPC-157/10mg/BPC-157_10mg_3ml_red.jpg`,`${W}/BPC-157/10mg/BPC-157_10mg_3ml_black.jpg`,`${W}/BPC-157/10mg/BPC-157_10mg_3ml_babyblue.jpg`],
  prompt:"A precise row of five of these exact BPC-157 vials — navy, green, red, black and baby-blue caps from the reference images — standing in a line on a white laboratory bench, photographed straight-on at eye level with soft studio daylight, gentle real shadows, a blurred bright lab background. Premium pharmaceutical catalog photography. "+KEEP},
 {out:"gen_hero02.png", size:"1536x1024",
  refs:[`${W}/GHK-Cu/100mg/GHK-Cu_100mg_3ml_green.jpg`],
  prompt:"This exact GHK-Cu vial from the reference image standing on a stainless lab tray beside loose lyophilized-powder sample dishes and a glass flask, macro editorial shot, shallow depth of field, bright clinical daylight through a window, laboratory bokeh background. "+KEEP},
 {out:"gen_hero03.png", size:"1536x1024",
  refs:[`${W}/BPC-157/10mg/BPC-157_10mg_3ml_navy.jpg`,`${W}/NAD+/500mg/NAD+_500mg_3ml_babyblue.jpg`,`${W}/GHK-Cu/100mg/GHK-Cu_100mg_3ml_green.jpg`],
  prompt:"Dozens of these exact reference vials with mixed navy, green and baby-blue caps arranged in neat production rows on a stainless steel tray in a bright fill-finish lab, photographed at a low three-quarter angle with shallow focus on the front vial, evoking a white-label production run ready to ship. "+KEEP},
];
async function gen(j){
  const form=new FormData();
  form.append("model","gpt-image-2");
  form.append("prompt",j.prompt);
  form.append("size",j.size);
  form.append("quality","high");
  form.append("n","1");
  for(const r of j.refs) form.append("image[]",new Blob([fs.readFileSync(r)],{type:"image/jpeg"}),r.split("/").pop());
  const res=await fetch("https://api.openai.com/v1/images/edits",{method:"POST",headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`},body:form});
  if(!res.ok){console.log(j.out,"API",res.status,(await res.text()).slice(0,200));return;}
  const d=(await res.json()).data||[];
  if(!d[0]?.b64_json){console.log(j.out,"no image");return;}
  fs.writeFileSync(`${OUT}/${j.out}`,Buffer.from(d[0].b64_json,"base64"));
  console.log("SAVED",j.out);
}
await Promise.all(JOBS.map(gen)); console.log("DONE");
