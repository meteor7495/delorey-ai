# Vertical Slice 12 — Admin Audit Events

## Metadata

| Field | Value |
|-------|-------|
| **Version** | 0.1 |
| **Status** | Done |
| **Last Updated** | July 26, 2026 |
| **Depends on** | Slice 09 AI turn audit |
| **PRD** | [PRD-018 Audit Logs](../04-prd/audit-logs.md) — admin mutations |

**Goal:** Append-only tenant-scoped audit of **admin mutations** (employee, guardrails, knowledge, store sync, channel connect). Completes PRD-018 beyond AI turns. No SIEM; no cross-tenant.

---

# Checklist

- [x] `admin_audit_events` table  
- [x] Writers on employee / guardrails / knowledge / store / telegram / bale connect  
- [x] `GET /v1/audit/admin` (+ detail)  
- [x] Workspace Audit tab «اقدامات ادمین»  
- [x] Smoke: guardrails save → admin event  

---

# Action taxonomy (MVP)

| Action | Source |
|--------|--------|
| `employee.update` | PUT /employee |
| `employee.guardrails` | PUT /employee/guardrails |
| `knowledge.create` / `update` / `delete` / `reindex` | Knowledge CRUD |
| `store.mock_connect` | POST /store/mock-connect |
| `channel.telegram.connect` | Telegram connect |
| `channel.bale.connect` | Bale connect |

Payload is summary-only (ids, field keys) — never bot tokens or passwords.
