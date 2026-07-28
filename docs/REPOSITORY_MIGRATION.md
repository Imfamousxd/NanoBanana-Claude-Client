# Repository and asset migration plan

The current root is both source tree and production archive. This plan is intentionally not executed
automatically: thousands of paths are referenced by historical scripts and moving them without a
verified mapping could destroy reproducibility.

## Target layout

```text
engine/                     reusable code
knowledge/                  graph, playbooks, claims, canonical registries
schemas/                    contracts
examples/                   portable example jobs
test/                       offline tests and golden eval metadata
brands/<brand>/             brand-owned source docs and canonical asset registry
projects/<brand>/<campaign>/ briefs, jobs, handoffs, deterministic source files
artifacts/<brand>/<campaign>/generated candidates, manifests, reviews (external/LFS storage)
archive/legacy-jobs/        immutable root scripts after path rewriting and verification
```

Large generated binaries and ZIPs should normally live in versioned object storage or a digital
asset manager, not ordinary Git. Keep small canonical references locally or through Git LFS only
after checking clone cost, hosting quotas, backup, rights, and offline requirements.

## Safe sequence

1. Freeze a backup and record current commit plus `git ls-files`.
2. Build an asset inventory: relative path, bytes, magic MIME, dimensions/duration, SHA-256, modified
   time, generated/canonical status, brand, SKU/character, rights, and references from code/docs.
3. Identify exact duplicates by hash. Do not deduplicate visually similar files automatically.
4. Assign canonical IDs and owners. A `FINAL` filename alone is not canonical status.
5. Create a machine-readable old→new path manifest and a dry-run reference rewrite report.
6. Copy a single low-risk campaign to the target layout; do not delete the source.
7. Run historical job syntax checks, link checks, content-engine plans, and visual comparisons.
8. Owner reviews the pilot. Only then move additional campaigns in bounded batches.
9. Replace the 1,117-line generated-path `.gitignore` with policy patterns after the move. Verify that
   this does not expose secrets or terabytes of untracked artifacts.
10. Remove old copies only in a separately approved, recoverable change after backup verification.

## Canonical asset record

Each canonical asset should record:

- stable ID, brand, product/SKU/character, role, version, and owner;
- source path/URI, SHA-256, MIME, dimensions/duration, color profile, and alpha expectation;
- exact text expected, geometry/crop notes, safe transformations, and forbidden transformations;
- usage rights, territory/channel restrictions, approval date, and review/expiry date;
- lineage: photographed/vector source, deterministic derivative, or model/provider/run manifest.

## Stop conditions

Stop the migration if a path cannot be classified, a referenced asset has no owner, hash duplicates
carry different rights/status, a rewrite changes a historical output, credentials appear in tracked
content, or filesystem hydration makes the verification incomplete. Report the exact batch and wait
for an owner decision instead of guessing.

