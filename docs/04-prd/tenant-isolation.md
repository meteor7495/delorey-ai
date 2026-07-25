# PRD-003 — Tenant Isolation

## Metadata

| Field | Value |
|-------|-------|
| **PRD ID** | PRD-003 |
| **Feature** | Tenant Isolation |
| **Phase** | MVP |
| **Status** | Ready for eng |
| **Owner** | Product / Security |
| **Last Updated** | July 25, 2026 |
| **Related** | [Product Scope](../02-product/product-scope.md) · [Security Architecture](../03-architecture/security-architecture.md) · [Database Design](../03-architecture/database-design.md) · [Testing Strategy](../03-architecture/testing-strategy.md) |

---

# 1. Problem

One cross-tenant leak ends the company. SaaS trust is binary.

# 2. Goal

Hard isolation of data, Knowledge, Memory, analytics, jobs, and indexes per merchant Tenant — verified in acceptance tests before MVP exit.

# 3. In scope / Out of scope

| In | Out |
|----|-----|
| `tenant_id` on all merchant data; RLS/predicates; Redis/Vector/Object/Queue isolation; CI isolation+IDOR tests; fail closed | Multi-brand org hierarchy, residency productization as MVP theater |

# 4. Users & Journey

Invisible to merchants when working; visible as trust foundation. Journey 2 provisioning.

# 5. Functional requirements

1. MUST create Tenant on signup with isolation namespaces (DB, vector, storage prefix, quotas).  
2. MUST attach verified `tenant_id` on every API/job/turn.  
3. MUST fail closed if tenant missing.  
4. MUST isolate Postgres, Redis (`t:{id}:`), Vector, Object Storage, queues, logs, analytics, Memory, embeddings.  
5. MUST ship automated cross-tenant isolation tests in CI.  
6. MUST NOT trust adapter/body-supplied tenant without binding lookup.

# 6. UX requirements

No merchant UI beyond “your data is isolated” trust copy if needed. Failures surface as 403/404 without cross-tenant leakage.

# 7. Technical contracts

[System Architecture](../03-architecture/system-architecture.md) §15; [Security Architecture](../03-architecture/security-architecture.md); [Database Design](../03-architecture/database-design.md).

# 8. Principle checklist

| Question | Pass? | Notes |
|----------|-------|-------|
| Business value | Yes | Trust prerequisite for paid SaaS |
| AI Employee impact | Yes | Context never leaks across shops |
| Friction | N/A (infra) | Prevents catastrophic friction |
| Scope fit | Yes | MVP non-negotiable |
| Principle compliance | Yes | Tenant Isolation, Security By Default |
| Measurement | Yes | Isolation CI green as exit evidence |
| Kill criteria | Yes | Any production leak → severity-1 freeze |

# 9. Measurement

Isolation CI pass rate; zero cross-tenant incidents.

# 10. Acceptance criteria

- [ ] Tenant Isolation verified in acceptance tests (Scope exit).  
- [ ] IDOR chaos suite in CI.  
- [ ] Vector/Redis/Object prefix tests green.  

# 11. Kill criteria

Confirmed cross-tenant read → halt feature shipping; incident review per Principles.

# 12. Dependencies & risks

All modules. Risk: skipping tests to polish channels.

# 13. Anti-pattern check

Not enterprise SSO theater; isolation is the MVP bar.
