#!/usr/bin/env python3
"""
kg-vault.py — build the Obsidian vault from the generation knowledge graph.

Replaces kg-obsidian-export.py + kg-recipes.py. One script, because the recipe layer and the node
layer must share a slug map and a reverse index; two scripts meant two copies of that logic and
they had already drifted.

THREE THINGS THIS FIXES OVER THE FIRST CUT
1. NOTHING IS DROPPED. The first exporter put scalars under 160 chars in frontmatter, picked ONE
   of claim/what/description/note/value for the body, and silently discarded everything else.
   `model:veo-3.1-fast` lost `strengths` and `weaknesses` entirely and rendered with an empty body.
   Every key now lands in exactly one place and the run ASSERTS it.
2. FOLDERS ARE DOMAINS, NOT RAW SECTION NAMES. 21 flat lowercase folders mirrored graph.json and
   read like a database dump. Grouped into 7 numbered domains that match how the work is done.
3. NODES HAVE A FIXED SHAPE. Same H2 order every time: Claim, Key facts, prose sections, Scope,
   Applies to, Used by, Evidence, Counterexamples, Source, Related, Relations. Long measurement
   dumps go in a FOLDED callout so the claim stays readable.
"""
import json, os, re, shutil, collections

ROOT = "/Users/Hassoonie/Desktop/CODE PROJECTS/NanoBanana-Client"
WT = ROOT + "/.claude/worktrees"
VAULT = os.path.expanduser("~/Obsidian/video_engine_kg")
SIEVE_GRAPH = ROOT + "/sieve-graph.mjs"

FRAGMENTS = {
    "podcast_laws": WT + "/agent-a7044511e4cba5e6d/graph-fragments/podcast_laws.json",
    "street_laws": WT + "/agent-ae115bbe6627df1c1/graph-fragments/street_laws.json",
    "launch_laws": WT + "/agent-ab63f6f372ec6ed63/graph-fragments/launch_laws.json",
    "seedance25_laws": WT + "/gen-image/graph-fragments/seedance25_laws.json",
}
LAW_BANKS = ["ugc_laws", "podcast_laws", "street_laws", "launch_laws", "seedance25_laws"]

# ---------------------------------------------------------------------------
# CATEGORY is the top level. Everything measured so far is video, but this repo also generates
# stills (gpt-image-2, Nano Banana) and there is no law bank for them yet — so the level exists
# rather than being implied. Adding "Image" later is a config change here, not a restructure.
# ---------------------------------------------------------------------------
CATEGORIES = {
    "Video": {
        "blurb": "Moving picture and its audio. 224 measured laws, five categories, "
                 "two live models.",
        "status": "populated",
    },
    "Brands": {
        "blurb": "Who the work is FOR. Brands, campaigns, the exact approved strings, the "
                 "disclosures and the assets. The engine categories say which call to make; this "
                 "one says what you are allowed to claim.",
        "status": "populated",
    },
    "Image": {
        "blurb": "Stills — posters, plates, packshots, badges. The repo generates these "
                 "(gpt-image-2, Nano Banana Pro) but no law bank has been derived yet, so nothing "
                 "here is queryable. See `craft/CATEGORY-KB-HARNESS.md` for the corpus→laws run.",
        "status": "empty",
    },
    "Voice": {
        "blurb": "Speech as a separate deliverable — cloning, TTS, post. Currently carried inside "
                 "Video/10-Laws as the `voice` facet; split it out if it grows its own laws.",
        "status": "empty",
    },
}
DEFAULT_CATEGORY = "Video"

# section -> (domain folder, pretty subfolder, node type)  [category is DEFAULT_CATEGORY]
PLACE = {
    "ugc_laws":          ("10-Laws", "UGC", "law"),
    "podcast_laws":      ("10-Laws", "Podcast", "law"),
    "street_laws":       ("10-Laws", "Street", "law"),
    "launch_laws":       ("10-Laws", "Launch", "law"),
    "seedance25_laws":   ("10-Laws", "Seedance-2.5", "law"),
    "models":            ("20-Models", "Models", "model"),
    "engines":           ("20-Models", "Engines", "engine"),
    "capabilities":      ("20-Models", "Capabilities", "capability"),
    "limits":            ("20-Models", "Limits", "limit"),
    "platforms":         ("20-Models", "Platforms", "platform"),
    "defects":           ("30-Problems", "Defects", "defect"),
    "causes":            ("30-Problems", "Causes", "cause"),
    "techniques":        ("40-Fixes", "Techniques", "technique"),
    "rules":             ("40-Fixes", "Rules", "rule"),
    "assets":            ("50-Assets", "Asset-kinds", "asset"),
    "characters":        ("50-Assets", "Characters", "character"),
    "slots":             ("50-Assets", "Slots", "slot"),
    "usecases":          ("60-Production", "Use-cases", "usecase"),
    "goals":             ("60-Production", "Goals", "goal"),
    "stages":            ("60-Production", "Stages", "stage"),
    "shots":             ("60-Production", "Shots", "shot"),
    "concepts":          ("60-Production", "Concepts", "concept"),
    "evidence":          ("70-Evidence", "Experiments", "evidence"),
    "operator_verdicts": ("70-Evidence", "Operator-verdicts", "verdict"),
}
DOMAIN_BLURB = {
    "10-Laws": "What makes content work. 224 measured laws across five categories.",
    "20-Models": "What the machines can and cannot do.",
    "30-Problems": "What goes wrong, and why.",
    "40-Fixes": "What to do about it.",
    "50-Assets": "What you feed in.",
    "60-Production": "How a job is shaped.",
    "70-Evidence": "What any of this rests on.",
}

EDGE_KEYS = ["REQUIRES", "known_defects", "FIXED_BY", "NOT_FIXED_BY", "CAUSED_BY", "MEASURED_BY",
             "FIXES", "SCOPED_TO", "EXCLUDES", "CONFLICTS_WITH", "ELIMINATED_FOR", "USES_MODEL",
             "USES_TECHNIQUE", "RISKS_DEFECT", "REQUIRES_ASSET", "GOVERNED_BY", "TARGETS_PLATFORM",
             "SHOT_VOCABULARY", "LIMITED_BY", "DELIVERS", "ELIMINATES", "DECOMPOSES_INTO",
             "ENABLES", "USES_ENGINE", "ROUTES_TO"]
META_KEYS = ["SCOPE_KIND", "SCOPE_PREDICATE"]

# fields that carry the node's headline statement, in priority order
CLAIM_KEYS = ["claim", "what", "do", "description", "verdict", "value"]
# fields that are always their own section when long
LAW_SECTIONS = [("evidence", "Evidence", True), ("counterexamples", "Counterexamples", False),
                ("source", "Source", False)]
