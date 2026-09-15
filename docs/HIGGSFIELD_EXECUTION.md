# Higgsfield execution

The official remote MCP is `https://mcp.higgsfield.ai/mcp`. It is registered as
`higgsfield` in this workstation's Codex config and completed OAuth on 2026-09-10.
Verify with `codex mcp list`; reconnect with `codex mcp login higgsfield` if needed.
A running conversation may need a client restart to expose newly added MCP tools.
The existing official CLI is authenticated independently and can execute immediately.

Official sources: [Higgsfield setup](https://higgsfield.ai/mcp),
[credit behavior](https://higgsfield.ai/creator-hub/help-center/integrations/what-is-higgsfield-mcp),
[CLI](https://github.com/higgsfield-ai/cli), and
[Codex MCP configuration](https://developers.openai.com/codex/mcp).

## Reusable image route

The content engine supports `provider.id: "higgsfield-image"`, currently with the
verified `gpt_image_2` schema. This is an official CLI adapter, not an MCP proxy.
It uses Higgsfield's credential store; no API key or OAuth token belongs in a job.
Other providers and default models are unchanged.

```json
{
  "deliverable": {
    "aspectRatio": "4:3",
    "quality": "high",
    "imageSize": "2K",
    "candidates": 1
  },
  "provider": {
    "id": "higgsfield-image",
    "model": "gpt_image_2",
    "aspectRatio": "auto",
    "maxCredits": 6.5
  },
  "execution": { "approved": false }
}
```

This is a fragment; use a complete schema-compatible content job with actual
references and precise roles. `auto` preserves a source-shaped master; compose
the final 4:5 margins and exact captions after generation. Explicit masks are
not supported by this first adapter. Do not set `isInpaint: true`: Higgsfield
requires a mask for that mode. Ordinary edits use image references directly.
Reference order is preserved.

1. Check `higgsfield account status` and current model schema. Account reads,
   model discovery, cost quotes, and engine planning do not generate content.
2. Prepare separate A/B jobs varying one hypothesis; one candidate per job.
3. Run `npm run content -- plan <job.json>` and inspect every warning/error.
4. Confirm scope and the current quote with the user under `AGENTS.md`.
   A credit cap in a draft is not approval. Set `execution.approved` only after
   the user confirms. Track the total approved batch limit as well as each job.
5. Run `npm run content -- run <job.json>`. The adapter quotes the actual request
   immediately before submission and blocks any quote above `maxCredits`.
6. Review every image against its source and canon. The engine's automated
   `review` command uses the separate OpenAI account and needs an approved budget
   too. `compliance.reviewMaxOutputTokens` optionally caps its output; review
   files now preserve usage. Visual inspection and final human approval remain
   required. A completed generation is not an approved creative.

The engine saves the compiled prompt, reference hashes, output hashes and main
manifest. A `.higgsfield.json` receipt additionally saves the quoted cost and
remote job ID before waiting. Quoted cost is not a reconciled credit transaction.
No create operation is automatically retried. If submission or waiting fails,
inspect the receipt/account first; the provider may already have charged and
completed the job. Recover via `higgsfield generate wait <remote-id> --json`
instead of resubmitting. If no remote ID was received, inspect recent account
jobs and match the exact submission before taking another billable action.

## Switch batch executed 2026-09-10

Local artifacts: `.content-engine/meme-sourcing/2026-09-10/production/`.
`batch.json` carries approval state, scope, captions and individual job paths;
`BRIEF.md` gives the exact concepts and A/B treatments. The first group is
SW01, SW02, SW03, SW04 and SW07. The live reference-inclusive quote was 6.5
credits per high-quality 2K edit. The user approved a 78-credit cap plus $5 in
automated reviews. The first batch used 78 net credits (84.5 gross less a 6.5
refund) and approximately $3.09 for 17 reviews. Thirteen remote jobs produced
twelve images, with one blocked/refunded alternate that was not retried. Two
planned corrections plus a third using the refunded balance stayed within the
net credit cap. No generation budget remains for this batch.
No automatic billing approval or publication approval follows from liking the
source board.

All ten jobs passed preflight. Provider tests cover approval, credit-cap rejection,
literal argument/reference handling, receipt persistence, and uncertain submissions.
`npm run doctor` passes with the existing archive-size warning. At setup, the
full `npm run check` had two unrelated failures: a `nulumin/reference` directory
inside a knowledge-only pack, and direct Chrome invocation in
`nulumin_trust_card_v2.py`. Those existing files were left untouched.


The five selected 1080×1350 PNG/JPG pairs, uncaptioned masters and editable HTML
caption canvases are packaged in `Muha-Switch-Instagram-Review.zip` beside
`review.html`. They still require retouch and user creative review. All five
export reviews returned advisory `revise` verdicts; captions and dimensions were
verified separately. `creative-review.json` records remaining work and the
intentional no-caption Pulp Fiction treatment.

### Observed CLI behavior

- `generate create --json` can return an array of UUID strings. Save the remote
  ID before waiting; a parser failure does not mean generation failed.
- Account concurrency was limited to eight concurrent jobs in this run, shared
  with other account activity. A rejected create with no job is distinct from a
  submitted job that later fails. Avoid blind retries in either case.
- Reference edit is the ordinary mode. `is_inpaint=true` requires a mask and is
  rejected by this adapter until explicit mask support exists.
- Transactions expose model/time but no job IDs. Reconcile receipts, quotes,
  model/time-matched charges and refunds; never attribute the full account
  balance difference to this batch when other jobs are running.
- Use final-export jobs with the actual canvas and intended caption. Source
  masters can retain native framing. Automated review must not confuse these
  stages or invent a caption requirement for captionless concepts.
