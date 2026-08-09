#!/usr/bin/env node
/**
 * brand-asks.mjs — communicate with the brand PROPERLY: asks out, sourced answers in.
 *
 *   node brand-asks.mjs Muha_Meds                      # generate the ask sheet
 *   node brand-asks.mjs Muha_Meds record \
 *        --campaign golden-hour-rolex --field entry_mechanic_exact \
 *        --value "..." --by "Jess @ Muha, email 2026-08-10"        # record an answer
 *   node brand-asks.mjs Muha_Meds log                  # every answer ever recorded
 *
 * WHY THIS EXISTS
 * The compliance gate blocks on facts only the brand can supply — and today those facts arrive as
 * chat comments that get hand-transcribed into the registry ("ten entries is right" ->
 * SOURCED_BY_OPERATOR). That loop has three failure modes this tool closes:
 *   1. Nobody can see the full list of what's unresolved, so asks trickle out one crisis at a time.
 *   2. Verbal answers carry no provenance — who said it, when, in what words.
 *   3. Operator-relayed answers (SOURCED_BY_OPERATOR) never get upgraded to brand-confirmed.
 *
 * The ask sheet is written for a CLIENT, not an engineer: each question says what it unblocks and
 * what it costs to leave open. Answers append to answers.jsonl (provenance forever) AND update the
 * campaign JSON in place (status SOURCED_BY_BRAND), so the engine's gate opens the moment the
 * answer lands.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > -1 ? process.argv[i + 1] : d; };

const brandName = process.argv[2];
if (!brandName) { console.error("usage: brand-asks.mjs <Brand> [record|log] [...]"); process.exit(1); }
const BDIR = path.join(__dirname, "sieve", "brands", brandName);
const brand = JSON.parse(fs.readFileSync(path.join(BDIR, "brand.json"), "utf-8"));
const CDIR = path.join(BDIR, "campaigns");
const campaigns = fs.readdirSync(CDIR).filter((f) => f.endsWith(".json"))
  .map((f) => JSON.parse(fs.readFileSync(path.join(CDIR, f), "utf-8")));
const LOG = path.join(BDIR, "answers.jsonl");

const cmd = process.argv[3];

// ---------------------------------------------------------------- record
if (cmd === "record") {
  const camp = arg("campaign"), field = arg("field"), value = arg("value"), by = arg("by");
  if (!camp || !field || !value || !by) {
    console.error('record needs --campaign --field --value --by "who @ brand, channel, date"');
    console.error('an answer without WHO is a rumor, not a source.');
    process.exit(2);
  }
  const cp = path.join(CDIR, `${camp}.json`);
  const c = JSON.parse(fs.readFileSync(cp, "utf-8"));
  const prev = c[field];
  c[field] = {
    value,
    status: "SOURCED_BY_BRAND",
    note: `Recorded via brand-asks ${new Date().toISOString().slice(0, 10)}; supplied by ${by}.` +
          (prev?.status ? ` Supersedes ${prev.status}${prev.value ? ` ("${prev.value}")` : ""}.` : ""),
  };
  fs.writeFileSync(cp, JSON.stringify(c, null, 2) + "\n");
  fs.appendFileSync(LOG, JSON.stringify({
    t: new Date().toISOString(), campaign: camp, field, value, by,
    superseded: prev ? { value: prev.value ?? null, status: prev.status ?? null } : null,
  }) + "\n");
  console.log(`recorded: ${camp}.${field} = "${value}"  [SOURCED_BY_BRAND, by ${by}]`);
  console.log(`ledger  : ${path.relative(__dirname, LOG)}`);
  process.exit(0);
}

// ---------------------------------------------------------------- log
if (cmd === "log") {
  if (!fs.existsSync(LOG)) { console.log("no answers recorded yet"); process.exit(0); }
  for (const line of fs.readFileSync(LOG, "utf-8").split("\n").filter(Boolean)) {
    const r = JSON.parse(line);
    console.log(`${r.t.slice(0, 10)}  ${r.campaign}.${r.field} = "${String(r.value).slice(0, 60)}"  — ${r.by}`);
  }
  process.exit(0);
}

// ---------------------------------------------------------------- the ask sheet
let n = 0;
const Q = [];
const ask = (severity, area, question, unblocks) => { n++; Q.push({ n, severity, area, question, unblocks }); };

// disclosures — always first, they gate every giveaway deliverable
const md = brand.mandatory_disclosures || {};
for (const u of md.unresolved || [])
  ask("BLOCKING", "Disclosures", u,
      "every giveaway video and still for every campaign — nothing publishes until this is answered");

// brand-level unresolveds
for (const u of brand.unresolved || [])
  ask("OPEN", "Brand", u, "general production");

// per-campaign: UNRESOLVED fields, operator-relayed facts needing written confirmation, flagged marks
for (const c of campaigns) {
  const cn = c.campaign;
  for (const [k, v] of Object.entries(c)) {
    if (!v || typeof v !== "object" || Array.isArray(v) || !("status" in v)) continue;
    if (String(v.status) === "UNRESOLVED")
      ask("BLOCKING", cn, `${k.replace(/_/g, " ")}: ${v.note || "no approved wording exists"}`,
          `any deliverable for ${cn} that states this fact`);
    else if (String(v.status) === "SOURCED_BY_OPERATOR")
      ask("CONFIRM", cn,
          `Please confirm IN WRITING: ${k.replace(/_/g, " ")} = "${v.value}" (currently relayed verbally by the operator).`,
          `upgrades a verbal relay to a brand-confirmed source`);
  }
  for (const m of c.third_party_marks || [])
    if (/FLAGGED/i.test(m.status || ""))
      ask("DECISION", cn,
          `${m.mark}: ${m.consequence.split(".")[0]}. Is naming/showing this mark cleared by your legal? (Spoken mentions pass generation; prominent rendered marks are refused and the attempt is billed.)`,
          `whether the prize can be SHOWN or only SAID in ${cn} creative`);
  for (const u of c.unresolved || [])
    ask("OPEN", cn, u, `${cn} planning`);
}

const stamp = new Date().toISOString().slice(0, 10);
const L = [`# ${brand.display_name || brandName} — open questions from the content engine`,
  ``,
  `_Generated ${stamp}. Each item names what it unblocks. Answers can be one line each; we record`,
  `who answered and when, and the engine unblocks automatically. Nothing on this list is optional`,
  `padding — every item is currently stopping or degrading a deliverable._`,
  ``];
for (const sev of ["BLOCKING", "DECISION", "CONFIRM", "OPEN"]) {
  const rows = Q.filter((q) => q.severity === sev);
  if (!rows.length) continue;
  L.push(`## ${sev === "BLOCKING" ? "🔴 Blocking — nothing ships until answered"
        : sev === "DECISION" ? "🟠 Decisions — legal/brand call"
        : sev === "CONFIRM" ? "🟡 Confirmations — one-line written yes"
        : "⚪ Open items"}`, ``);
  for (const q of rows) {
    L.push(`**${q.n}. [${q.area}]** ${q.question}`);
    L.push(`   _Unblocks: ${q.unblocks}_`, ``);
  }
}
L.push(`---`, `Answering: reply inline, or we record each answer with`,
  "`node brand-asks.mjs " + brandName + " record --campaign <c> --field <f> --value \"...\" --by \"name, channel, date\"`");

const out = path.join(BDIR, `ASKS-${stamp}.md`);
fs.writeFileSync(out, L.join("\n") + "\n");
console.log(`${Q.length} questions -> ${path.relative(__dirname, out)}`);
for (const sev of ["BLOCKING", "DECISION", "CONFIRM", "OPEN"])
  console.log(`  ${sev.padEnd(9)} ${Q.filter((q) => q.severity === sev).length}`);