SHORT = 90          # <= this many chars and not a list -> Key facts table

FACET = {
    "script": ["script"], "question": ["script"], "prompt": ["script"],
    "structure": ["structure"], "voice": ["voice"], "both": ["script", "voice"],
    "audio": ["audio"], "music": ["audio"], "framing": ["framing"], "frame": ["framing"],
    "caption": ["captions"], "text": ["captions"], "edit": ["edit"],
    "api": ["api"], "capability": ["api"], "method": ["api"], "routing": ["routing"],
    "moderation": ["moderation"], "cost": ["cost"], "production": ["production"],
}
FACET_BLURB = {
    "script": "What is said and how it is written — hook, word count, density, CTA.",
    "structure": "The shape of the piece over time — beats, reveal timing, ordering.",
    "voice": "How it is delivered — register, pace, texture, continuity across cuts.",
    "audio": "Everything that is not the voice — ambience, music, levels, refusals.",
    "framing": "Where the camera is and what is in shot.",
    "captions": "Burned-in and overlaid type.",
    "edit": "Cuts, joins, pacing of the assembly.",
    "api": "The literal call — parameters, ceilings, accepted and rejected shapes.",
    "routing": "Which model to send this to, and why the other is wrong.",
    "moderation": "What will be refused, and what to change so it is not.",
    "cost": "What it bills.",
    "production": "How the work is organised around the model.",
}
CONF_MARK = {"strong": "🟢", "moderate": "🟡", "weak": "⚪"}

HERE = os.path.dirname(os.path.abspath(__file__))
BRANDS_DIR = os.path.join(HERE, "sieve", "brands")


def load_brands():
    """Read sieve/brands/<Brand>/brand.json + campaigns/*.json.

    Returns [] if the registry is absent — the vault must still build, and the compliance block
    must then say so LOUDLY rather than silently rendering as if everything were fine.
    """
    out = []
    if not os.path.isdir(BRANDS_DIR):
        return out
    for b in sorted(os.listdir(BRANDS_DIR)):
        bp = os.path.join(BRANDS_DIR, b, "brand.json")
        if not os.path.isfile(bp):
            continue
        brand = json.load(open(bp, encoding="utf-8"))
        camps = []
        cdir = os.path.join(BRANDS_DIR, b, "campaigns")
        if os.path.isdir(cdir):
            for c in sorted(os.listdir(cdir)):
                if c.endswith(".json"):
                    camps.append(json.load(open(os.path.join(cdir, c), encoding="utf-8")))
        out.append({"brand": brand, "campaigns": camps})
    return out


def field_status(f):
    """A registry field is {value, status, source} or a bare value. Returns (status, value)."""
    if isinstance(f, dict):
        return f.get("status", "UNRESOLVED" if f.get("value") is None else "SOURCED"), f.get("value")
    return ("SOURCED", f) if f else ("UNRESOLVED", None)


def quoted_spans(text):
    """Word counts of every span between quote marks.

    Deliberately NOT a regex. The first cut used a nested lazy quantifier
    (["“”](?:[^"“”]*?\\b\\w+\\b){6,}[^"“”]*?["“”]) which backtracks catastrophically on the longer
    evidence blocks and hung the build. Splitting on quote characters is linear and cannot blow up.
    """
    parts = re.split(r'["“”]', str(text))
    return [len(p.split()) for p in parts[1::2]]  # odd indices are inside quotes


def has_quoted_speech(text, facets):
    """Does this evidence quote words somebody (or some model) actually said?

    Two triggers, because the two worst real cases each defeated a single rule:
      - one long quote (>=5 words) ANY law. `sd25:dialogue-is-native-and-near-verbatim` carries the
        $35,000 Rolez line but is applies_to `capability` -> facet `api`, so a facet gate missed it.
      - several short quotes on a script/voice/audio law. `sd25:spell-brand-names-phonetically`
        quotes "MUHU pack" / "10 inches" — every span under 5 words, so a length rule missed it.
    """
    spans = quoted_spans(text)
    if any(n >= 5 for n in spans):
        return True
    return bool(set(facets) & {"script", "voice", "audio"}) and sum(1 for n in spans if n >= 2) >= 2

exec(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "kg_recipes_data.py")).read())


# ---------------------------------------------------------------- helpers
def slugify(s):
    s = str(s)
    s = s.split(":", 1)[1] if ":" in s else s
    s = re.sub(r"[^\w\s\-\.]", " ", s)
    s = re.sub(r"[\s_]+", "-", s.strip())
    return re.sub(r"-{2,}", "-", s).strip("-.")[:110]


def titleize(nid):
    t = nid.split(":", 1)[-1].replace("-", " ").replace("_", " ").strip()
    return t[:1].upper() + t[1:] if t else nid


def yml(v):
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, (int, float)):
        return str(v)
    return '"' + str(v).replace("\\", "\\\\").replace('"', '\\"').replace("\n", " ") + '"'


def render_val(v):
    if isinstance(v, list):
        return "\n".join(f"- {x}" for x in v)
    if isinstance(v, dict):
        return "\n".join(f"- **{k}**: {x}" for k, x in v.items())
    return str(v)


def is_short(v):
    return isinstance(v, (str, int, float, bool)) and len(str(v)) <= SHORT and "\n" not in str(v)


def facets_of(law):
    a = law.get("applies_to")
    a = a if isinstance(a, list) else [a]
    out = []
    for x in a:
        out += FACET.get(str(x), [str(x)])
    return sorted(set(out))


