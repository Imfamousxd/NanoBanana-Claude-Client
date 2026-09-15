import fs from "node:fs";
import path from "node:path";
import { screenshot } from "../brandkit/chrome.mjs";
import { mimeForPath, resolveInside, sha256File, slugify, writeJsonAtomic } from "../core/files.mjs";

const escape = value => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

/** Preserve the entire selected image; compose exact copy outside its pixels. */
export async function renderMemeCard({ root, imagePath, outputDirectory, basename, caption = "", disclosure = "21+", width = 1080, height = 1350 }) {
  const source = resolveInside(root, imagePath, "imagePath");
  const directory = resolveInside(root, outputDirectory, "outputDirectory");
  fs.mkdirSync(directory, { recursive: true });
  const name = slugify(basename);
  const mime = mimeForPath(source);
  const data = `data:${mime};base64,${fs.readFileSync(source).toString("base64")}`;
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  *{box-sizing:border-box}html,body{margin:0;width:${width}px;height:${height}px;overflow:hidden;background:#fff;color:#111;font-family:Arial,Helvetica,sans-serif}
  main{width:100%;height:100%;display:flex;flex-direction:column}
  header{flex:none;padding:42px 54px 32px;font-size:53px;line-height:1.12;font-weight:600;letter-spacing:-1.1px}
  .image{flex:1;min-height:0;display:flex;align-items:center;justify-content:center;background:${caption ? "#fff" : "#080808"}}
  img{display:block;width:100%;height:100%;object-fit:contain}
  footer{flex:none;height:52px;display:flex;align-items:center;justify-content:flex-end;padding:0 28px;font-size:22px;font-weight:600;color:#333;background:#fff}
  </style></head><body><main>${caption ? `<header>${escape(caption)}</header>` : ""}<div class="image"><img src="${data}" alt=""></div><footer>${escape(disclosure)}</footer></main></body></html>`;
  const htmlPath = path.join(directory, `${name}.html`);
  const pngPath = path.join(directory, `${name}.png`);
  fs.writeFileSync(htmlPath, html);
  await screenshot(html, pngPath, { width, height });
  const outputs = [pngPath].map(p => ({ path: path.relative(root, p), sha256: sha256File(p) }));
  writeJsonAtomic(path.join(directory, `${name}.export.json`), {
    schema: "meme-card-export/1", createdAt: new Date().toISOString(),
    input: { path: imagePath, sha256: sha256File(source) },
    renderer: "deterministic-html-chrome", width, height, crop: "none",
    exactCopy: { caption: caption || null, disclosure }, outputs,
    review: "pending-final-visual-inspection", publicationApproved: false,
  });
  return { pngPath, htmlPath, outputs };
}
