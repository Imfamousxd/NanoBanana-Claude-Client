// Asset gallery — a single self-contained HTML page of every catalogued asset per brand, with
// thumbnails, role/product filters, search, and click-to-open. Built into .content-engine/gallery/
// (rebuildable, untracked) so anyone with a checkout runs `npm run assets:gallery` and gets the same
// browser. Thumbnails are cached by content hash of the path + mtime.
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { buildAssetCatalog } from "./catalog.mjs";

const THUMB_WIDTH = 360;

function thumbName(item) {
  const stat = fs.statSync(item.absolutePath);
  return `${crypto.createHash("sha1").update(`${item.path}:${stat.mtimeMs}:${stat.size}`).digest("hex")}.jpg`;
}

async function makeThumbs(root, items, thumbsDir, { concurrency = 4, onProgress = () => {} } = {}) {
  fs.mkdirSync(thumbsDir, { recursive: true });
  const { default: sharp } = await import("sharp");
  const queue = items.filter((item) => item.exists && item.kind === "image");
  let done = 0;
  const failures = [];
  const worker = async () => {
    while (queue.length) {
      const item = queue.shift();
      try {
        const name = thumbName(item);
        const target = path.join(thumbsDir, name);
        if (!fs.existsSync(target)) {
          await sharp(item.absolutePath, { failOn: "none" }).rotate().resize({ width: THUMB_WIDTH, height: THUMB_WIDTH, fit: "inside", withoutEnlargement: true })
            .flatten({ background: "#f1f1f1" }).jpeg({ quality: 78 }).toFile(target);
        }
        item.thumb = `thumbs/${name}`;
      } catch (error) {
        failures.push({ path: item.path, error: error.message });
      }
      done += 1;
      onProgress(done, queue.length);
    }
  };
  await Promise.all(Array.from({ length: concurrency }, worker));
  return failures;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}

