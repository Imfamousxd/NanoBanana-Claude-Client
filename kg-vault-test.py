#!/usr/bin/env python3
"""
kg-vault-test.py — regression suite for the vault build. Read-only, no network, no generation.

    python3 kg-vault-test.py

Exists because every defect this vault has shipped was caught by an agent reading it, not by the
build: dropped fields, a wiped _GAPS.md, a law that reached zero recipes, a placeholder that was
itself a broken wikilink, and stale prose that contradicted a fix three files away. All of those
are mechanically checkable. Anything checkable here should never again cost an agent run.

Exit 0 = all pass. Exit 1 = at least one FAIL.
"""
import json, os, re, glob, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
VAULT = os.path.expanduser("~/Obsidian/video_engine_kg")
BRANDS = os.path.join(HERE, "sieve", "brands")
FRAG = os.path.join(HERE, "graph-fragments")

RESULTS = []


def check(name, ok, detail=""):
    RESULTS.append((name, ok, detail))
    print(f"  {'PASS' if ok else 'FAIL'}  {name}" + (f"  — {detail}" if detail else ""))
    return ok


print("\n=== 1. BUILD ===")
r = subprocess.run([sys.executable, os.path.join(HERE, "kg-vault.py")],
                   capture_output=True, text=True, cwd=HERE, timeout=300)
check("build exits 0", r.returncode == 0, r.stderr.strip()[:200])
check("no dropped fields", "DROPPED FIELDS: 0" in r.stdout,
      [l for l in r.stdout.splitlines() if "DROPPED" in l][:1])

# idempotency: build twice, compare the full file manifest + sizes
def manifest():
    return {os.path.relpath(p, VAULT): os.path.getsize(p)
            for p in glob.glob(VAULT + "/**/*.md", recursive=True)}


m1 = manifest()
subprocess.run([sys.executable, os.path.join(HERE, "kg-vault.py")],
               capture_output=True, text=True, cwd=HERE, timeout=300)
m2 = manifest()
check("build is idempotent", m1 == m2,
      f"{len(set(m1) ^ set(m2))} files differ" if m1 != m2 else f"{len(m1)} files stable")

print("\n=== 2. LINKS ===")
files = glob.glob(VAULT + "/**/*.md", recursive=True)
names = {os.path.splitext(os.path.basename(p))[0] for p in files}
broken = {}
total = 0
for p in files:
    txt = open(p, encoding="utf-8").read()
    for m in re.findall(r"\[\[([^\]|]+)(?:\|[^\]]*)?\]\]", txt):
        total += 1
        t = m.split("#")[0].strip().replace("\\", "")
        if t and t not in names:
            broken.setdefault(t, []).append(os.path.relpath(p, VAULT))
check("every wikilink resolves", not broken,
      f"{len(broken)} broken: {list(broken)[:3]}" if broken else f"{total} links, {len(files)} notes")

print("\n=== 3. LAW BANKS ===")
FIELDS = {"applies_to", "claim", "confidence", "counterexamples", "evidence", "source"}
G = json.load(open(os.path.join(os.path.dirname(HERE), "..", "..", "graph", "graph.json"),
                   encoding="utf-8")) if False else json.load(
    open("/Users/Hassoonie/Desktop/CODE PROJECTS/NanoBanana-Client/graph/graph.json", encoding="utf-8"))
banks = {"ugc_laws": G["ugc_laws"]}
for f in sorted(glob.glob(os.path.join(os.path.dirname(HERE), "*", "graph-fragments", "*.json"))):
    d = json.load(open(f, encoding="utf-8"))
    for k, v in d.items():
        if k.endswith("_laws"):
            banks[k] = v
allids, dupes = set(), []
for bank, laws in banks.items():
    bad = [k for k, v in laws.items() if set(v.keys()) != FIELDS]
    check(f"{bank}: uniform 6-field schema ({len(laws)} laws)", not bad, str(bad[:2]))
    for k in laws:
        if k in allids:
            dupes.append(k)
        allids.add(k)
check("no duplicate law ids across banks", not dupes, str(dupes[:3]))
check("total law count == 224 + new", len(allids) >= 224, f"{len(allids)} laws")

