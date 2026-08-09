// Activation shows "Available" on the control plane; the data plane may lag. Retry the P-15A
// submit every 20s for up to 6 minutes, stopping the moment the error changes character.
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";

const t0 = Date.now();
for (let i = 1; ; i++) {
  const r = spawnSync("node", [fileURLToPath(new URL("./p15a.mjs", import.meta.url))],
    { encoding: "utf-8", timeout: 900000 });
  const out = (r.stdout || "") + (r.stderr || "");
  if (!out.includes("ModelNotOpen")) {
    console.log(out.trim());
    process.exit(r.status ?? 0);
  }
  const el = ((Date.now() - t0) / 1000).toFixed(0);
  if (Date.now() - t0 > 360000) {
    console.log(`still ModelNotOpen after ${el}s — activation has not propagated; check the Ark Console model page.`);
    process.exit(1);
  }
  console.log(`[attempt ${i}, ${el}s] still ModelNotOpen — waiting 20s`);
  await new Promise((res) => setTimeout(res, 20000));
}