export async function buildGallery(root, graph, { brand = undefined, outDir = path.join(root, ".content-engine", "gallery"), thumbs = true, onProgress = undefined } = {}) {
  const catalog = buildAssetCatalog(root, graph, { brand });
  const thumbsDir = path.join(outDir, "thumbs");
  const failures = thumbs ? await makeThumbs(root, catalog.items, thumbsDir, { onProgress }) : [];
  const relativeRoot = path.relative(outDir, root) || ".";
  const items = catalog.items.map((item) => ({
    b: item.brand, bn: item.brandName, p: item.path, n: item.basename, k: item.kind, r: item.roles, pr: item.product, pn: item.productName,
    s: item.section, no: item.note, x: item.exists, t: item.tracked, ban: item.banned, th: item.thumb || null, o: item.origin, m: item.meta,
  }));
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Brand asset gallery</title>
<style>
:root{--bg:#f6f5f2;--card:#fff;--ink:#1c1c1a;--muted:#6b6b66;--line:#e4e2dc;--accent:#1f5eff;--warn:#b54708;--bad:#b42318}
*{box-sizing:border-box}body{margin:0;font:14px/1.45 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;background:var(--bg);color:var(--ink)}
header{position:sticky;top:0;z-index:5;background:#fff;border-bottom:1px solid var(--line);padding:12px 20px;display:flex;flex-wrap:wrap;gap:10px;align-items:center}
header h1{font-size:16px;margin:0 16px 0 0;font-weight:600}
.tabs{display:flex;flex-wrap:wrap;gap:6px}.tab{padding:6px 12px;border:1px solid var(--line);border-radius:999px;background:#fff;cursor:pointer;font-size:13px}
.tab.on{background:var(--ink);color:#fff;border-color:var(--ink)}
input[type=search]{flex:1;min-width:220px;padding:8px 12px;border:1px solid var(--line);border-radius:8px;font-size:14px}
select{padding:7px 10px;border:1px solid var(--line);border-radius:8px;background:#fff;font-size:13px}
label.chk{font-size:13px;color:var(--muted);display:flex;gap:6px;align-items:center}
main{padding:16px 20px 60px}
.summary{color:var(--muted);font-size:13px;margin:0 0 12px}
.group{margin:0 0 28px}.group h2{font-size:14px;font-weight:600;margin:0 0 10px;padding-bottom:6px;border-bottom:1px solid var(--line);display:flex;gap:10px;align-items:baseline}
.group h2 small{color:var(--muted);font-weight:400}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px}
.card{background:var(--card);border:1px solid var(--line);border-radius:10px;overflow:hidden;display:flex;flex-direction:column;min-width:0}
.card.missing{opacity:.55}.card.banned{outline:2px solid var(--bad)}
.thumb{aspect-ratio:1;background:repeating-conic-gradient(#eee 0 25%,#fff 0 50%) 50%/16px 16px;display:flex;align-items:center;justify-content:center;overflow:hidden}
.thumb img{max-width:100%;max-height:100%;object-fit:contain}.thumb span{color:var(--muted);font-size:12px;text-align:center;padding:12px}
.meta{padding:8px 10px;display:flex;flex-direction:column;gap:4px;font-size:12px}
.name{font-weight:600;word-break:break-all}.path{color:var(--muted);word-break:break-all;font-size:11px}
.badges{display:flex;flex-wrap:wrap;gap:4px}.badge{padding:1px 7px;border-radius:999px;background:#eef0f4;font-size:11px}
.badge.canonical{background:#e3efff;color:#1747b3}.badge.logo{background:#ece8ff;color:#4b2fb3}.badge.approved-output{background:#e3f7e8;color:#166534}.badge.style{background:#fff3e0;color:#9a4a00}.badge.banned{background:#fee4e2;color:var(--bad)}
.badge.local{background:#fff7e6;color:var(--warn)}.badge.tracked{background:#eef7ee;color:#166534}
.note{color:var(--muted);font-size:11px}
.actions{display:flex;gap:6px;margin-top:2px}.actions a,.actions button{font-size:11px;padding:3px 8px;border:1px solid var(--line);border-radius:6px;background:#fff;color:var(--ink);text-decoration:none;cursor:pointer}
.empty{color:var(--muted);padding:40px 0;text-align:center}
</style></head><body>
<header><h1>Brand asset gallery</h1><div class="tabs" id="tabs"></div><input id="q" type="search" placeholder="Search file, product, role, note…"><select id="role"><option value="">All roles</option></select><select id="product"><option value="">All products</option></select><label class="chk"><input type="checkbox" id="onlyDisk" checked> on this disk only</label><label class="chk"><input type="checkbox" id="showBanned"> show banned</label></header>
<main><p class="summary" id="summary"></p><div id="out"></div></main>
<script>
const ROOT=${JSON.stringify(relativeRoot)};const ITEMS=${JSON.stringify(items)};const BRANDS=${JSON.stringify(catalog.brands)};
const BUILT=${JSON.stringify(new Date().toISOString())};
const state={brand:BRANDS[0]?.id||"",q:"",role:"",product:"",onlyDisk:true,showBanned:false};
const $=(s)=>document.querySelector(s);const esc=(v)=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function fileUrl(p){return ROOT+"/"+p.split("/").map(encodeURIComponent).join("/")}
function renderTabs(){$("#tabs").innerHTML=BRANDS.map(b=>'<button class="tab'+(b.id===state.brand?" on":"")+'" data-b="'+esc(b.id)+'">'+esc(b.name)+' <small>'+ITEMS.filter(i=>i.b===b.id).length+'</small></button>').join("");}
function fillSelects(){const its=ITEMS.filter(i=>i.b===state.brand);const roles=[...new Set(its.flatMap(i=>i.r))].sort();$("#role").innerHTML='<option value="">All roles</option>'+roles.map(r=>'<option'+(r===state.role?" selected":"")+'>'+esc(r)+'</option>').join("");
const prods=[...new Map(its.filter(i=>i.pr).map(i=>[i.pr,i.pn||i.pr])).entries()].sort((a,b)=>a[1].localeCompare(b[1]));$("#product").innerHTML='<option value="">All products</option>'+prods.map(([k,n])=>'<option value="'+esc(k)+'"'+(k===state.product?" selected":"")+'>'+esc(n)+'</option>').join("");}
function match(i){if(i.b!==state.brand)return false;if(state.onlyDisk&&!i.x)return false;if(i.ban&&!state.showBanned)return false;if(state.role&&!i.r.includes(state.role))return false;if(state.product&&i.pr!==state.product)return false;
if(state.q){const h=(i.p+" "+i.n+" "+i.r.join(" ")+" "+(i.pr||"")+" "+(i.pn||"")+" "+(i.no||"")+" "+(i.s||"")+" "+JSON.stringify(i.m||{})).toLowerCase();return state.q.toLowerCase().split(/\\s+/).filter(Boolean).every(t=>h.includes(t));}return true;}
function card(i){const badges=i.r.map(r=>'<span class="badge '+esc(r)+'">'+esc(r)+'</span>').join("")+(i.ban?'<span class="badge banned">BANNED</span>':'')+(i.t?'<span class="badge tracked">tracked</span>':'<span class="badge local">local-only</span>');
const th=i.th?'<img loading="lazy" src="'+esc(i.th)+'" alt="">':'<span>'+esc(i.k)+(i.x?"":" · not on disk")+'</span>';
return '<div class="card'+(i.x?"":" missing")+(i.ban?" banned":"")+'"><a class="thumb" href="'+esc(fileUrl(i.p))+'" target="_blank">'+th+'</a><div class="meta"><div class="name">'+esc(i.n)+'</div>'+(i.pn||i.pr?'<div>'+esc(i.pn||i.pr)+'</div>':'')+'<div class="badges">'+badges+'</div>'+(i.no?'<div class="note">'+esc(i.no)+'</div>':'')+'<div class="path">'+esc(i.p)+'</div><div class="actions"><button data-copy="'+esc(i.p)+'">copy path</button><a href="'+esc(fileUrl(i.p))+'" target="_blank">open</a></div></div></div>';}
function render(){renderTabs();fillSelects();const its=ITEMS.filter(match);const groups=new Map();for(const i of its){const g=i.pn||i.pr||i.s||"other";if(!groups.has(g))groups.set(g,[]);groups.get(g).push(i);}
const all=ITEMS.filter(i=>i.b===state.brand);$("#summary").textContent=its.length+" of "+all.length+" assets · "+all.filter(i=>i.x).length+" on this disk · "+all.filter(i=>i.t).length+" tracked in git · built "+BUILT.slice(0,16).replace("T"," ");
$("#out").innerHTML=its.length?[...groups.entries()].sort((a,b)=>a[0].localeCompare(b[0])).map(([g,list])=>'<section class="group"><h2>'+esc(g)+' <small>'+list.length+'</small></h2><div class="grid">'+list.map(card).join("")+'</div></section>').join(""):'<p class="empty">Nothing matches. Untick "on this disk only" to see registered assets that live on another machine.</p>';}
document.addEventListener("click",e=>{const t=e.target.closest("[data-b]");if(t){state.brand=t.dataset.b;state.role="";state.product="";render();return;}const c=e.target.closest("[data-copy]");if(c){const v=c.dataset.copy;(navigator.clipboard?navigator.clipboard.writeText(v):Promise.reject()).then(()=>{c.textContent="copied";setTimeout(()=>c.textContent="copy path",1200)}).catch(()=>prompt("Copy the path:",v));}});
$("#q").addEventListener("input",e=>{state.q=e.target.value;render();});$("#role").addEventListener("change",e=>{state.role=e.target.value;render();});$("#product").addEventListener("change",e=>{state.product=e.target.value;render();});
$("#onlyDisk").addEventListener("change",e=>{state.onlyDisk=e.target.checked;render();});$("#showBanned").addEventListener("change",e=>{state.showBanned=e.target.checked;render();});
render();
</script></body></html>`;
  fs.mkdirSync(outDir, { recursive: true });
  const indexPath = path.join(outDir, "index.html");
  fs.writeFileSync(indexPath, html);
  return { indexPath, items: catalog.items.length, onDisk: catalog.items.filter((item) => item.exists).length, thumbnails: catalog.items.filter((item) => item.thumb).length, failures, brands: catalog.brands };
}
