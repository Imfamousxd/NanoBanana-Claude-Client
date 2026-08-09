// Which Seedance 1.x models are activated on THIS key's account? A submit that fails with
// ModelNotOpen is free; anything else tells us the model is open (or the request shape is off).
import fs from "fs";
const REPO = "/Users/Hassoonie/Desktop/CODE PROJECTS/NanoBanana-Client";
for (const line of fs.readFileSync(`${REPO}/.env`, "utf-8").split("\n")) {
  const m = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const BASE = "https://ark.ap-southeast.bytepluses.com/api/v3/contents/generations/tasks";
const H = { Authorization: `Bearer ${process.env.MODELARK_API_KEY}`, "Content-Type": "application/json" };
for (const model of ["seedance-1-5-pro-251215", "seedance-1-0-pro-250528",
                     "seedance-1-0-lite-i2v-250428", "seedance-1-0-pro-fast-251015"]) {
  const res = await fetch(BASE, { method: "POST", headers: H,
    body: JSON.stringify({ model, content: [{ type: "text", text: "" }] }) });
  const t = await res.text();
  let code = ""; try { code = JSON.parse(t).error?.code || "SUBMITTED"; } catch { code = "?"; }
  console.log(`${model.padEnd(32)} HTTP ${res.status}  ${code}`);
  if (code === "SUBMITTED") {
    const id = JSON.parse(t).id;
    await fetch(`${BASE}/${id}`, { method: "DELETE", headers: H }).catch(() => {});
    console.log(`  (empty-prompt task ${id} submitted unexpectedly — cancel attempted)`);
  }
}
