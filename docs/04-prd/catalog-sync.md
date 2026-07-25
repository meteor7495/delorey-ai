# PRD-005 — Catalog Sync

## Metadata

| Field | Value |
|-------|-------|
| **PRD ID** | PRD-005 |
| **Feature** | Catalog Sync |
| **Phase** | MVP |
| **Status** | Ready for eng |
| **Owner** | Product |
| **Last Updated** | July 25, 2026 |
| **Related** | [Product Scope](../02-product/product-scope.md) · PRD-004 · [Backend Architecture](../03-architecture/backend-architecture.md) · [DevOps](../03-architecture/devops-infrastructure.md) |

---

# 1. Problem

Stale or failed sync makes the Employee confidently wrong. Silent sync failure is a product defect.

# 2. Goal

Reliable initial + incremental sync with visible last-sync, staleness, and failure reason; fair scheduling so sync storms do not starve shopper turns.

# 3. In scope / Out of scope

| In | Out |
|----|-----|
| Initial + incremental refresh; webhook+reconcile poll; idempotent upserts; `batch.sync` queue; Workspace sync health UI; manual sync trigger | Perfect real-time inventory science; sync on interactive turn path |

# 4. Users & Journey

Journey Stage 4 — Commerce sync.

# 5. Functional requirements

1. MUST run initial sync after `store.connected`.  
2. MUST support incremental updates via webhooks/poll with idempotent upserts by external id.  
3. MUST update `sync_health` per domain (catalog, inventory, orders, policies).  
4. MUST process on `batch.sync` workers — not interactive turn queue.  
5. MUST debounce webhook storms.  
6. MUST surface retry/reconnect in Workspace.  
7. MUST invalidate Cost caches on `catalog.updated` / related events.  
8. Stale catalog is a **P0 product incident**, not a prompt issue.

# 6. UX requirements

Statuses: running / succeeded / failed / stale; merchant-visible failure reason; no silent healthy.

# 7. Technical contracts

Store sync APIs; Sync Workers; events `sync.succeeded` / `sync.failed` / `catalog.updated`.

# 8. Principle checklist

| Question | Pass? | Notes |
|----------|-------|-------|
| Business value | Yes | Accuracy ≥90% depends on sync |
| AI Employee impact | Yes | Fail-safe when unhealthy |
| Friction | Yes | Visible recovery vs mystery wrong answers |
| Scope fit | Yes | MVP Catalog Sync |
| Principle compliance | Yes | Sync health as product |
| Measurement | Yes | Lag, failure rate |
| Kill criteria | Yes | Below |

# 9. Measurement

Sync lag seconds; failure rate by connector; time-to-healthy after connect.

# 10. Acceptance criteria

- [ ] After connect, catalog appears and health shows success.  
- [ ] Forced credential break → failed/stale visible; Runtime refuses confident stock/price.  
- [ ] Load: sync storm does not block interactive queue (DevOps test).  

# 11. Kill criteria

Sync chronically lying “healthy” while wrong → halt go-live recommendations.

# 12. Dependencies & risks

Commerce Core, queues, Runtime gates.

# 13. Anti-pattern check

Not demo sync that only works once for screenshots.