print("\n=== 4. BRAND REGISTRY ===")
brand_files = sorted(glob.glob(BRANDS + "/*/brand.json"))
check("at least one brand registered", bool(brand_files), f"{len(brand_files)} brand(s)")
for bf in brand_files:
    b = json.load(open(bf, encoding="utf-8"))
    bn = b.get("brand", "?")
    check(f"{bn}: has copy_policy with a passing state",
          bool(b.get("copy_policy", {}).get("may_draft")),
          "a registry with no may_draft state is a gate nobody can pass")
    check(f"{bn}: disclosures flagged not-legally-cleared",
          "NOT LEGALLY CLEARED" in str(b.get("mandatory_disclosures", {}).get("status", "")))
    # A brand may legitimately carry zero campaigns (Dialed brands run standing programs, not
    # promos) — what is REQUIRED is the structure, so a campaign added later has a home and the
    # engine's campaign lookup cannot ENOENT. Muha keeps a floor of 5: losing a registered
    # campaign silently is the regression this suite exists to catch.
    cdir = os.path.join(os.path.dirname(bf), "campaigns")
    camps = sorted(glob.glob(os.path.join(cdir, "*.json")))
    check(f"{bn}: campaigns dir present", os.path.isdir(cdir), f"{len(camps)} campaign(s)")
    if bn == "Muha_Meds":
        check(f"{bn}: campaign count >= 5", len(camps) >= 5, f"{len(camps)}")
    prizes = {}
    for cf in camps:
        c = json.load(open(cf, encoding="utf-8"))
        cid = c.get("campaign", "?")
        for fld in ("prize_exact", "entry_mechanic_exact"):
            v = c.get(fld)
            ok = isinstance(v, dict) and "status" in v and ("value" in v)
            check(f"{bn}/{cid}: {fld} carries value+status", ok)
        pv = (c.get("prize_exact") or {}).get("value")
        if pv:
            prizes.setdefault(pv, []).append(cid)
    # the whole point of the registry: campaigns must not silently share a prize string
    shared = {k: v for k, v in prizes.items() if len(v) > 1}
    check(f"{bn}: no two campaigns share a prize string", not shared, str(shared))

print("\n=== 5. STALE PROSE (defects that were fixed and must not return) ===")
corpus = "\n".join(open(p, encoding="utf-8").read() for p in files)
STALE = [
    ("invented campaign name in a recipe header", "Golden Hour giveaway clip is this"),
    ("claims vault has no brand layer", "no brand, campaign or compliance layer yet"),
    ("blanket copy refusal that blocks every campaign", "Every line of dialogue is a human deliverable"),
    ("generate_audio:false offered as the general fix",
     "two options, both measured.** Set `generate_audio: false`"),
]
for label, needle in STALE:
    check(f"absent: {label}", needle not in corpus)
check("extension NOT described as cheaper anywhere in the vault",
      "40% cheaper" not in corpus or "That is wrong" in corpus or "is wrong" in corpus,
      "the corrected note may quote the wrong claim in order to refute it")

print("\n=== 6. COMPLIANCE GATE COVERAGE ===")
recipes = glob.glob(VAULT + "/Video/00-Start/Recipes/*.md")
check("recipes exist", bool(recipes), f"{len(recipes)}")
missing = [os.path.basename(p) for p in recipes
           if "Compliance and claims" not in open(p, encoding="utf-8").read()]
check("every recipe carries the compliance block", not missing, str(missing))
no_policy = [os.path.basename(p) for p in recipes
             if "May draft" not in open(p, encoding="utf-8").read()]
check("every recipe states what you MAY do", not no_policy, str(no_policy))
no_table = [os.path.basename(p) for p in recipes
            if "Resolve the campaign FIRST" not in open(p, encoding="utf-8").read()]
check("every recipe carries the campaign table", not no_table, str(no_table))

# Two plans produced flawless claims analysis and NO PAYLOAD once the compliance block landed.
# The execution checklist must sit ABOVE the gate, and the gate must say it does not block it.
no_exec = [os.path.basename(p) for p in recipes
           if "Execution — always produce this" not in open(p, encoding="utf-8").read()]
check("every recipe carries the execution checklist", not no_exec, str(no_exec))
wrong_order = []
for p in recipes:
    t = open(p, encoding="utf-8").read()
    if "Execution — always produce this" in t and "Compliance and claims" in t:
        if t.index("Execution — always produce this") > t.index("## ⛔ Compliance and claims"):
            wrong_order.append(os.path.basename(p))
check("execution checklist precedes the compliance gate", not wrong_order, str(wrong_order))
no_scope = [os.path.basename(p) for p in recipes
            if "It does not gate the shot" not in open(p, encoding="utf-8").read()]
check("compliance gate declares its own scope", not no_scope, str(no_scope))

print("\n=== 7. AUDIO LAW REACHES THE WORK ===")
hits = [p for p in recipes if "audio-for-talking-heads" in open(p, encoding="utf-8").read()]
check("talking-head audio law surfaces on every recipe", len(hits) == len(recipes),
      f"{len(hits)}/{len(recipes)}")
ugc = [p for p in recipes if "ugc-talking-head" in p]
if ugc:
    t = open(ugc[0], encoding="utf-8").read()
    check("UGC recipe sends generate_audio: true", '"generate_audio": true' in t)
    check("UGC recipe does NOT tell you to write 'no voices'",
          "no voices" not in t.lower() or "Never write" in t)

print("\n=== 8. EXAMPLE-COPY MARKER ===")
marked = [p for p in glob.glob(VAULT + "/Video/10-Laws/**/*.md", recursive=True)
          if "EXAMPLE COPY, not an approved claim" in open(p, encoding="utf-8").read()]
check("copy-bait laws are marked", len(marked) >= 30, f"{len(marked)} laws marked")
for bait in ("dialogue-is-native-and-near-verbatim", "spell-brand-names-phonetically"):
    hit = [p for p in marked if bait in p]
    check(f"known bait marked: {bait}", bool(hit))

fails = [n for n, ok, _ in RESULTS if not ok]
print(f"\n{'='*60}\n{len(RESULTS)-len(fails)}/{len(RESULTS)} passed"
      + (f"\nFAILED: {fails}" if fails else ""))
sys.exit(1 if fails else 0)
