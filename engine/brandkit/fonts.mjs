import fs from "node:fs";
import path from "node:path";
import { EngineError } from "../core/errors.mjs";
import { sha256Text } from "../core/files.mjs";

// A @import from Google Fonts inside a headless screenshot is a race: it renders in a fallback
// often enough to poison a whole batch. So the families are downloaded once, base64-inlined into a
// single stylesheet, and cached. After the first bundle nothing here touches the network.

const CACHE_DIRECTORY = path.join(".content-engine", "fonts");
// The css2 endpoint serves woff2 only to a browser-shaped UA; anything else gets legacy truetype.
const BROWSER_UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

export function fontCachePath(root, brandId, css2Url) {
  return path.join(root, CACHE_DIRECTORY, `${brandId}.${sha256Text(css2Url).slice(0, 12)}.css`);
}

async function get(url, as) {
  const response = await fetch(url, { headers: { "User-Agent": BROWSER_UA } });
  if (!response.ok) {
    throw new EngineError("FONT_FETCH_FAILED", `Font request failed (${response.status}) for ${url}`);
  }
  return as === "buffer" ? Buffer.from(await response.arrayBuffer()) : response.text();
}

/**
 * Download every @font-face source referenced by a Google Fonts css2 URL and inline it as a data
 * URI. Returns the stylesheet text.
 */
/**
 * css2 returns one @font-face per subset per weight — cyrillic, greek and vietnamese included.
 * Dropping the subsets these brands never set cuts the inlined bundle by roughly two thirds, which
 * Chrome has to parse on every single render.
 */
function keepSubsets(sheet, keep) {
  const blocks = sheet.split(/(?=\/\*\s*[a-z-]+\s*\*\/)/g);
  return blocks.filter((block) => {
    const subset = block.match(/^\/\*\s*([a-z-]+)\s*\*\//)?.[1];
    return !subset || keep.includes(subset);
  }).join("");
}

export async function bundleFonts(root, brandId, css2Url, { subsets = ["latin", "latin-ext"] } = {}) {
  let sheet = keepSubsets(await get(css2Url, "text"), subsets);
  const urls = [...new Set([...sheet.matchAll(/url\((https:\/\/[^)]+)\)/g)].map((match) => match[1]))];
  if (!urls.length) {
    throw new EngineError("FONT_BUNDLE_EMPTY", `No font sources found at ${css2Url}.`);
  }

  const inlined = new Map();
  for (const url of urls) {
    const buffer = await get(url, "buffer");
    const format = url.endsWith(".woff2") ? "font/woff2" : url.endsWith(".woff") ? "font/woff" : "font/ttf";
    inlined.set(url, `data:${format};base64,${buffer.toString("base64")}`);
  }
  for (const [url, dataUri] of inlined) sheet = sheet.split(url).join(dataUri);

  const outputPath = fontCachePath(root, brandId, css2Url);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, sheet);
  return { path: outputPath, css: sheet, families: urls.length, bytes: Buffer.byteLength(sheet) };
}

/**
 * Return the cached stylesheet, bundling it first if absent. Set `offline` to fail fast with an
 * actionable message instead of reaching for the network mid-render.
 */
export async function loadFontCss(root, brandId, css2Url, { offline = false } = {}) {
  const cached = fontCachePath(root, brandId, css2Url);
  if (fs.existsSync(cached)) return fs.readFileSync(cached, "utf8");
  if (offline) {
    throw new EngineError("FONT_BUNDLE_MISSING", `No font bundle for ${brandId}. Run: npm run content -- brandkit fonts ${brandId}`, { expected: cached });
  }
  return (await bundleFonts(root, brandId, css2Url)).css;
}

/** CSS custom properties so a template never has to repeat a font stack. */
export function fontStackCss(families, fallbacks = {}) {
  return Object.values(families)
    .map(({ name }) => `--font-${name.toLowerCase().replace(/\s+/g, "-")}: '${name}', ${fallbacks[name] || "sans-serif"};`)
    .join("\n  ");
}
