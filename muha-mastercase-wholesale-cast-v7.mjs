import fs from "fs";
import { execSync } from "child_process";
for (const line of fs.readFileSync(".env","utf-8").split("\n")){const m=line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);if(m&&!process.env[m[1]])process.env[m[1]]=m[2];}

const DIR="AI Fruit VIdeos Muha/Generated Characters/_small";
const CHARS=[
  "Blue Slushie.jpg","Arctic Blueberry.jpg","Frozen Pomegranate.jpg","Galactic Diesel.jpg","Guava Mango.jpg",
  "Horchata.jpg","Lemon Cherry Fizz.jpg","Watermelon Bubblegum.jpg","Aloha Passion Rush.jpg","Frosted Mint Cookies.jpg",
];
const MUSTANG="AI Fruit VIdeos Muha/refs/mustang key.jpg";
const LOGO="AI Fruit VIdeos Muha/refs/MMembers Logo.png";

const PROMPT=`Create a PREMIUM portrait poster (2:3) for the Muha Members "AI Fruit" Ford Mustang giveaway — vibrant glossy Pixar/Cinema-4D 3D, a lush colorful FRUIT-DRAMA world background. FULL-BLEED: the artwork fills the ENTIRE poster edge to edge. Do NOT add any empty band, blank strip, or letterbox, and do NOT shrink or push the composition down.

TOP-DOWN LAYOUT:
- At the VERY TOP, centered: faithfully REPRODUCE the official "Members" brand logo shown in REFERENCE IMAGE 12 — the gold "Members" wordmark (an ornate gold "M" joined to "embers") sitting next to a blue scalloped CHECKMARK badge. Copy that logo EXACTLY as in the reference (same gold wordmark + blue check badge); do NOT redesign, restyle, recolor, simplify, or replace it. Render it small and clean as the brand mark at the top, sitting over the fruit-world background.
- Just below the logo: the bold "GIVEAWAY" headline in vivid BLUE, with "WIN A FORD MUSTANG" in clean WHITE directly beneath. Spell both exactly.
- CENTER: a sleek BLACK FORD MUSTANG sports car (reference image 11) on a glossy lit stage, low cinematic three-quarter angle, with the 10 characters as a balanced cast lineup flanking and standing behind it, filling the frame (keep the cast and car LARGE).
- BOTTOM: keep it CLEAN — the fruit-world background and the Mustang's glossy stage fill the lower area. NO "MASTER CASE" text, NO "ALL-IN-ONE" text, NO tagline at the bottom, NO QR code, NO barcode, nothing in the corners.

THE CAST — critical. EXACTLY 10 UNIQUE characters, each appearing EXACTLY ONCE. NO DUPLICATES, no clones, no repeated faces, no extra/background characters, never merge two into one. Reference images 1-10 are the ten characters — use ONLY their likenesses (IGNORE the text banners/backgrounds in those refs). Every fruit-headed character's HEAD IS THE ACTUAL FRUIT/ITEM with cartoon features — do NOT turn them into ordinary human heads. The ten, in order:
1. BLUE SLUSHIE — girl, frosty blue skin, pink-and-blue cotton-candy hair in two side buns, white cat-ear headphones, pink/blue cheer crop-top.
2. ARCTIC BLUEBERRY — guy whose HEAD IS A LITERAL ROUND BLUEBERRY (deep blue-purple, frosted, tiny green leaf crown on top) — NOT a human head; chill half-lidded eyes; light-blue hoodie with a silver cuban-link chain.
3. FROZEN POMEGRANATE — muscular guy with a round RED POMEGRANATE head (little crown stem) and an angry scowl, red tank top, big crossed arms.
4. GALACTIC DIESEL — guy whose HEAD is a purple COSMIC PLANET with a Saturn-style ring around it, green eyes, smirk, dark purple leather jacket.
5. GUAVA MANGO — guy with a MANGO head (split green/yellow/pink) and green leafy hair, mouth wide open laughing, coral shirt over yellow tee.
6. HORCHATA — girl with a creamy HORCHATA-swirl head, cinnamon-stick spiral curls and a red rose, red flamenco ruffled dress, dancer pose.
7. LEMON CHERRY FIZZ — girl with a LEMON head and green leaf hair, round glasses, cherry earrings, red vest over yellow blouse, bookish, holding a book.
8. WATERMELON BUBBLEGUM — guy with a WATERMELON head and a pink bubblegum quiff, blowing a pink bubble, green bomber jacket over pink.
9. ALOHA PASSION RUSH — girl with a tropical mango/passion-fruit face, green palm-leaf hair with pink hibiscus flowers, sultry eyes and red lips, floral tropical tie-top.
10. FROSTED MINT COOKIES — girl with a CHOCOLATE-CHIP-COOKIE face, mint-leaf hair with blue frosting on top, sweet smile, cozy cookie-print sweater.

Exactly these 10, each once, zero duplicates. Vibrant, premium, colorful, full-bleed. The only text/marks are: the Members logo (from ref 12), "GIVEAWAY", "WIN A FORD MUSTANG". NO "MASTER CASE", NO "ALL-IN-ONE", NO QR, no other text. Spell everything exactly.`;

const form=new FormData();
form.append("model","gpt-image-2");form.append("prompt",PROMPT);form.append("size","1024x1536");form.append("quality","high");form.append("n","2");
CHARS.forEach((c,i)=>form.append("image[]",new Blob([fs.readFileSync(`${DIR}/${c}`)],{type:"image/jpeg"}),`char${i+1}.jpg`));
form.append("image[]",new Blob([fs.readFileSync(MUSTANG)],{type:"image/jpeg"}),"mustang.jpg");
form.append("image[]",new Blob([fs.readFileSync(LOGO)],{type:"image/png"}),"members-logo.png");

const res=await fetch("https://api.openai.com/v1/images/edits",{method:"POST",headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`},body:form});
if(!res.ok){console.error("HTTP",res.status,(await res.text()).slice(0,400));process.exit(1);}
const data=((await res.json()).data||[]);
if(!data.length){console.error("no image");process.exit(1);}
const stamp=new Date().toISOString().replace(/[:.]/g,"-").slice(0,19);
const outs=[];
data.forEach((item,i)=>{if(!item?.b64_json)return;const out=`AI Fruit VIdeos Muha/Master Case Designs/${stamp}_mastercase-wholesale-cast-v7-c${i+1}.png`;fs.writeFileSync(out,Buffer.from(item.b64_json,"base64"));console.log("✓ "+out);outs.push(out);});
console.log("\nDone — "+outs.length);
if(outs.length){try{execSync(`open -a Preview ${outs.map(r=>`"${r}"`).join(" ")}`);}catch{}}
