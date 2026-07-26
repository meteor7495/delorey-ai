# Vertical Slice 09 — Audit Logs

## Metadata

| Field | Value |
|-------|-------|
| **Version** | 0.1 |
| **Status** | Done — AI turn audit query UI |
| **Last Updated** | July 26, 2026 |
| **Depends on** | Slice 01–08 (Runtime already writes AuditTurn) |
| **PRD** | [PRD-018 Audit Logs](../04-prd/audit-logs.md) |

**Goal:** Tenant-scoped, append-only view of AI turn audits (decision, citations, conversation link). Filter by time/decision/conversation. No raw prompt dump. No cross-tenant.

**Out:** Full SIEM; admin-mutation taxonomy completeness; raw prompt to all roles.

---

# Checklist

- [x] `GET /v1/audit/turns` + `GET /v1/audit/turns/:id`  
- [x] Workspace `/audit` list + detail  
- [x] Filter days / decision / conversationId  
- [x] Link from Inbox (`?c=`)  
- [x] Smoke: list returns tenant audits  

---

# Note

Runtime already appends `AuditTurn` on each skill/decision path. This slice exposes Transparent AI read path — does not invent vanity scores or rewrite history.
