# Claim registry

Store one JSON file per factual marketing claim, conforming to
`schemas/claim-record.schema.json`. No claims are pre-approved by this refactor. That is deliberate:
existing prose, generated labels, `[S]` markers, and historical campaign copy are not sufficient
evidence of current approval.

A job references approved records through `compliance.claimSourceIds`. The engine blocks common
purity, testing, certification, origin, and regulatory claims when this list is empty. The next
increment should load the referenced records, verify `status=approved`, enforce `reviewAfter`, and
match platform/jurisdiction/use before generation.

Do not put large source documents here. Store the durable citation and the smallest supporting
excerpt or data field; keep confidential material in an authorized connector or document system.