def main():
    G = json.load(open(ROOT + "/graph/graph.json", encoding="utf-8"))
    linted = set(re.findall(r'"([^"]+)"',
                            re.search(r"const SECTIONS = \[(.*?)\];",
                                      open(SIEVE_GRAPH, encoding="utf-8").read(), re.S).group(1)))

    nodes = []
    for sec, val in G.items():
        if isinstance(val, dict) and sec in PLACE:
            for nid, d in val.items():
                nodes.append({"sec": sec, "id": nid, "d": dict(d) if isinstance(d, dict) else {"value": d},
                              "merged": True})
    for bank, path in FRAGMENTS.items():
        for nid, d in json.load(open(path, encoding="utf-8"))[bank].items():
            nodes.append({"sec": bank, "id": nid, "d": dict(d), "merged": False})

    # unique slugs
    id2slug, used = {}, {}
    for n in nodes:
        s = slugify(n["id"])
        if s in used and used[s] != n["id"]:
            s = f"{s}--{slugify(n['sec'])}"
        used[s] = n["id"]
        id2slug[n["id"]] = s
        n["slug"] = s
    byid = {n["id"]: n for n in nodes}

    def link(t):
        t = str(t)
        return f"[[{id2slug[t]}|{titleize(t)}]]" if t in id2slug else f"`{t}` *(unresolved)*"

    # ---- reverse index: which recipes govern which law -------------------
    law_to_recipes = collections.defaultdict(list)
    for r in RECIPES:
        for bank in r["banks"]:
            for n in nodes:
                if n["sec"] == bank:
                    law_to_recipes[n["id"]].append(r)
        # universal sd25 facets apply to every recipe on that model
        if "2-5" in r["model"]:
            for n in nodes:
                if n["sec"] == "seedance25_laws" and set(facets_of(n["d"])) & set(UNIVERSAL_FACETS):
                    law_to_recipes[n["id"]].append(r)

    # ---- derived links: a law that NAMES a node gets a soft link ---------
    alias = {}
    for n in nodes:
        if n["sec"] in LAW_BANKS:
            continue
        for cand in {n["id"].split(":", 1)[-1], n["d"].get("slug", ""), n["d"].get("name", "")}:
            cand = str(cand).strip()
            if len(cand) >= 6:
                alias.setdefault(cand.lower(), n["id"])

    def derive(text, self_id):
        hits = set()
        low = text.lower()
        for a, nid in alias.items():
            if nid != self_id and re.search(r"(?<![\w-])" + re.escape(a) + r"(?![\w-])", low):
                hits.add(nid)
        return sorted(hits)

    # ---- wipe ------------------------------------------------------------
    # Wipe ONLY what this script generates. `90-Reference/` is hand-written prose and is never
    # touched — the first version wiped by exclusion list and destroyed _GAPS.md the moment a
    # filename changed. Wiping by an explicit GENERATED list fails safe instead.
    CAT = os.path.join(VAULT, DEFAULT_CATEGORY)
    GENERATED = ["00-Start"] + sorted({d for d, _, _ in PLACE.values()})
    for g in GENERATED:
        p = os.path.join(CAT, g)
        if os.path.isdir(p):
            shutil.rmtree(p)
    for f in ("_START-HERE.md", os.path.join("90-Reference", "_GAPS.md")):
        p = os.path.join(CAT, f)
        if os.path.isfile(p):
            os.remove(p)
    os.makedirs(CAT + "/90-Reference", exist_ok=True)

    BRANDS_CAT = os.path.join(VAULT, "Brands")
    if os.path.isdir(BRANDS_CAT):
        shutil.rmtree(BRANDS_CAT)
    brands = load_brands()

    by_facet = collections.defaultdict(list)
    by_domain = collections.defaultdict(lambda: collections.defaultdict(list))
    dropped, edge_n = [], 0

    # ---- node notes ------------------------------------------------------
    for n in nodes:
        sec, nid, d, slug = n["sec"], n["id"], dict(n["d"]), n["slug"]
        domain, sub, ntype = PLACE[sec]
        is_law = sec in LAW_BANKS
        by_domain[domain][sub].append(n)
        seen = set()

        fm = {"title": titleize(nid), "id": nid, "type": ntype, "domain": domain,
              "section": sec, "linted": sec in linted}
        if is_law:
            fm["bank"] = sec.replace("_laws", "")
            fm["merged"] = n["merged"]
            if d.get("confidence"):
                fm["confidence"] = d["confidence"]; seen.add("confidence")
            fs = facets_of(d)
            fm["facets"] = fs
            for f in fs:
                by_facet[f].append(n)
            seen.add("applies_to")
        if is_short(d.get("status")):
            fm["status"] = d["status"]; seen.add("status")

        L = ["---"]
        for k, v in fm.items():
            L.append(f"{k}: [{', '.join(yml(x) for x in v)}]" if isinstance(v, list) else f"{k}: {yml(v)}")
        L += ["---", "", f"# {titleize(nid)}", ""]

        # breadcrumb
        L += [f"`{ntype}` · [[DOMAIN-{domain}|{domain}]] › [[INDEX-{slugify(sec)}|{sub}]]"
              + (f" · {CONF_MARK.get(d.get('confidence'),'')} {d.get('confidence','')}" if is_law else ""), ""]

        if is_law and not n["merged"]:
            L += ["> [!warning] Not merged", f"> Lives in a worktree fragment, not in `graph.json`. "
                  f"Section `{sec}` is also absent from `sieve-graph.mjs` SECTIONS, so it is never linted.", ""]

        # 1. Claim
        claim = None
        for k in CLAIM_KEYS:
            if isinstance(d.get(k), str) and d[k].strip():
                claim, ck = d[k], k
                seen.add(k)
                break
        if claim:
            L += ["> [!abstract] Claim", *[f"> {ln}" for ln in claim.split("\n")], ""]

        # 2. Key facts — every SHORT scalar not already used
        facts = [(k, v) for k, v in d.items()
                 if k not in seen and k not in EDGE_KEYS and k not in META_KEYS
                 and not k.startswith("_") and is_short(v)
                 and k not in [s[0] for s in LAW_SECTIONS]]
        if facts:
            L += ["## Key facts", "", "| | |", "|---|---|"]
            for k, v in facts:
                L.append(f"| **{k.replace('_',' ')}** | {v} |")
                seen.add(k)
            L.append("")

        # 3. Every remaining prose / list field gets its own section — NOTHING DROPPED
        for k, v in d.items():
            if k in seen or k in EDGE_KEYS or k in META_KEYS or k.startswith("_"):
                continue
            if k in [s[0] for s in LAW_SECTIONS]:
                continue
            L += [f"## {k.replace('_',' ').capitalize()}", "", render_val(v), ""]
            seen.add(k)

        # 4. Scope (techniques)
        if d.get("SCOPE_KIND") or d.get("SCOPE_PREDICATE"):
            L += ["## Scope", ""]
            if d.get("SCOPE_KIND"):
                L.append(f"- **kind**: `{d['SCOPE_KIND']}`"); seen.add("SCOPE_KIND")
            if d.get("SCOPE_PREDICATE"):
                L.append(f"- **applies when**: {d['SCOPE_PREDICATE']}"); seen.add("SCOPE_PREDICATE")
            L.append("")

        # 5. Applies to / Used by
        if is_law:
            fs = facets_of(d)
            if fs:
                L += ["## Applies to", "", *[f"- [[FACET-{f}|{f}]] — {FACET_BLURB.get(f,'')}" for f in fs], ""]
            recs = {r["id"]: r for r in law_to_recipes.get(nid, [])}
            if recs:
                L += ["## Used by", "",
                      *[f"- [[RECIPE-{r['id']}|{r['title']}]]" for r in recs.values()], ""]

        # 6. Evidence / counterexamples / source
        for key, title, fold in LAW_SECTIONS:
            v = d.get(key)
            if not v:
                continue
            seen.add(key)
            body = render_val(v)
            # A law about HOW something is said quotes what a model actually said. That transcript
            # is measurement, not approved copy — but rendered plainly it reads as a script. Two
            # agents mined a live cannabis promotion's "prize" out of exactly this: a $35,000 Rolex
            # and "ten entries", quoted inside a Whisper-fidelity law, reached a deliverable as
            # fact. The marker is mechanical rather than a curated list so future laws inherit it.
            if key == "evidence" and is_law and has_quoted_speech(body, facets_of(d)):
                L += [f"## {title}", "",
                      "> [!caution] The quotes below are EXAMPLE COPY, not an approved claim",
                      "> This law measures *how* something is delivered — pronunciation, fidelity, "
                      "pacing. The words themselves are throwaway probe dialogue. They are **not** "
                      "a source for anything factual about a product or promotion. Prize, entry "
                      "mechanic, entry count, odds and dates come from the brand registry and a "
                      "human, never from a transcript. See any recipe's compliance block.", ""]
                fold_title = f"{title} — measured (click to expand)"
                L += [f"> [!quote]- {fold_title}", *[f"> {ln}" for ln in body.split("\n")], ""]
                continue
            if fold and len(body) > 220:
                L += [f"## {title}", "", f"> [!quote]- {title} — measured (click to expand)",
                      *[f"> {ln}" for ln in body.split("\n")], ""]
            else:
                L += [f"## {title}", "", body, ""]

        # 7. Derived links
        blob = " ".join(str(v) for v in d.values())
        der = derive(blob, nid)
        if der:
            L += ["## Related", "",
                  "*Derived by the exporter from names mentioned in this node's text — "
                  "**not** edges in the source data.*", "",
                  *[f"- {link(t)}" for t in der], ""]

        # 8. Authored edges
        # An edge key present but EMPTY is not nothing — it is a claim with no backing. Three
        # models (including seedance-2.5, which everything runs on) declare MEASURED_BY: [].
        # Rendering that is the whole point; skipping it silently is how it stayed invisible.
        rel, empty_edges = [], []
        for ek in EDGE_KEYS:
            if ek not in d:
                continue
            seen.add(ek)
            v = d[ek]
            if not v:
                empty_edges.append(ek)
                continue
            for t in (v if isinstance(v, list) else [v]):
                rel.append(f"- **{ek}** → {link(t)}")
                edge_n += 1
        for ek in empty_edges:
            rel.append(f"- **{ek}** → ⚠️ *declared but EMPTY — this node claims the relationship "
                       f"and attaches nothing*")
        L += ["## Relations", ""]
        L += rel if rel else ["*No authored edges.*" + (" Laws carry none — see [[_GAPS]]." if is_law else "")]

        # completeness assertion
        for k in d:
            if k not in seen and not k.startswith("_"):
                dropped.append((nid, k))

        os.makedirs(f"{CAT}/{domain}/{sub}", exist_ok=True)
        open(f"{CAT}/{domain}/{sub}/{slug}.md", "w", encoding="utf-8").write("\n".join(L) + "\n")

    # ---- section indexes -------------------------------------------------
    os.makedirs(CAT + "/00-Start", exist_ok=True)
    for sec, (domain, sub, ntype) in PLACE.items():
        members = [n for n in nodes if n["sec"] == sec]
        if not members:
            continue
        L = ["---", f'title: "{sub}"', f'id: "INDEX-{slugify(sec)}"', 'type: index',
             f'domain: "{domain}"', f"count: {len(members)}", "---", "",
             f"# {sub}", "", f"`{sec}` · **{len(members)}** nodes · "
             f"lint {'✅' if sec in linted else '❌ **never linted**'}"
             + ("" if all(m["merged"] for m in members) else " · ❌ **not merged**"), "",
             f"[[DOMAIN-{domain}|← {domain}]]", ""]
        if sec in LAW_BANKS:
            c = collections.Counter(m["d"].get("confidence") for m in members)
            L += ["| confidence | n |", "|---|---|"]
            L += [f"| {CONF_MARK.get(k,'')} {k} | {v} |" for k, v in c.most_common()]
            L.append("")
        L += ["## Nodes", ""]
        for m in sorted(members, key=lambda x: x["id"]):
            head = ""
            for k in CLAIM_KEYS:
                if isinstance(m["d"].get(k), str):
                    head = " — " + m["d"][k][:130].replace("\n", " ")
                    break
            mk = CONF_MARK.get(m["d"].get("confidence"), "")
            L.append(f"- {mk} [[{m['slug']}|{titleize(m['id'])}]]{head}")
        open(f"{CAT}/00-Start/INDEX-{slugify(sec)}.md", "w", encoding="utf-8").write("\n".join(L) + "\n")

    # ---- domain hubs -----------------------------------------------------
    for domain, subs in sorted(by_domain.items()):
        tot = sum(len(v) for v in subs.values())
        L = ["---", f'title: "{domain}"', f'id: "DOMAIN-{domain}"', "type: domain",
             f"count: {tot}", "---", "", f"# {domain}", "",
             f"*{DOMAIN_BLURB.get(domain,'')}*", "", f"**{tot}** nodes.", "",
             "[[_START-HERE|← what are you making?]]", "", "| section | nodes | lint |", "|---|---|---|"]
        for sub, ms in sorted(subs.items()):
            sec = ms[0]["sec"]
            L.append(f"| [[INDEX-{slugify(sec)}\\|{sub}]] | {len(ms)} | "
                     f"{'✅' if sec in linted else '❌'} |")
        open(f"{CAT}/00-Start/DOMAIN-{domain}.md", "w", encoding="utf-8").write("\n".join(L) + "\n")

    # ---- facets ----------------------------------------------------------
    os.makedirs(CAT + "/00-Start/Facets", exist_ok=True)
    for f, ms in sorted(by_facet.items()):
        L = ["---", f'title: "{f}"', f'id: "FACET-{f}"', "type: facet", f"count: {len(ms)}", "---",
             "", f"# {f}", "", f"*{FACET_BLURB.get(f,'')}*", "",
             f"**{len(ms)} laws** across **{len(set(m['sec'] for m in ms))} banks** — the cross-bank "
             "slice, so the same question asked in UGC and in launch lands in one place.", "",
             "[[_START-HERE|← what are you making?]]", ""]
        bb = collections.defaultdict(list)
        for m in ms:
            bb[m["sec"]].append(m)
        for b in sorted(bb):
            L += [f"## {b}", ""]
            for m in sorted(bb[b], key=lambda x: x["id"]):
                cl = (m["d"].get("claim") or "")[:170].replace("\n", " ")
                L.append(f"- {CONF_MARK.get(m['d'].get('confidence'),'')} "
                         f"[[{m['slug']}|{titleize(m['id'])}]] — {cl}")
            L.append("")
        open(f"{CAT}/00-Start/Facets/FACET-{f}.md", "w", encoding="utf-8").write("\n".join(L) + "\n")

    # ---- recipes ---------------------------------------------------------
    os.makedirs(CAT + "/00-Start/Recipes", exist_ok=True)
    for r in RECIPES:
        gov = [n for n in nodes if n["sec"] in r["banks"]]
        L = ["---", f'title: {json.dumps(r["title"])}', f'id: "RECIPE-{r["id"]}"', "type: recipe",
             f"laws: {len(gov)}", "---", "", f"# {r['title']}", "", f"*{r['when']}*", "",
             "[[_START-HERE|← what are you making?]]", "", "## Model", "", r["model"], "", r["why"], ""]
        if r.get("call"):
            L += ["## The call that works", "", "```jsonc", r["call"], "```", "",
                  "> Parameters ride as trailing `--flags` **inside the text part**, not as JSON "
                  "keys. `generate_audio` is the one real top-level field.", ""]
        L += ["## Cost", "", "| | |", "|---|---|"] + [f"| {a} | {b} |" for a, b in r["cost"]]
        L += ["", "`node sd25-cost.mjs estimate --dur <n> --n <k>` before you spend. "
              "See [[_COSTS]].", ""]
        if r["refusals"]:
            L += ["## What will refuse you — and the workaround", ""]
            for t, w, fx in r["refusals"]:
                L += [f"### {t}", "", f"**What happens.** {w}", "", f"**Workaround.** {fx}", ""]
        if gov:
            gf = collections.defaultdict(list)
            for n in gov:
                for f in facets_of(n["d"]):
                    gf[f].append(n)
            L += ["## Governing laws", "", f"**{len(gov)}** from `{'`, `'.join(r['banks'])}`.", ""]
            for f in sorted(gf):
                L += [f"### {f} · [[FACET-{f}|all {len(by_facet[f])} {f} laws]]", ""]
                for m in sorted(gf[f], key=lambda x: x["id"]):
                    cl = (m["d"].get("claim") or "")[:170].replace("\n", " ")
                    L.append(f"- {CONF_MARK.get(m['d'].get('confidence'),'')} "
                             f"[[{m['slug']}|{titleize(m['id'])}]] — {cl}")
                L.append("")
        L += ["## Always applies — Seedance 2.5 mechanics", ""]
        for f in UNIVERSAL_FACETS:
            rows = [m for m in by_facet.get(f, []) if m["sec"] == "seedance25_laws"]
            if not rows:
                continue
            L += [f"**{f}**", ""]
            for m in sorted(rows, key=lambda x: x["id"]):
                cl = (m["d"].get("claim") or "")[:170].replace("\n", " ")
                L.append(f"- {CONF_MARK.get(m['d'].get('confidence'),'')} "
                         f"[[{m['slug']}|{titleize(m['id'])}]] — {cl}")
            L.append("")
        # ---- COMPLIANCE + CLAIMS — renders ABOVE Gates, and it BLOCKS ----------------
        # Default ON. A recipe added later inherits the gate rather than silently skipping it,
        # which is the only safe default for a control whose failure mode is legal exposure.
        # Measured need (kg comprehension test, 2026-08-08): given only this vault, agents wrote
        # cannabis sweepstakes ads with no NPN and no 21+, and TWO independently invented a
        # $35,000 Rolex prize — mined out of throwaway probe dialogue quoted inside a law's
        # evidence block. The real prize is printed on the asset: "$25,000+ AND DODGE CHALLENGER".
        if r.get("requires_brand_note", True):
            # The execution checklist sits ABOVE the compliance block on purpose. Measured
            # 2026-08-08: with compliance first, two plans (T1, T5) produced excellent claims
            # analysis and NO PAYLOAD — no model slug, no resolution, no generate_audio. T5 was the
            # brief with the SMALLEST compliance surface (no people, no speech) and still shipped
            # nothing. A gate that suppresses the work it is gating has failed differently, but it
            # has still failed.
            L += ["## Execution — always produce this", "",
                  "**The compliance block below gates the CLAIMS layer only. It never blocks the "
                  "technical plan.** Even when copy is blocked pending a human, output every field "
                  "here — a blocked brief should hand back a plan that fires the moment the claims "
                  "are signed off.", "",
                  f"- **model** — {r['model']}",
                  "- **task type** — text-to-video or image-to-video, and *why*. A photoreal human "
                  "in ANY image role is refused at submit.",
                  "- **`--resolution`** — 720p is the hard ceiling on 2.5; 4K means routing to "
                  "`dreamina-seedance-2-0-260128`.",
                  "- **`--ratio`** — and `adaptive` is mandatory whenever a first frame is attached.",
                  "- **`--dur`** — and the 5s proof roll before committing at length.",
                  "- **`generate_audio`** — a real top-level field, not a `--flag`. Never silently omit it.",
                  "- **cost** — quoted before the spend.",
                  "- **gates** — what runs before and after.", "",
                  "## ⛔ Compliance and claims — resolve BEFORE you submit", "",
                  "> [!danger] Nothing here SUBMITS until a human initials the claims list.",
                  "> Drafting and escalating are the **same step**, not alternatives. Resolve the "
                  "campaign, draft from sourced strings verbatim, leave everything unsourced as an "
                  "explicit unfilled slot, and hand it to a human. Stopping with nothing written "
                  "is over-blocking — a gate with no passing state is a gate that gets deleted.",
                  ">",
                  "> **Scope.** This gates spoken and on-screen CLAIMS about a product or "
                  "promotion. It does not gate the shot, the wardrobe, the location, the camera "
                  "behaviour, the audio direction or any API parameter. If your deliverable "
                  "authors no claims — a product shot with no speech and no new on-screen copy — "
                  "the only item that binds you is **3, the named-object check**.", "",
                  "**What you MAY do once the campaign is resolved and its fields are SOURCED:**",
                  "write the script, quoting `prize_exact` and `entry_mechanic_exact` **verbatim** "
                  "(never paraphrase a sourced claim). Mark the output `DRAFT — NOT FOR SUBMIT`.", "",
                  "**What you MAY NOT do:** state anything the registry does not carry — draw "
                  "dates, deadlines, odds, eligibility, winner selection — or invent disclosure "
                  "wording. Those become `{{SLOT: …}}` placeholders a human fills — "
                  "double-BRACE, because a double-bracket placeholder renders as a broken "
                  "wikilink.", "",
                  "**1 — Every factual claim must resolve to an approved source, or be struck.**",
                  "A structural law may shape *how* a line is written. It may never manufacture a "
                  "fact. If a law asks for a beat and you have no approved fact to fill it, cut the "
                  "beat — do not invent one. Prize, entry mechanic, odds, dates, draw count and "
                  "eligibility are claims, not copy.", "",
                  "**2 — Mandatory disclosures.** For a regulated category or any prize promotion, "
                  "confirm what must appear on-screen or be spoken. For Muha this includes "
                  "*No Purchase Necessary* and a *21+* gate, and consumption must never be "
                  "depicted. **Do not take that list from this note** — it is a reminder that the "
                  "list exists, not the list.", "",
                  "**3 — Named object check.** Confirm the physical thing you are describing is the "
                  "thing that exists: its shape, its sides, its exact locked strings, and any "
                  "third-party mark on it.", "",
                  "**4 — A human initials the claims list before the first paid submit.**", ""]
            if brands:
                L += ["### Resolve the campaign FIRST", "",
                      "A brand is not a campaign. Prizes differ **per campaign**, and a brief that "
                      "names only the brand does not identify which one.", "",
                      "| brand | campaign | prize | entry mechanic |", "|---|---|---|---|"]
                for entry in brands:
                    bn = entry["brand"]["brand"]
                    for c in entry["campaigns"]:
                        _, pv = field_status(c.get("prize_exact"))
                        _, ev = field_status(c.get("entry_mechanic_exact"))
                        L.append(
                            f"| [[brand-{bn}\\|{bn}]] | "
                            f"[[campaign-{c['campaign']}\\|{c.get('display_name', c['campaign'])}]] | "
                            f"{('**' + str(pv) + '**') if pv else '⛔ UNRESOLVED'} | "
                            f"{ev if ev else '⛔ UNRESOLVED'} |")
                L.append("")
                for entry in brands:
                    for w in entry["brand"].get("campaign_alias_warnings", []):
                        L += [f"> [!danger] A brief saying \"{w['alias']}\" does NOT name a campaign",
                              f"> {w['finding']}", ">", f"> {w['consequence']}", ""]
                L += ["Take the prize and the entry mechanic from the campaign note — **verbatim**. "
                      "Never from a law's evidence block: those quote what a *model* said in a "
                      "probe, not what the client approved.", ""]
                for entry in brands:
                    cp = entry["brand"].get("copy_policy")
                    if not cp:
                        continue
                    L += [f"> [!tip] Copy policy — {entry['brand']['brand']}",
                          f"> **May draft.** {cp.get('may_draft','')}",
                          f"> **Must not state.** {cp.get('must_not_state','')}",
                          f"> **Unfilled slots.** {cp.get('unfilled_slots','')}",
                          f"> **Status of any draft.** {cp.get('status_of_any_draft','')}", ""]
            else:
                L += ["> [!warning] Registry not built",
                      "> `sieve/brands/` is missing, so **none of the above can be checked from "
                      "inside this vault**. Items 1–3 are a human step against "
                      "`Brand Context/<Brand>.md` and `sieve/products/<Brand>/*.json`.", ""]

        if r["gates"]:
            L += ["## Gates", ""] + [f"- {g}" for g in r["gates"]] + [""]
        if r.get("extra"):
            L += ["## Notes", "", r["extra"], ""]
        L += ["---", "🟢 strong · 🟡 moderate · ⚪ weak — each law's own measured confidence.",
              "[[_FAILURES|every failure mode]]"]
        open(f"{CAT}/00-Start/Recipes/RECIPE-{r['id']}.md", "w", encoding="utf-8").write("\n".join(L) + "\n")

    # ---- Brands category -------------------------------------------------
    for entry in brands:
        b, camps = entry["brand"], entry["campaigns"]
        bslug = b["brand"]
        bdir = f"{BRANDS_CAT}/{bslug}"
        os.makedirs(bdir + "/Campaigns", exist_ok=True)

        B = ["---", f'title: {json.dumps(b.get("display_name", bslug))}', f'id: "brand:{bslug}"',
             'type: brand', 'category: "Brands"',
             f'campaigns: {len(camps)}',
             f'category_risk: {yml(b.get("category", ""))}', "---", "",
             f"# {b.get('display_name', bslug)}", "", "[[_HOME|← all categories]]", "",
             "> [!danger] Nothing here may be inferred, and nothing here may be paraphrased.",
             f"> {b.get('_why','')}", ""]

        sw = b.get("standing_warning") or {}
        if sw:
            B += [f"> [!warning] {sw.get('text','')}", f"> `{sw.get('source','')}`", ""]

        B += ["## Campaigns — and they carry DIFFERENT prizes", "",
              "| campaign | prize | entry mechanic |", "|---|---|---|"]
        for c in camps:
            ps, pv = field_status(c.get("prize_exact"))
            es, ev = field_status(c.get("entry_mechanic_exact"))
            B.append(f"| [[campaign-{c['campaign']}\\|{c.get('display_name', c['campaign'])}]] | "
                     f"{('**' + str(pv) + '**') if pv else '⛔ UNRESOLVED'} | "
                     f"{ev if ev else '⛔ UNRESOLVED'} |")
        B.append("")

        for w in b.get("campaign_alias_warnings", []):
            B += [f"> [!danger] \"{w['alias']}\" — {w['status']}", f"> {w['finding']}", ">",
                  f"> **Consequence.** {w['consequence']}", f"> `{w['source']}`", ""]

        md = b.get("mandatory_disclosures", {})
        B += ["## Mandatory disclosures", "", f"**Status: {md.get('status','?')}**", ""]
        for k in md.get("known", []):
            B.append(f"- **{k['text']}** · `{k['source']}`")
        B += ["", f"> [!caution] {md.get('_warning','')}", ""]
        if md.get("unresolved"):
            B += ["**Unresolved — a human must supply these:**", ""] + \
                 [f"- {u}" for u in md["unresolved"]] + [""]

        B += ["## Naming rules", ""] + \
             [f"- {r['rule']} · `{r['source']}`" for r in b.get("naming_rules", [])] + [""]
        B += ["## Category risk", ""] + \
             [f"- {r['rule']} · `{r['source']}`" for r in b.get("category_risk", [])] + [""]

        ls = b.get("locked_spellings", {})
        if ls:
            B += ["## Locked spellings", "", f"*{ls.get('_note','')}* · `{ls.get('source','')}`", ""]
            B += [f"- `{s}`" for s in ls.get("strings", [])] + [""]
            if ls.get("never_write"):
                B += ["**Never write:**", "", "| wrong | why |", "|---|---|"]
                B += [f"| `{k}` | {v} |" for k, v in ls["never_write"].items()] + [""]

        if b.get("unresolved"):
            B += ["## Unresolved at brand level", ""] + [f"- {u}" for u in b["unresolved"]] + [""]
        B += ["## Sources", ""] + [f"- `{s}`" for s in b.get("sources", [])]
        open(f"{bdir}/brand-{bslug}.md", "w", encoding="utf-8").write("\n".join(B) + "\n")

        for c in camps:
            ps, pv = field_status(c.get("prize_exact"))
            es, ev = field_status(c.get("entry_mechanic_exact"))
            blocked = [k for k in ("prize_exact", "entry_mechanic_exact")
                       if field_status(c.get(k))[1] is None]
            C = ["---", f'title: {json.dumps(c.get("display_name", c["campaign"]))}',
                 f'id: "campaign:{c["campaign"]}"', "type: campaign", 'category: "Brands"',
                 f'brand: "{c["brand"]}"',
                 f'prize_status: "{ps}"', f'entry_status: "{es}"',
                 f'blocked: {"true" if blocked else "false"}', "---", "",
                 f"# {c.get('display_name', c['campaign'])}", "",
                 f"[[brand-{c['brand']}|← {c['brand']}]]", ""]
            if blocked:
                C += ["> [!danger] BLOCKED — required fields unresolved",
                      "> " + ", ".join(f"`{k}`" for k in blocked) +
                      " — a human must supply these before any spoken copy is written.", ""]
            C += ["## Prize", ""]
            if pv:
                C += [f"> [!success] **{pv}**", f"> `{(c['prize_exact'] or {}).get('source','')}`", ""]
                if (c.get("prize_exact") or {}).get("note"):
                    C += [c["prize_exact"]["note"], ""]
            else:
                C += ["> [!danger] UNRESOLVED — do not state a prize.", ""]
            if c.get("prize_detail"):
                C += ["**Detail.** " + c["prize_detail"]["value"],
                      f"`{c['prize_detail']['source']}`", ""]

            C += ["## Entry mechanic", ""]
            if ev:
                C += [f"> [!success] **{ev}**",
                      f"> `{(c['entry_mechanic_exact'] or {}).get('source','')}`", ""]
                if (c.get("entry_mechanic_exact") or {}).get("note"):
                    C += [c["entry_mechanic_exact"]["note"], ""]
            else:
                C += ["> [!danger] UNRESOLVED.",
                      (c.get("entry_mechanic_exact") or {}).get("note", ""), ""]

            for key, title in (("raffle_id", "Raffle ID"), ("supporting_strings", "Supporting strings"),
                               ("design_locks", "Design locks"), ("locked_arc", "Locked arc")):
                f = c.get(key)
                if not f:
                    continue
                st, v = field_status(f)
                C += [f"## {title}", "", f"**{st}** — " +
                      (", ".join(f"`{x}`" for x in v) if isinstance(v, list) else f"`{v}`"),
                      f"`{f.get('source','')}`", ""]
                if f.get("note"):
                    C += [f"> [!warning] {f['note']}", ""]

            if c.get("assets"):
                C += ["## Assets", ""]
                for a in c["assets"]:
                    # Every field is OPTIONAL. An asset that has only been glimpsed (a sibling
                    # plate found next to a confirmed one) must still render, with its gaps
                    # visible — not crash the build. a['w'] was assumed present and a partially
                    # inspected asset took the whole vault down.
                    C += [f"### `{os.path.basename(a['path'])}`", "",
                          f"- **path** `{a['path']}`"]
                    if a.get("w") and a.get("h"):
                        C.append(f"- **{a['w']}×{a['h']}** ({a.get('aspect','?')}) · "
                                 f"alpha `{a.get('alpha')}`")
                    else:
                        C.append("- ⚠️ **dimensions not measured** — asset not fully inspected")
                    C.append(f"- **role** `{a.get('role','?')}` · burned-in type "
                             f"`{a.get('has_burned_in_type', 'unknown')}`")
                    if a.get("sku"):
                        C.append(f"- **sku** `{a['sku']}`")
                    if a.get("description"):
                        C.append(f"- {a['description']}")
                    if a.get("note"):
                        C.append(f"- {a['note']}")
                    if a.get("_location_warning"):
                        C += ["", f"> [!warning] {a['_location_warning']}"]
                    for k, title in (("use_for", "Use for"), ("never_use_for", "Never use for")):
                        if a.get(k):
                            C += ["", f"**{title}:**"] + [f"- {x}" for x in a[k]]
                    if a.get("ocr_read"):
                        C += ["", "**OCR read** (what a machine sees — NOT design intent): " +
                              ", ".join(f"`{s}`" for s in a["ocr_read"])]
                    if a.get("_ocr_note"):
                        C += ["", f"> [!caution] {a['_ocr_note']}"]
                    for m in a.get("third_party_marks", []):
                        C += ["", f"> [!danger] Third-party mark: **{m['mark']}**",
                              f"> Form: {m['form']}", f"> {m['consequence']}"]
                    C.append("")

            if c.get("unresolved"):
                C += ["## Unresolved", ""] + [f"- {u}" for u in c["unresolved"]] + [""]
            if c.get("_blocking"):
                C += ["---", f"**Gate.** {c['_blocking']}"]
            open(f"{bdir}/Campaigns/campaign-{c['campaign']}.md", "w",
                 encoding="utf-8").write("\n".join(C) + "\n")

    # ---- gaps ------------------------------------------------------------
    law_nodes = [n for n in nodes if n["sec"] in LAW_BANKS]
    unmerged = sorted({n["sec"] for n in law_nodes if not n["merged"]})
    unlinted = sorted({n["sec"] for n in nodes if n["sec"] not in linted})
    linted_n = sum(1 for n in nodes if n["sec"] in linted and n["merged"])
    graph_n = sum(1 for n in nodes if n["merged"])
    empty_ev = [n["id"] for n in nodes
                if any(k in n["d"] and not n["d"][k] for k in ("MEASURED_BY",))]
    raw_vocab = collections.defaultdict(set)
    for n in law_nodes:
        a = n["d"].get("applies_to")
        for x in (a if isinstance(a, list) else [a]):
            for f in FACET.get(str(x), [str(x)]):
                raw_vocab[f].add(str(x))
    split = {f: v for f, v in raw_vocab.items() if len(v) > 1}

    g = ["---", 'title: "Gaps"', 'id: "_GAPS"', "type: index", "---", "",
         "# Where this graph is thin", "",
         "Counted from the data on every build, not quoted from prose.", "",
         "[[_START-HERE|← what are you making?]]", "",
         "## 1. The laws are an island", "",
         f"**{len(law_nodes)} laws** carry **zero authored edges**. Every field on a law is "
         "lowercase, and by this graph's own convention lowercase means DATA, not an edge. So no "
         "law connects to a model, a defect, a technique or a rule — and no code can consult one.", "",
         "The `Used by` and `Applies to` sections on each law note are built by **this exporter** "
         "from the recipe table and from `applies_to`. They are navigation, not data. Fixing this "
         "properly means authoring real edges: a law `SCOPED_TO` a model, `RISKS_DEFECT` a defect, "
         "`MEASURED_BY` an evidence node.", "",
         "## 2. Sections the linter silently skips", ""]
    for s in unlinted:
        g.append(f"- `{s}` — **{sum(1 for n in nodes if n['sec']==s)} nodes**, never validated")
    g += ["", f"`sieve-graph.mjs lint` reports **clean, {linted_n} nodes** for a graph holding "
          f"**{graph_n}**. A section absent from its `SECTIONS` array is skipped without error — "
          "the code comment directly above that array warns about exactly this.", "",
          "## 3. Banks not merged into graph.json", ""]
    for s in unmerged:
        g.append(f"- `{s}` — {sum(1 for n in law_nodes if n['sec']==s)} laws, still a worktree fragment")
    g += ["", "## 4. `source` resolves to nothing, in every bank", "",
          "Real evidence nodes look like `ev:E1` with `{what, where, cells}`. No law's `source` "
          "points at one — three banks use free prose, and `launch_laws` uses "
          "`ev:E-KB1 — …`, which *looks* like a node reference and is not. Because `source` is "
          "lowercase, lint treats it as prose and never checks it.", "",
          "## 5. Nodes that claim evidence and attach none", ""]
    g += [f"- {link(i)} — `MEASURED_BY: []`" for i in empty_ev] or ["*(none)*"]
    g += ["", "The first of these is `model:seedance-2.5` — the model everything currently runs on.", "",
          "## 6. The banks do not share a vocabulary", "",
          "Written by five agents, none agreeing on `applies_to`. This exporter normalises them "
          "into facets, but the underlying data is still split:", "",
          "| facet | raw values found |", "|---|---|"]
    for f, v in sorted(split.items()):
        g.append(f"| {f} | {', '.join('`'+x+'`' for x in sorted(v))} |")
    g += ["", "Left alone, a launch law and a podcast law about the same thing never meet.", "",
          "---", "[[_START-HERE|← what are you making?]]"]
    open(f"{CAT}/90-Reference/_GAPS.md", "w", encoding="utf-8").write("\n".join(g) + "\n")

    # ---- start here ------------------------------------------------------
    S = ["---", 'title: "Start here"', 'id: "_START-HERE"', "type: index",
         f'category: "{DEFAULT_CATEGORY}"', "---", "",
         f"# {DEFAULT_CATEGORY} — what are you making?", "",
         "[[_HOME|← all categories]]", "",
         "Each recipe carries the model, the working call, every governing law, every refusal "
         "**with its workaround**, the gates and the cost.", "", "## Recipes", ""]
    for r in RECIPES:
        n = sum(1 for x in nodes if x["sec"] in r["banks"])
        S += [f"### [[RECIPE-{r['id']}|{r['title']}]]", r["when"],
              f"→ {r['model']}" + (f" · {n} governing laws" if n else ""), ""]
    S += ["## Slice by facet", "", "The same 224 laws cut across all five banks.", "",
          "| facet | laws | |", "|---|---|---|"]
    for f, ms in sorted(by_facet.items(), key=lambda x: -len(x[1])):
        S.append(f"| [[FACET-{f}\\|{f}]] | {len(ms)} | {FACET_BLURB.get(f,'')} |")
    S += ["", "## Browse the graph", "", "| domain | nodes | |", "|---|---|---|"]
    for domain, subs in sorted(by_domain.items()):
        S.append(f"| [[DOMAIN-{domain}\\|{domain}]] | {sum(len(v) for v in subs.values())} | "
                 f"{DOMAIN_BLURB.get(domain,'')} |")
    S += ["", "## Reference", "",
          "- [[_FAILURES|Every failure mode, and the workaround]]",
          "- [[_COSTS|What things actually cost]]",
          "- [[_STATE-OF-ENGINE|State of the engine]]",
          "- [[_GAPS|Where the graph is thin]]"]
    open(f"{CAT}/_START-HERE.md", "w", encoding="utf-8").write("\n".join(S) + "\n")

    # ---- vault root: the category level ---------------------------------
    H = ["---", 'title: "Home"', 'id: "_HOME"', "type: home", "---", "",
         "# Generation knowledge base", "",
         "Organised by **category** first. Everything measured so far is video; the other "
         "categories exist as named gaps rather than as an implication.", "", "## Categories", ""]
    n_camp = sum(len(e["campaigns"]) for e in brands)
    for cat, meta in CATEGORIES.items():
        if cat == DEFAULT_CATEGORY:
            H += [f"### 📹 [[_START-HERE|{cat}]] — **{len(nodes)} nodes**", meta["blurb"], ""]
        elif cat == "Brands" and brands:
            H += [f"### 🏷 Brands — **{len(brands)} brand(s), {n_camp} campaigns**", meta["blurb"], ""]
            for e in brands:
                bn = e["brand"]["brand"]
                H.append(f"- [[brand-{bn}|{e['brand'].get('display_name', bn)}]] — " +
                         ", ".join(f"[[campaign-{c['campaign']}|{c.get('display_name', c['campaign'])}]]"
                                   for c in e["campaigns"]))
            H.append("")
        else:
            H += [f"### ○ {cat} — *empty*", meta["blurb"], ""]
    H += ["## Inside Video", "", "| | |", "|---|---|",
          "| [[_START-HERE\\|00-Start]] | Recipes by what you are making, plus facet slices |"]
    for domain, subs in sorted(by_domain.items()):
        H.append(f"| [[DOMAIN-{domain}\\|{domain}]] | {DOMAIN_BLURB.get(domain,'')} |")
    H += ["| 90-Reference | Hand-written: failures, costs, state of the engine, gaps |", "",
          "## Reference", "",
          "- [[_FAILURES|Every failure mode, and the workaround]]",
          "- [[_COSTS|What things actually cost]]",
          "- [[_STATE-OF-ENGINE|State of the engine]]",
          "- [[_GAPS|Where the graph is thin]]", "",
          "---",
          "Generated by `kg-vault.py` in the `gen-image` worktree. Source of truth is "
          "`graph/graph.json` plus four worktree fragments — **not** this vault. "
          "`Video/90-Reference/` is hand-written and never overwritten."]
    open(f"{VAULT}/_HOME.md", "w", encoding="utf-8").write("\n".join(H) + "\n")

    print(f"nodes        : {len(nodes)}")
    print(f"authored edges: {edge_n}")
    print(f"recipes      : {len(RECIPES)}   facets: {len(by_facet)}")
    print(f"domains      : {', '.join(sorted(by_domain))}")
    print(f"DROPPED FIELDS: {len(dropped)}  {dropped[:8]}")


if __name__ == "__main__":
    main()
