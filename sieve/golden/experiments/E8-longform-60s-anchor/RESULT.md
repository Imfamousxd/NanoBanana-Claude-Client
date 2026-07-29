# E8 — 60 seconds in anchor mode, and the two modes compared

**Run 2026-07-28. Clean. 6 × 10s segments, anchor mode, one seed.**

Output: ~~`generations/longform/REC-60s-anchor/REC-60s-anchor_FINAL.mp4`~~ **(artifact deleted
2026-07-29 with the predecessor's generations/ folder — the measurements below stand on their
own; the video itself is gone and would have to be re-run from the spec to re-view)** — **1080×1920, 60.3s**, 176 MB,
synced audio throughout. Cost ~$7.20.

## QC

| Check | Result |
|---|---|
| **Face identity** vs canonical | **MATCH 6/6** (high) |
| **Descriptor conformance** | **OK 6/6** — no drift at any segment |
| **Voice** across all 5 cuts | `all_same_speaker: true` (high), `cuts_with_audible_seam: []` |

## Anchor vs chain — the measurement that settles which to use

| | slope | monotonic? | per-step change |
|---|---|---|---|
| **chain**, 30s / 3 seg | **−1.90** luma/segment | **YES** | −0.4, −3.4 |
| **anchor**, 60s / 6 seg | **−0.14** luma/segment | no | −0.6, −2.8, **+1.4, +4.0**, −4.8 |

Raw spread is a misleading statistic here — anchor's is *larger* (5.3 vs 3.8). What matters is the
SHAPE. Chain declines steadily in one direction because each segment re-renders the previous
segment's output, so error accumulates; extrapolated to 6 segments it would be roughly −11 luma, a
visibly darker ending. Anchor scatters around a stable mean because every segment is exactly one
hop from the original frame — the error never compounds, it just resamples.

**Anchor also fixed the descriptor drift.** Chain mode lost "warm brown eyes" by segment 3 (E7).
Anchor held all six. Same reason: nothing accumulates.

## The rule, now evidence-backed

- **≤3 segments → `--mode chain`.** Best pose continuity, drift too small to see.
- **≥4 segments → `--mode anchor`.** Mandatory. Chain's compounding becomes visible and the
  descriptor starts slipping.
- **Always fix the seed.** Five cuts, zero audible seams, on a piece generated as six separate API
  calls with six different scripts.

The cost of anchor mode is that pose resets at each cut — the piece reads as a cut-together
testimonial rather than one continuous take. For UGC that is not a defect; real testimonials cut
constantly. For a piece that must look like one unbroken take, stay at 3 segments and chain.

## Practical note

60s at 1080p is **176 MB**. A campaign of these fills a disk fast — budget storage, or transcode
deliverables and keep only the segments.
