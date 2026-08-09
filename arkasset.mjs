#!/usr/bin/env node
/**
 * arkasset.mjs — query the ModelArk asset library (digital characters / registered assets) through
 * the arkcli's OWN logged-in SSO credentials, which the documented `arkcli` surface does not expose.
 *
 *   node arkasset.mjs quota                      # capacity + writable flags for this account
 *   node arkasset.mjs groups <AIGC|Public> [pg]  # list asset groups of a type
 *   node arkasset.mjs assets <GROUP_ID> [pg]     # list assets (URLs) inside a group
 *   node arkasset.mjs raw <Action> '<jsonBody>'  # any read action (List.../Get...)
 *
 * HOW: the control plane at ark.ap-southeast-1.byteplusapi.com speaks the TOP/Volcengine
 * HMAC-SHA256 signature (SigV4-flavored, scope <date>/<region>/ark/request). The temporary STS
 * creds live in ~/.arkcli-bp/.env after `arkcli auth login` (VOLCENGINE_STS_ACCESS_KEY /
 * _SECRET_KEY / _SESSION_TOKEN) and expire ~hourly — re-login if you get InvalidAuthorization.
 * VALUES IN THAT FILE ARE QUOTED — strip quotes or every signature fails (learned the hard way).
 *
 * WHAT WE LEARNED WITH IT (2026-08-09):
 *   - GroupType enum is validated; only AIGC (your generated assets, empty) and Public (6225
 *     shared editing-template examples) return 200. Liveness/Preset/DigitalCharacter are rejected.
 *   - CreateAssetGroup / CreateAsset EXIST but 403 `SubscriptionRequired`: "requires an active
 *     advanced or premium subscription." So registering ANY custom character — a Soul face OR a
 *     real human — is gated behind a PAID ModelArk media-asset subscription, not merely an invite.
 *     This is the single fact that decides the digital-character plan. See craft/DIGITAL-CHARACTERS.md.
 */
import fs from "fs";
import os from "os";
import path from "path";
import crypto from "crypto";

const ENVP = path.join(os.homedir(), ".arkcli-bp", ".env");
if (!fs.existsSync(ENVP)) { console.error(`no arkcli creds at ${ENVP} — run: arkcli auth login`); process.exit(1); }
const E = {};
for (const line of fs.readFileSync(ENVP, "utf-8").split("\n")) {
  const m = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);
  if (m) E[m[1]] = m[2].replace(/^["']|["']$/g, "");   // creds are QUOTED on disk
}
const AK = E.VOLCENGINE_STS_ACCESS_KEY, SK = E.VOLCENGINE_STS_SECRET_KEY, TOKEN = E.VOLCENGINE_STS_SESSION_TOKEN;
const HOST = "ark.ap-southeast-1.byteplusapi.com", REGION = "ap-southeast-1", SERVICE = "ark";
const sha256 = (s) => crypto.createHash("sha256").update(s).digest("hex");
const hmac = (k, s) => crypto.createHmac("sha256", k).update(s).digest();

async function call(action, body = {}) {
  const bb = Buffer.from(JSON.stringify(body));
  const now = new Date();
  const xdate = now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const short = xdate.slice(0, 8);
  const query = `Action=${action}&Version=2024-01-01`;
  const ph = sha256(bb);
  const h = { "content-type": "application/json", host: HOST, "x-date": xdate, "x-content-sha256": ph, "x-security-token": TOKEN };
  const signed = Object.keys(h).sort().join(";");
  const ch = Object.keys(h).sort().map((k) => `${k}:${h[k]}\n`).join("");
  const canonical = ["POST", "/", query, ch, signed, ph].join("\n");
  const scope = `${short}/${REGION}/${SERVICE}/request`;
  const sts = ["HMAC-SHA256", xdate, scope, sha256(canonical)].join("\n");
  let key = Buffer.from(SK);
  for (const p of [short, REGION, SERVICE, "request"]) key = hmac(key, p);
  const sig = crypto.createHmac("sha256", key).update(sts).digest("hex");
  const auth = `HMAC-SHA256 Credential=${AK}/${scope}, SignedHeaders=${signed}, Signature=${sig}`;
  const res = await fetch(`https://${HOST}/?${query}`, {
    method: "POST", body: bb,
    headers: { "Content-Type": "application/json", "X-Date": xdate, "X-Content-Sha256": ph, "X-Security-Token": TOKEN, Authorization: auth },
  });
  return res.json();
}

const [cmd, a, b] = process.argv.slice(2);
const out = (o) => console.log(JSON.stringify(o, null, 1));
if (cmd === "quota") out(await call("GetAssetQuota"));
else if (cmd === "groups") out(await call("ListAssetGroups", { Filter: { GroupType: a || "AIGC" }, PageNumber: +(b || 1), PageSize: 100 }));
else if (cmd === "assets") out(await call("ListAssets", { Filter: { GroupType: "AIGC", GroupId: a }, PageNumber: +(b || 1), PageSize: 100 }));
else if (cmd === "raw") out(await call(a, JSON.parse(b || "{}")));
else { console.error("usage: arkasset.mjs quota | groups <Type> [pg] | assets <GroupId> [pg] | raw <Action> '<json>'"); process.exit(1); }
