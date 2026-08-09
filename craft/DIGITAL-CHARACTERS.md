# DIGITAL-CHARACTERS — the sanctioned doors into Seedance for people (researched 2026-08-09)

The question this answers: **how do we get a consistent person INTO Seedance 2.5/2.0** when the
privacy guard refuses every human image and every non-2.5 human video (measured, laws
`sd25:refusal-privacy-any-image-role` and `sd25:extension-only-accepts-25-born-humans`).

## The four routes (BytePlus's own taxonomy, cross-checked against our measurements)

| # | Route | Status on OUR account | What we measured |
|---|---|---|---|
| 1 | Raw URL / base64 with a face | ❌ categorically refused | matches — every probe bounced |
| 2 | "Trusted ModelArk outputs" (same account, unmodified, ≤30 days) | ⚠️ **narrower than documented** | 2.5 extends 2.5-born humans ✓; but a fresh same-account **1.5-pro** clip was still refused → in practice trust is **model-scoped**, not account-scoped |
| 3 | **Preset digital persons** — ready-made characters, referenced as `asset://<ASSET_ID>` | ✅ readable (`aigc_readable: true`) | untested — needs an ASSET_ID from the console library (no list API in arkcli) |
| 4 | **Authorized real-person assets** — consent + liveness verification → Asset Group ID | ✅ **WRITABLE** (`liveness_writable: true`, 50 slots, 0 used) | untested — requires a real human doing a verification flow |
| — | Register our own SYNTHETIC faces (Soul characters) as assets | ❌ `aigc_writable: false` — invite-gated, not open to us | — |

Account quota (live probe `arkcli api mediaasset.get_asset_quota`, 2026-08-09): 50 asset groups,
50 assets, 0 used, write rate 3/min, `aigc_readable` ✓, `aigc_writable` ✗, `liveness_*` ✓✓.

## What this means for the operator's plan

**"Make more characters and register them" splits into three different realities:**

1. **Soul-born characters (synthetic)** — CANNOT be registered as ModelArk assets today
   (`aigc_writable: false`). Their production lane is **Soul → Seedance 1.5-pro** (proven
   end-to-end 2026-08-09: identity holds, speech verbatim). Cost is a wash between routes
   (corrected): ModelArk 1.5-pro ~$0.29 silent / ~$0.59 with audio per 5s 1080p (measured token
   count × the live 1.5-pro billing rates), Replicate ~$0.62 flat — ModelArk cheaper or equal.
   They live in OUR store (`Avatars/<Name>/`), not ByteDance's.
2. **Preset digital persons (ByteDance's characters)** — usable in Seedance via
   `asset://<ASSET_ID>` right now, IF we take an ID from the console library. These are
   ByteDance's faces, not ours — useful for generic presenters, not brand-owned identity.
3. **Real humans (founder, hired creators)** — the genuinely open door. 50 empty slots.
   A real person completes consent + liveness verification once, becomes an Asset Group ID,
   and their likeness becomes a SANCTIONED input — the only route that ends with 2.5-quality
   speech on a face we choose.

## RETRIEVED THROUGH THE CLI (2026-08-09) — the decisive finding

The documented `arkcli` surface has no asset/character commands, but the CLI's own logged-in SSO
credentials (`~/.arkcli-bp/.env`, written by `arkcli auth login`) sign the control-plane directly.
`arkasset.mjs` wraps this (TOP HMAC-SHA256; on-disk creds are QUOTED — strip or every sig fails).
What the raw API told us that the docs would not:

- **The library IS queryable via CLI creds.** `ListAssetGroups` / `ListAssets` / `GetAssetQuota` /
  `CreateAssetGroup` / `CreateAsset` all exist and respond.
- **GroupType is a validated enum. Only two return 200: `AIGC`** (your own generated assets —
  **empty, 0 items**) **and `Public`** (6,225 shared editing-TEMPLATE examples, not digital
  persons). `Liveness`, `Preset`, `DigitalCharacter`, `Official`, `System` are all rejected as
  invalid — so **there is no API-listable "preset digital person" pool on this account.** The
  preset library the blog describes is either console-only or subscription-gated.
- **⭐ The wall is a PAYWALL, not an invite list.** `CreateAssetGroup` returns
  `403 SubscriptionRequired`: *"This API requires an active subscription. Please subscribe to an
  advanced or premium…"* Registering ANY custom character — a Soul face OR a real human — needs a
  **paid ModelArk media-asset subscription tier**. That is exactly why the quota reads
  `tier: ""`, `aigc_writable: false`. `liveness_writable: true` is capacity, not entitlement; the
  create call is refused before liveness ever matters.

**So "put our characters in the store and input the photo" is blocked on a purchase, not a form.**
Buy the media-asset subscription → `aigc_writable` flips true → then registration + `asset://`
references become testable. Until then, the Soul → 1.5-pro lane is the whole game for owned faces.

## Next actions

**Operator (console, ~10 min) — I can't do these; they're your account UI:**
1. Ark Console → ModelArk → **Digital character library** (docs id 2223965). Browse the preset
   characters; copy 1-2 `ASSET_ID`s of presenters that could pass as UGC creators.
2. Same area → **Add real-human assets** (docs id 2315856). Read the consent/liveness flow.
   Decide who registers first (you? a hired creator?). This burns nothing until submitted.

**Claude (once an ASSET_ID exists, ~$2 of probes):**
3. P-ASSET-1: `asset://<ID>` as image ref into **2.5** — does the preset unlock 2.5 speech on a
   consistent face? (The prize.)
4. P-ASSET-2: same into **2.0** with `reference_images` — consistent person in product scenes.
5. If a real-person asset gets registered: repeat both with the Asset Group ID, and test
   whether extension of the resulting clips compounds identity.

## Sources
- [Digital character library — ModelArk docs](https://docs.byteplus.com/en/docs/ModelArk/2223965) (JS-rendered; content via console)
- [Add Real-Human Assets to ModelArk Library](https://docs.byteplus.com/en/docs/ModelArk/2315856)
- [Seedance "may contain a real person" — legitimate fixes (LaoZhang analysis)](https://blog.laozhang.ai/en/posts/seedance-2-api-real-people) — source of the four-route taxonomy and `asset://` format; treat as secondary until console-verified
- Live account quota: `arkcli api mediaasset.get_asset_quota`, 2026-08-09
- Our measurements: `research/sd25/probe-log.jsonl` P-15A/B/C, P-25EXT, P-25EXT-B
