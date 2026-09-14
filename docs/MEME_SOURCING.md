# Recurring meme sourcing

Production handoff: [Higgsfield execution](HIGGSFIELD_EXECUTION.md) documents the
official MCP connection, authenticated CLI adapter, credit caps, recovery receipts,
and the Switch batch prepared from this workflow. A positive source-board reaction
is creative direction; confirm the concrete batch cost before billable execution.

Find references the user would actually choose, with a clear reason the device belongs in
the joke. Deliver a reviewable source board before production.

For Muha, read `knowledge/playbooks/MUHA_MEME_TASTE.json` first. Baseline board:
`.content-engine/meme-sourcing/2026-09-10/board.html`. Downloads and generated research
artifacts stay local and untracked; durable rules and source records live in `knowledge/`.

`knowledge/memes/muha-meds.json` holds the broader historical production registry. Consult
it for existing templates and measured rendering failures; this taste profile adds sourcing
decisions and feedback. Reverify provider behavior and rights assertions before production.

## Intake that changes the result

Resolve brand, device, audience, platform, deliverable, ratio, and acceptance criteria.
The most useful missing context is:

1. Three favorite references/edits and one disliked example, with a short reason.
2. Account/platform, organic versus paid placement, market, and adult subculture.
3. Actual device behavior and launch proposition, including what renders cannot prove.
4. Humor range and specific exclusions: deadpan, absurd, crude, relationship, film, music.
5. Comparable post metrics, if available: reach, shares, saves, and video retention.

Do not make all five prerequisites. Start from current assets and the archive; mark unknowns.
Preserve native source framing, with tentative 4:5 still / 9:16 video delivery suggestions
until the channel is known. Never crop out the setup or punchline merely to fill a ratio.

## Read paired evidence

Check `brandkit kit <brand>`, then query knowledge for the task. If the pack is missing,
use registered brand context and current assets, and record the gap. Sourcing alone does
not require inventing a pack or recreating a design system.

Inspect original and adaptation together. Record the original joke; the changed prop,
character, scale, language, or timing; and the surviving expression, gesture, grain, framing,
cuts, and audio. Distinguish user-picked, explicitly approved, historical delivery note,
and inference. Note corrections affecting source selection: tiny labels, hidden hands,
unsuitable grips, moving cameras, and sources already containing edits.

Use negative evidence. A giant device can be intentional in a boombox parody and a failure
in a natural hand-held shot. Save the distinction instead of a universal size rule.

## Search by comic mechanism

| Lane | Search language | Relevance test |
|---|---|---|
| Two choices, one object | two minds, impossible choice, switch sides | Does the two-flavor relationship carry the joke? |
| Swap or reveal | idol swap, briefcase reveal, magic remote | Does the original action give the product a role? |
| Absurd scale | monolith, clinging to objects, giant prop | Does the original gesture sell the substitution? |
| Art interruption | familiar painting, central object, face occlusion | Is there a recognizable joke beyond placement? |
| Current adult culture | approved accounts + action/topic + recent date | Is the actual post recent, relevant, and accessible? |

Use native creator posts and official film/TV clips for context where available; Know Your
Meme for meaning/history; Imgflip/template communities for stills; museum/artist collections
for art. These are source routes, not automatic publication licenses. Avoid relying on
scraped catalogs with generic viral descriptions.

Start mostly with direct taste matches, a smaller adjacent lane, and one wildcard; adapt
the mix to feedback. A selective shortlist beats filling a quota. Mark existing archive
concepts explicitly so they are not misrepresented as new finds.

## Verify before ranking

Open and inspect the media, not just its title. Save a modest preview, hash it, and retain
attribution/watermarks. Track source page and media URL separately. Record redirects,
gated clips, unavailable files, and unsuitable variants. Do not invent clip timecodes.

Freshness categories:

- **Evergreen:** an existing format, with no current-popularity claim.
- **Current candidate:** a dated native post inside the brief's window; spread unestablished.
- **Active trend:** multiple independent dated native uses and visible context, beyond a
  recent article or crawl date. Record observed metrics, not forecasts.
- **Lead only:** concept/source located, but required media not yet verified.

Rank with editorial judgments, not performance predictions. Suggested 1–5 dimensions:
comic clarity, device relevance, taste evidence, edit feasibility, and audience recognition.
State the rationale. Apply hard constraints first. Muha's context calls for 21+ audiences,
no youth-coded casting, no unsupported effects or medical claims, no unapproved consumption,
and no invented hardware functions.

Each pitch must answer: “The joke is ___. The device replaces/does ___, because ___.”
If it needs a paragraph to explain, rethink it.

## Source card contract

Use stable IDs and these fields in the batch JSON:

```json
{
  "id": "muha-switch-001",
  "title": "Reference name",
  "status": "proposed",
  "sourcePage": "https://example.com/specific-source",
  "mediaUrl": null,
  "origin": "Creator / scene, with confidence stated",
  "checkedAt": "YYYY-MM-DD",
  "freshness": "evergreen",
  "localAsset": null,
  "sha256": null,
  "visualReview": "pending",
  "rightsStatus": "unreviewed",
  "mechanism": "What makes the source funny",
  "adaptation": "Exact proposed change",
  "deviceConnection": "Why this product belongs",
  "captionDraft": null,
  "format": "still",
  "suggestedAspect": "4:5",
  "dependsOn": [],
  "archiveOverlap": null,
  "userDecision": null,
  "userReason": null,
  "postMetrics": null
}
```

Keep rights, taste selection, production approval, and publication approval separate.
Keep means the user likes a concept; it does not approve spending or publishing.

## Feedback and reuse

Offer keep / maybe / pass plus a reason. A browser board may retain votes locally and export
JSON. The exported feedback must be read into a session before knowledge changes; do not
imply invisible synchronization. On the next request, read feedback, update the profile,
exclude delivered sources unless intentionally revisiting, and search adjacent mechanisms.
Store explicit user words separately from inferred weights. Silence is not approval.

After posting, compare shares/reach and saves/reach, and video completion/retention across
similar placements and durations. Record observations and sample limitations. Views alone
do not prove taste fit or causation.

## Production handoff

Sourcing makes no image/video provider call. The engine has generation modes, not a research
mode. Keep a research manifest for the hunt and, if useful, a separate unapproved draft
content job. Run `plan` on that job; preflight does not clear rights, disclosures, or unknown
launch mechanics.

For chosen concepts, use the actual source as layout reference and current device as product
canon. Compose exact copy afterward. Plan 2–3 candidates varying one hypothesis, review each
visually, and check geometry, grip, identity, timing, and source continuity. Confirm scope/cost
before billable execution under the repository contract. Historical provider anecdotes are
examples, not current instructions or approval.
