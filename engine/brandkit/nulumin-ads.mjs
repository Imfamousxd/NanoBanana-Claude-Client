import path from "node:path";
import { EngineError } from "../core/errors.mjs";
import { screenshot } from "./chrome.mjs";
import { dataKeys } from "./kit.mjs";

// The three approved NuLumin static-ad formats. Layout law, rejection history and the reasoning
// behind every constraint live in knowledge/brands/nulumin/AD_SYSTEM.md — read it before changing
// anything here. All copy, color and product facts come from the brand pack; nothing is hardcoded.

export const FORMATS = ["single", "panel", "streak"];
export const RATIOS = { "9:16": [1080, 1920], "4:5": [1080, 1350], "1:1": [1080, 1080] };

const escapeHtml = (value) => String(value ?? "").replace(/[&<>"]/g, (character) => (
  { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[character]
));

// SVG fractalNoise grain. Part of the premium finish on dark layouts — without it the layout reads
// as a generic digital composition rather than something captured.
const GRAIN = "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/></filter><rect width='180' height='180' filter='url(%23n)' opacity='0.55'/></svg>\")";

function pickPoints(kit, keys) {
  return keys.map((key) => {
    const point = kit.points.points[key];
    if (!point) throw new EngineError("UNKNOWN_SELLING_POINT", `No selling point "${key}" in the NuLumin pack.`, { available: dataKeys(kit.points.points) });
    return { key, ...point };
  });
}

function resolveHook(kit, hookKey, subject) {
  const hook = kit.points.hooks[hookKey];
  if (!hook) throw new EngineError("UNKNOWN_HOOK", `No hook "${hookKey}" in the NuLumin pack.`, { available: dataKeys(kit.points.hooks) });
  return { ...hook, lines: hook.lines.map((line) => line.replace("{compound}", subject.name)) };
}

/** Resolve a compound key or a panel key into the single shape every format consumes. */
function resolveSubject(kit, { compound, panel }) {
  const { categories, compounds, panels } = kit.catalog;
  if (panel) {
    const entry = panels[panel];
    if (!entry) throw new EngineError("UNKNOWN_PANEL", `No panel "${panel}".`, { available: dataKeys(panels) });
    const members = entry.members.map((key) => compounds[key]);
    return {
      key: panel,
      name: entry.eyebrow,
      accent: categories[entry.category].accent,
      eyebrow: entry.eyebrow,
      cta: entry.cta,
      dose: null,
      vial: members[0]?.vial || null,
      isPanel: true,
    };
  }
  const entry = compounds[compound];
  if (!entry) throw new EngineError("UNKNOWN_COMPOUND", `No compound "${compound}".`, { available: dataKeys(compounds) });
  const category = categories[entry.category];
  return {
    key: compound,
    name: entry.name,
    accent: category.accent,
    eyebrow: category.eyebrow,
    cta: kit.points.ctas.product.replace("{compound}", entry.name),
    dose: entry.dose,
    vial: entry.vial,
    isPanel: false,
  };
}

// The font bundle is written beside the page rather than inlined: Chrome re-parses roughly two
// megabytes of base64 @font-face on every single render otherwise.
const FONT_FILE = "fonts.css";

const shell = (kit, width, height, background, body, css) => `<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="${FONT_FILE}"><style>
:root{ ${kit.fontVariables} }
*{margin:0;padding:0;box-sizing:border-box;-webkit-font-smoothing:antialiased}
html,body{width:${width}px;height:${height}px;overflow:hidden;background:${background};
  font-family:var(--font-inter)}
.stage{position:relative;width:100%;height:100%;overflow:hidden}
.band{display:flex;height:7px}.band i{flex:1}
${css}
</style></head><body><div class="stage">${body}</div></body></html>`;

const spectrumBand = (marketing) => marketing.spectrumBandOrder
  .map((key) => `<i style="background:${marketing.spectrum[key]}"></i>`).join("");

/**
 * `single` — light editorial (creative #1). The site's own page turned into an ad: cream
 * announcement bar, copy stacked top-left, vertical tick chips, product right-anchored so the
 * chips can never collide with it, violet pill CTA.
 */
function single({ kit, width, height, subject, points, accent, logo, vial, hookLines }) {
  const m = kit.design.surfaces.marketing;
  const d = kit.design.disclosures;
  const big = height > width;
  const pad = big ? 76 : 60;

  const chips = points.map((point) => `<li><span class="tick">✓</span><span class="ct">${escapeHtml(point.label)}${
    point.sub ? `<em>${escapeHtml(point.sub)}</em>` : ""}</span></li>`).join("");

  const body = `
  <div class="ann">${escapeHtml(d.ruo)}</div>
  <div class="band">${spectrumBand(m)}</div>
  <div class="wrap">
    <img class="logo" src="${logo}">
    <div class="eyerow"><span class="bar"></span><span class="eyebrow">${escapeHtml(subject.eyebrow)}</span></div>
    <h1>${escapeHtml(hookLines[0])}<em>${escapeHtml(hookLines[1])}</em></h1>
    <ul>${chips}</ul>
  </div>
  ${vial ? `<div class="prod"><div class="halo"></div><div class="floor"></div><img class="vial" src="${vial}"></div>` : ""}
  <div class="cta">${escapeHtml(subject.cta)}</div>
  ${subject.dose ? `<div class="dose"><b>${escapeHtml(subject.dose)}</b><span>Lyophilized</span></div>` : ""}
  <div class="legal">${escapeHtml(d.fdaLong)}</div>`;

  const css = `
.stage{background:
  radial-gradient(at 26% 14%, ${accent}1f 0%, ${accent}0a 34%, #fff0 66%),
  radial-gradient(at 80% 40%, ${m.spectrum.cellular}14 0%, #fff0 58%),
  linear-gradient(145deg,#f8f9fb,#eef0f7);color:${m.ink}}
.ann{height:70px;background:${m.cream};color:${m.creamText};display:flex;align-items:center;
  justify-content:center;font-size:${big ? 25 : 22}px;font-weight:500;letter-spacing:.02em;text-align:center;padding:0 24px}
.wrap{padding:${big ? 56 : 44}px ${pad}px 0;position:relative;z-index:3}
.logo{height:${big ? 88 : 74}px;display:block}
.eyerow{display:flex;align-items:center;gap:18px;margin-top:${big ? 62 : 40}px}
.eyerow .bar{width:66px;height:5px;border-radius:99px;background:${accent};flex:none}
.eyebrow{font-family:var(--font-space-grotesk);font-weight:500;font-size:${big ? 26 : 23}px;
  text-transform:uppercase;letter-spacing:.08em;line-height:1.4;
  color:color-mix(in srgb,${accent} 55%,${m.ink})}
h1{font-family:var(--font-fraunces);font-weight:300;font-size:${big ? 118 : 92}px;line-height:1.03;
  letter-spacing:-.02em;margin-top:${big ? 26 : 20}px;max-width:${big ? 900 : 700}px}
h1 em{font-style:italic;font-weight:300;background:${m.gradients.headlineOnLight};
  padding-bottom:.16em;margin-bottom:-.16em;
  -webkit-background-clip:text;background-clip:text;color:transparent;display:block}
ul{list-style:none;margin-top:${big ? 46 : 32}px;display:flex;flex-direction:column;
  gap:${big ? 16 : 12}px;align-items:flex-start;max-width:${big ? 640 : 560}px}
ul li{display:flex;align-items:flex-start;gap:14px;border-radius:99px;
  border:1px solid color-mix(in srgb,${accent} 35%,transparent);
  background:color-mix(in srgb,${accent} 8%,#fff);padding:${big ? "15px 30px 15px 24px" : "12px 24px 12px 20px"}}
.tick{color:${m.spectrum.neural};font-size:${big ? 26 : 23}px;line-height:1.25;flex:none}
.ct{font-family:var(--font-jetbrains-mono);font-size:${big ? 25 : 22}px;font-weight:500;
  letter-spacing:.02em;line-height:1.25;color:${m.ink}}
.ct em{display:block;font-style:normal;font-size:${big ? 21 : 18}px;font-weight:400;margin-top:5px;
  color:color-mix(in srgb,${m.ink} 55%,transparent);letter-spacing:.01em}
.prod{position:absolute;right:-16px;bottom:${big ? 184 : 140}px;
  width:${Math.round(width * 0.61)}px;height:${Math.round(height * 0.4)}px;z-index:2}
.halo{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);
  width:${Math.round(width * 0.76)}px;height:${Math.round(height * 0.4)}px;
  background:radial-gradient(46% 44% at 50% 62%,${accent}22 0%,${accent}14 46%,#fff0 88%)}
.vial{position:absolute;left:50%;bottom:46px;transform:translateX(-50%);
  height:${Math.round(height * 0.35)}px;filter:drop-shadow(0 26px 34px #1a1b2638)}
.floor{position:absolute;left:50%;bottom:28px;transform:translateX(-50%);
  width:${Math.round(width * 0.34)}px;height:24px;
  background:radial-gradient(50% 50% at 50% 50%,#1a1b2629 0%,#1a1b2600 70%)}
.cta{position:absolute;left:${pad}px;bottom:${big ? 118 : 96}px;z-index:4;display:inline-flex;
  align-items:center;background:${m.luminViolet};color:#fff;font-weight:600;
  font-size:${big ? 30 : 26}px;padding:${big ? "26px 46px" : "22px 38px"};border-radius:99px;
  box-shadow:0 12px 30px -14px ${m.luminViolet}8c}
.dose{position:absolute;right:${pad}px;bottom:${big ? 132 : 108}px;z-index:4;text-align:right;
  font-family:var(--font-space-grotesk)}
.dose b{display:block;font-size:${big ? 40 : 34}px;font-weight:600;letter-spacing:-.01em;color:${m.ink}}
.dose span{display:block;font-size:${big ? 22 : 19}px;font-weight:500;text-transform:uppercase;
  letter-spacing:.12em;color:color-mix(in srgb,${m.ink} 50%,transparent);margin-top:6px}
.legal{position:absolute;left:0;right:0;bottom:0;z-index:5;padding:0 ${pad}px ${big ? 34 : 26}px;
  text-align:center;font-size:${big ? 19 : 17}px;line-height:1.5;
  color:color-mix(in srgb,${m.ink} 46%,transparent)}`;

  return shell(kit, width, height, m.snow, body, css);
}

/**
 * Shared dark ground for `panel` and `streak`. A generated scene is preferred; without one the
 * ground is drawn in CSS so a fresh clone can still produce the format with no API call. The
 * shipped scenes already carry their own vial, so a scene and a composited cutout are mutually
 * exclusive — never both.
 */
const darkGround = (scene) => (scene ? `<img class="hero" src="${scene}">` : '<div class="hero synth"></div>');

const darkGroundCss = (ground, accent, hasScene) => `
.hero{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center}
${hasScene ? "" : `.hero.synth{background:
  radial-gradient(58% 34% at 50% 68%, ${accent}3d 0%, ${accent}17 38%, #0000 72%),
  radial-gradient(120% 70% at 50% 108%, ${ground.base} 0%, ${ground.deep} 62%, #000 100%),
  linear-gradient(180deg, ${ground.deep} 0%, ${ground.base} 55%, ${ground.deep} 100%)}`}
.vignette{position:absolute;inset:0;z-index:4;pointer-events:none;
  background:radial-gradient(118% 76% at 50% 44%,#00000000 42%,${ground.deep}a1 100%)}
.grain{position:absolute;inset:0;z-index:8;pointer-events:none;opacity:.10;
  mix-blend-mode:overlay;background-image:${GRAIN};background-size:180px 180px}
.band{position:absolute;top:0;left:0;right:0;z-index:6}`;

/**
 * `panel` — dark, centered, the inverse of `single`. Product upper-middle, copy block bottom-
 * anchored, selling points as a three-column spec row on hairline rules. Reads as certificate data.
 */
function panelFormat({ kit, width, height, subject, points, accent, logo, vial, hookLines, offer, scene }) {
  const m = kit.design.surfaces.marketing;
  const ground = m.darkGrounds.indigo;
  const big = height > width;
  const pad = big ? 58 : 52;
  const hookSize = big ? 90 : 74;
  const pointSize = big ? 26 : 22;

  const columns = points.map((point, index) => (index ? '<i class="rule"></i>' : "")
    + `<div class="col"><span class="tick">✓</span><span class="txt">${escapeHtml(point.spec[0])}<br>${escapeHtml(point.spec[1])}</span></div>`).join("");

  const body = `
  ${darkGround(scene)}
  ${vial && !scene ? `<div class="prodwrap"><div class="bloom"></div><img class="vial" src="${vial}"></div>` : ""}
  <div class="top-scrim"></div><div class="bot-scrim"></div>
  <div class="vignette"></div><div class="grain"></div>
  <div class="band">${spectrumBand(m)}</div>
  <div class="top">
    <img class="logo" src="${logo}">
    <div class="eyerow"><span class="bar"></span><span class="eyebrow">${escapeHtml(subject.eyebrow)}</span></div>
  </div>
  <div class="btm">
    <h1>${escapeHtml(hookLines[0])}<em>${escapeHtml(hookLines[1])}</em></h1>
    <div class="specrow">${columns}</div>
    <div class="ctawrap"><div class="cta">${escapeHtml(subject.cta)} &nbsp;→</div>
      <div class="offer">${escapeHtml(offer)}</div></div>
  </div>
  <div class="ruo">${escapeHtml(kit.design.disclosures.ruo)}</div>`;

  const css = `
html,body{color:#fff}
${darkGroundCss(ground, accent, Boolean(scene))}
.top-scrim{position:absolute;left:0;right:0;top:0;height:${Math.round(height * 0.24)}px;z-index:2;
  background:linear-gradient(180deg,${ground.base}D9 0%,${ground.base}8F 46%,${ground.base}00 100%)}
.bot-scrim{position:absolute;left:0;right:0;bottom:0;height:${Math.round(height * 0.52)}px;z-index:2;
  background:linear-gradient(0deg,${ground.deep}F7 0%,${ground.deep}E0 34%,${ground.deep}99 62%,${ground.deep}00 100%)}
.prodwrap{position:absolute;left:50%;transform:translateX(-50%);top:${Math.round(height * 0.16)}px;
  z-index:3;width:${Math.round(width * 0.7)}px;height:${Math.round(height * 0.42)}px}
.bloom{position:absolute;left:50%;top:52%;transform:translate(-50%,-50%);
  width:${Math.round(width * 0.9)}px;height:${Math.round(height * 0.34)}px;
  background:radial-gradient(48% 44% at 50% 50%,#ffffff33 0%,${accent}40 34%,#ffffff00 78%)}
.vial{position:absolute;left:50%;bottom:0;transform:translateX(-50%);height:${Math.round(height * 0.4)}px;
  filter:contrast(1.16) saturate(1.12) brightness(1.05)
    drop-shadow(0 0 2px #ffffff5c) drop-shadow(0 30px 44px ${ground.deep}a6)}
.top{position:absolute;top:${pad}px;left:${pad}px;right:${pad}px;z-index:5}
.logo{height:${big ? 84 : 72}px;display:block;filter:drop-shadow(0 3px 20px ${ground.deep}99)}
.eyerow{display:flex;align-items:center;gap:15px;margin-top:${big ? 22 : 17}px}
.eyerow .bar{width:54px;height:5px;border-radius:99px;background:${accent};flex:none}
.eyebrow{font-family:var(--font-space-grotesk);font-weight:600;font-size:${big ? 24 : 21}px;
  text-transform:uppercase;letter-spacing:.1em;color:${accent};text-shadow:0 0 22px ${accent}80}
.btm{position:absolute;left:${pad}px;right:${pad}px;bottom:${big ? 58 : 48}px;z-index:5;text-align:center}
h1{font-family:var(--font-fraunces);font-weight:300;font-size:${hookSize}px;line-height:1.0;
  letter-spacing:-.025em;text-shadow:0 4px 40px ${ground.deep}A6}
h1 em{font-style:italic;font-weight:300;display:block;background:${m.gradients.headlineOnDarkBlue};
  padding-bottom:.16em;margin-bottom:-.16em;
  -webkit-background-clip:text;background-clip:text;color:transparent}
.specrow{display:flex;align-items:stretch;justify-content:center;
  margin-top:${big ? 30 : 24}px;padding:${big ? 20 : 16}px 0;
  border-top:1px solid #ffffff2e;border-bottom:1px solid #ffffff2e}
.col{flex:1;display:flex;flex-direction:column;align-items:center;gap:${big ? 9 : 7}px;
  padding:0 ${big ? 12 : 9}px}
.rule{width:1px;background:#ffffff26;flex:none}
.tick{font-size:${Math.round(pointSize * 1.05)}px;font-weight:700;color:${accent};line-height:1;
  text-shadow:0 0 20px ${accent}}
.txt{font-family:var(--font-space-grotesk);font-weight:700;font-size:${pointSize}px;
  text-transform:uppercase;letter-spacing:.02em;line-height:1.24;color:#fff;
  text-shadow:0 3px 26px ${ground.deep}c9}
.ctawrap{margin-top:${big ? 34 : 27}px}
.cta{display:inline-flex;align-items:center;white-space:nowrap;background:#fff;color:${m.ink};
  font-weight:800;font-size:${big ? 36 : 32}px;letter-spacing:-.01em;
  padding:${big ? "30px 60px" : "26px 50px"};border-radius:99px;
  box-shadow:0 0 0 8px #ffffff1f, 0 20px 50px -12px #000000b3}
.offer{margin-top:${big ? 12 : 10}px;font-family:var(--font-space-grotesk);font-weight:600;
  font-size:${big ? 24 : 21}px;letter-spacing:.03em;color:#ffffffdb;
  text-shadow:0 2px 18px ${ground.deep}b3}
.ruo{position:absolute;left:0;right:0;bottom:${big ? 14 : 12}px;z-index:6;text-align:center;
  font-size:${big ? 20 : 18}px;font-weight:500;letter-spacing:.02em;color:#f2f2f8c4}`;

  return shell(kit, width, height, ground.deep, body, css);
}

/**
 * `streak` — dark direct-response. No lede, no eyebrow category, no dose callout: logo → one short
 * hook → three loud selling points → dominant vial → one CTA → disclosure. Points are Space Grotesk
 * uppercase at ~3x the chip size on an accent left rule; divider rules between them were rejected.
 */
function streak({ kit, width, height, subject, points, accent, logo, vial, hookLines, offer, scene }) {
  const m = kit.design.surfaces.marketing;
  const ground = m.darkGrounds.violet;
  const big = height > width;
  const pad = big ? 58 : 52;
  const hookSize = big ? 102 : 84;
  const pointSize = big ? 44 : 33;

  const rows = points.map((point) => `<li><span class="n">✓</span>${escapeHtml(point.loud)}</li>`).join("");

  const body = `
  ${darkGround(scene)}
  ${vial && !scene ? `<div class="prodwrap"><div class="bloom"></div><img class="vial" src="${vial}"></div>` : ""}
  <div class="top-scrim"></div><div class="bot-scrim"></div>
  <div class="vignette"></div><div class="grain"></div>
  <div class="frame"></div>
  <div class="band">${spectrumBand(m)}</div>
  <div class="top">
    <img class="logo" src="${logo}">
    <div class="eyerow"><span class="bar"></span><span class="eyebrow">RESEARCH PEPTIDES</span></div>
    <h1>${escapeHtml(hookLines[0])}<em>${escapeHtml(hookLines[1])}</em></h1>
    <ul class="specs">${rows}</ul>
  </div>
  <div class="ctawrap"><div class="cta">${escapeHtml(subject.cta)} &nbsp;→</div>
    <div class="offer">${escapeHtml(offer)}</div></div>
  <div class="ruo">${escapeHtml(kit.design.disclosures.ruo)}</div>`;

  const css = `
html,body{color:#fff}
${darkGroundCss(ground, accent, Boolean(scene))}
.top-scrim{position:absolute;left:0;right:0;top:0;height:${Math.round(height * 0.5)}px;z-index:2;
  background:linear-gradient(180deg,${ground.base}F2 0%,${ground.base}AD 44%,${ground.base}00 100%)}
.bot-scrim{position:absolute;left:0;right:0;bottom:0;height:${Math.round(height * 0.26)}px;z-index:2;
  background:linear-gradient(0deg,${ground.deep}E6 0%,${ground.deep}99 46%,${ground.deep}00 100%)}
.frame{position:absolute;inset:${Math.round(pad * 0.5)}px;z-index:7;pointer-events:none;
  border:1px solid #ffffff2b;border-radius:4px}
.prodwrap{position:absolute;${big ? "left:50%;transform:translateX(-50%);" : "right:-7%;"}
  bottom:${Math.round(height * (big ? 0.125 : 0.1))}px;z-index:3;
  width:${Math.round(width * (big ? 1.02 : 0.74))}px;height:${Math.round(height * (big ? 0.56 : 0.66))}px}
.bloom{position:absolute;left:50%;top:52%;transform:translate(-50%,-50%);
  width:${Math.round(width * 0.96)}px;height:${Math.round(height * 0.42)}px;
  background:radial-gradient(48% 44% at 50% 50%,#ffffff40 0%,${accent}47 34%,#ffffff00 78%)}
.vial{position:absolute;left:50%;bottom:0;transform:translateX(-50%) rotate(5deg);
  height:${Math.round(height * (big ? 0.55 : 0.64))}px;
  filter:contrast(1.16) saturate(1.12) brightness(1.05)
    drop-shadow(0 0 2px #ffffff5c) drop-shadow(0 30px 44px ${ground.deep}a6)}
.top{position:absolute;top:${pad}px;left:${pad}px;right:${pad}px;z-index:5}
.logo{height:${big ? 90 : 78}px;display:block;filter:drop-shadow(0 3px 20px ${ground.base}99)}
.eyerow{display:flex;align-items:center;gap:15px;margin-top:${big ? 24 : 18}px}
.eyerow .bar{width:54px;height:5px;border-radius:99px;background:${accent};flex:none}
.eyebrow{font-family:var(--font-space-grotesk);font-weight:600;font-size:${big ? 25 : 22}px;
  text-transform:uppercase;letter-spacing:.14em;color:${accent};text-shadow:0 0 22px ${accent}80}
h1{font-family:var(--font-fraunces);font-weight:300;font-size:${hookSize}px;line-height:.98;
  letter-spacing:-.025em;margin-top:${big ? 28 : 24}px;text-shadow:0 4px 40px ${ground.base}A6}
h1 em{font-style:italic;font-weight:300;display:block;background:${m.gradients.headlineOnDarkViolet};
  padding-bottom:.16em;margin-bottom:-.16em;
  -webkit-background-clip:text;background-clip:text;color:transparent}
.specs{list-style:none;margin-top:${big ? 22 : 18}px;padding-left:${big ? 26 : 22}px;
  border-left:3px solid ${accent};filter:drop-shadow(-2px 0 14px ${accent}b3)}
.specs li{display:flex;align-items:center;gap:${big ? 22 : 18}px;margin-bottom:${big ? 12 : 10}px;
  font-family:var(--font-space-grotesk);font-weight:700;font-size:${pointSize}px;
  text-transform:uppercase;letter-spacing:.015em;line-height:1.1;color:#fff;
  text-shadow:0 3px 26px ${ground.base}c9}
.specs .n{font-size:${Math.round(pointSize * 0.78)}px;font-weight:700;color:${accent};flex:none;
  line-height:1;text-shadow:0 0 20px ${accent}}
.ctawrap{position:absolute;left:0;right:0;bottom:${big ? 40 : 34}px;z-index:5;text-align:center}
.cta{display:inline-flex;align-items:center;white-space:nowrap;background:#fff;color:${m.ink};
  font-weight:800;font-size:${big ? 38 : 34}px;letter-spacing:-.01em;
  padding:${big ? "32px 64px" : "28px 54px"};border-radius:99px;
  box-shadow:0 0 0 8px #ffffff1f, 0 20px 50px -12px #000000b3}
.offer{margin-top:${big ? 12 : 10}px;font-family:var(--font-space-grotesk);font-weight:600;
  font-size:${big ? 25 : 22}px;letter-spacing:.03em;color:#ffffffdb;
  text-shadow:0 2px 18px ${ground.base}b3}
.ruo{position:absolute;left:0;right:0;bottom:${big ? 10 : 8}px;z-index:6;text-align:center;
  font-size:${big ? 20 : 18}px;font-weight:500;letter-spacing:.02em;color:#f2f2f8c4}`;

  return shell(kit, width, height, ground.base, body, css);
}

const BUILDERS = { single, panel: panelFormat, streak };

// Creative #1 owns cryo; the panel gets the other surviving style so the two never read as
// re-skins of each other. `single` is a light layout and takes no scene.
const DEFAULT_STYLE = { single: null, panel: "causticsblue", streak: "cryo" };

/** Compile one ad to HTML. Returns the markup plus the facts a manifest needs. */
export async function composeAd(kit, {
  format = "single",
  compound = "ghkcu",
  panel = null,
  hook = null,
  variant = "base",
  ratio = "9:16",
  style = null,
} = {}) {
  if (!BUILDERS[format]) throw new EngineError("UNKNOWN_FORMAT", `Format must be one of ${FORMATS.join(", ")}.`);
  if (!RATIOS[ratio]) throw new EngineError("UNKNOWN_RATIO", `Ratio must be one of ${Object.keys(RATIOS).join(", ")}.`);

  const [width, height] = RATIOS[ratio];
  const subject = resolveSubject(kit, { compound, panel });
  const light = format === "single";

  // `single` is chip-driven and reads from a variant; the dark formats are hook-driven.
  const hookKey = hook || (light ? "documented" : panel ? "panel" : "proof");
  const resolvedHook = resolveHook(kit, hookKey, subject);
  const pointKeys = light ? kit.points.variants[variant]?.points : resolvedHook.points;
  if (!pointKeys) throw new EngineError("UNKNOWN_VARIANT", `No variant "${variant}".`, { available: dataKeys(kit.points.variants) });
  const points = pickPoints(kit, pointKeys);
  const offer = kit.points.points[resolvedHook.offer]?.loud || "";

  const logo = await kit.trimmedDataUri(light ? kit.design.assets.logoBlack : kit.design.assets.logoWhite);
  const vial = subject.vial ? kit.dataUri(subject.vial, { required: false }) : null;
  // An absent scene is not an error: the dark formats fall back to a CSS ground plus the vial
  // cutout, so a fresh clone renders every format before it has generated anything.
  const resolvedStyle = light ? null : (style ?? DEFAULT_STYLE[format]);
  const scenePath = resolvedStyle
    ? kit.design.assets.scenePattern.replace("{style}", resolvedStyle).replace("{ratio}", ratio.replace(":", "x"))
    : null;
  const scene = scenePath ? kit.dataUri(scenePath, { required: false }) : null;
  kit.assertAssets();

  const context = {
    kit, width, height, subject, points, accent: subject.accent,
    logo, vial, scene, offer, hookLines: resolvedHook.lines,
  };

  return {
    html: BUILDERS[format](context),
    files: [{ name: FONT_FILE, content: kit.fontCss }],
    width,
    height,
    meta: {
      format, ratio, style: resolvedStyle, scene: scene ? scenePath : null,
      subject: subject.key, hook: hookKey, variant: light ? variant : null,
      points: points.map((point) => ({ key: point.key, claim: point.claim })),
      disclosure: kit.design.disclosures.ruo,
    },
  };
}

/** Compose and screenshot one ad per requested ratio. */
export async function renderAds(kit, { ratios = ["9:16"], outputDirectory, basename, ...options } = {}) {
  const results = [];
  for (const ratio of ratios) {
    const { html, files, width, height, meta } = await composeAd(kit, { ...options, ratio });
    const name = `${basename || [meta.format, meta.subject, meta.hook, meta.variant].filter(Boolean).join("_")}_${ratio.replace(":", "x")}.png`;
    const outputPath = path.join(outputDirectory, name);
    results.push({ ...(await screenshot(html, outputPath, { width, height, files })), meta });
  }
  return results;
}
