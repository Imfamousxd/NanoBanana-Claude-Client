import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { EngineError } from "../core/errors.mjs";

// Deterministic layout rendering: HTML/CSS shot by headless Chrome. Exact copy, exact hexes, exact
// type, free per render, and incapable of hallucinating a claim into the artwork.

const CANDIDATES = {
  darwin: [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
  ],
  linux: [
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/snap/bin/chromium",
    "/usr/bin/microsoft-edge",
  ],
  win32: [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  ],
};

export function findChrome() {
  if (process.env.CHROME_PATH) {
    if (!fs.existsSync(process.env.CHROME_PATH)) {
      throw new EngineError("CHROME_NOT_FOUND", `CHROME_PATH is set but does not exist: ${process.env.CHROME_PATH}`);
    }
    return process.env.CHROME_PATH;
  }
  for (const candidate of CANDIDATES[process.platform] || []) {
    if (fs.existsSync(candidate)) return candidate;
  }
  for (const command of ["google-chrome", "chromium", "chromium-browser"]) {
    const found = spawnSync("which", [command], { encoding: "utf8" });
    if (found.status === 0 && found.stdout.trim()) return found.stdout.trim();
  }
  return null;
}

export function requireChrome() {
  const chrome = findChrome();
  if (!chrome) {
    throw new EngineError(
      "CHROME_NOT_FOUND",
      "Headless Chrome is required to render deterministic layouts. Install Google Chrome or Chromium, or set CHROME_PATH to its binary.",
    );
  }
  return chrome;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function killTree(child) {
  try { process.kill(-child.pid, "SIGKILL"); } catch { /* already gone */ }
  try { child.kill("SIGKILL"); } catch { /* already gone */ }
}

/**
 * Screenshot an HTML string at an exact pixel size.
 *
 * Headless Chrome writes the screenshot and then frequently fails to exit, so waiting on the
 * process is not a completion signal — every batch that does stalls until its timeout. Instead this
 * watches for the output file to appear and stop growing, then kills the process group. Renders take
 * as long as the render, not as long as the timeout.
 *
 * The disposable profile directory matters too: a shared profile lock silently stalls a batch. So
 * does the explicit device scale factor — a retina host otherwise doubles the output and the
 * deliverable ships at the wrong size.
 */
export async function screenshot(html, outputPath, {
  width, height, timeoutMs = 120_000, scale = 1, files = [], pollMs = 150,
} = {}) {
  const chrome = requireChrome();
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.rmSync(outputPath, { force: true });

  const workDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "brandkit-"));
  const htmlPath = path.join(workDirectory, "page.html");
  for (const file of files) fs.writeFileSync(path.join(workDirectory, file.name), file.content);
  fs.writeFileSync(htmlPath, html);

  const child = spawn(chrome, [
    "--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-sandbox",
    "--no-first-run", "--no-default-browser-check", "--disable-background-networking",
    "--disable-extensions", "--disable-sync", "--mute-audio",
    `--force-device-scale-factor=${scale}`,
    `--user-data-dir=${path.join(workDirectory, "profile")}`,
    `--window-size=${width},${height}`,
    `--screenshot=${outputPath}`,
    `file://${htmlPath}`,
  ], { detached: true, stdio: ["ignore", "ignore", "pipe"] });

  let stderr = "";
  child.stderr.on("data", (chunk) => { stderr = (stderr + chunk).slice(-2_000); });

  const deadline = Date.now() + timeoutMs;
  let lastSize = -1;
  let stableFor = 0;
  try {
    while (Date.now() < deadline) {
      await sleep(pollMs);
      const size = fs.existsSync(outputPath) ? fs.statSync(outputPath).size : -1;
      // Two identical non-zero readings mean the PNG is fully flushed.
      stableFor = size > 0 && size === lastSize ? stableFor + 1 : 0;
      lastSize = size;
      if (stableFor >= 2) break;
      if (child.exitCode !== null && size <= 0) break;
    }
  } finally {
    killTree(child);
    fs.rmSync(workDirectory, { recursive: true, force: true });
  }

  if (!fs.existsSync(outputPath) || fs.statSync(outputPath).size === 0) {
    throw new EngineError("RENDER_FAILED", `Chrome produced no screenshot for ${path.basename(outputPath)}.`, {
      exitCode: child.exitCode,
      stderr: stderr.split("\n").filter(Boolean).slice(-6),
    });
  }
  return { path: outputPath, bytes: fs.statSync(outputPath).size, width, height };
}
