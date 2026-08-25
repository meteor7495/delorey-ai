# Performance Rules

## Prefer existing cost-aware paths

- Deterministic ChannelCheckout / rules before LLM
- `AI_GATEWAY_MODE=mock` locally unless live is required
- Do not call premium models for سلام / cart / payment / cancel flows

## Queues

- Keep heavy sync off the interactive request path
- Only `batch.sync` exists — do not pretend other queues are live

## Frontend

- Avoid unnecessary full-page refetch storms; reuse the page’s existing load pattern
- Widget: keep the bundle small; no heavy admin deps
- Workspace: code-split is Next’s default by route — do not add large new client libraries casually

## Data

- Index and filter by `tenantId` + time/id as existing queries do
- Use Redis locks where payments already do — do not invent uncoordinated double-write paths

## Honesty

Fluent wrong commerce answers are not “fast” — they are defects. Prefer fail-safe / escalate over hallucinated stock/price.
