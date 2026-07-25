# MVP Feature PRDs — Index

## Metadata

| Field | Value |
|-------|-------|
| **Version** | 0.1 |
| **Status** | Complete — MVP PRD set (001–020) written |
| **Last Updated** | July 25, 2026 |
| **Authority** | [Product Scope](../02-product/product-scope.md) capability map only |

Every PRD uses [_prd-template.md](./_prd-template.md). Architecture depth lives in `docs/03-architecture/`; PRDs specify **product behavior and acceptance**, not re-architecting. Screen/IA/copy detail lives in [docs/05-ui](../05-ui/README.md).

---

## Build order (suggested)

Aligned with Backend build order and User Journey:

1. Authentication → Workspace & Tenant Isolation  
2. Commerce Core + Catalog Sync  
3. AI Sales Employee + Settings/Guardrails  
4. Conversation History + Human Handoff + Inbox  
5. Website Chat → Telegram → Bale  
6. Knowledge Base + Context Engine (critical path with Runtime)  
7. Order Lookup + Product Recommendation Skills  
8. Audit Logs + Basic Analytics + Revenue Dashboard  

---

## PRD catalog (MVP)

| ID | Feature | File | Priority |
|----|---------|------|----------|
| PRD-001 | Authentication | [authentication.md](./authentication.md) | P0 |
| PRD-002 | Merchant Workspace | [workspace.md](./workspace.md) | P0 |
| PRD-003 | Tenant Isolation | [tenant-isolation.md](./tenant-isolation.md) | P0 |
| PRD-004 | Commerce Core | [commerce-core.md](./commerce-core.md) | P0 |
| PRD-005 | Catalog Sync | [catalog-sync.md](./catalog-sync.md) | P0 |
| PRD-006 | AI Sales Employee | [ai-sales-employee.md](./ai-sales-employee.md) | P0 |
| PRD-007 | Settings / Guardrails | [settings-guardrails.md](./settings-guardrails.md) | P0 |
| PRD-008 | Context Engine | [context-engine.md](./context-engine.md) | P0 |
| PRD-009 | Knowledge Base | [knowledge-base.md](./knowledge-base.md) | P0 |
| PRD-010 | Conversation History | [conversation-history.md](./conversation-history.md) | P0 |
| PRD-011 | Human Handoff / Escalation | [human-handoff.md](./human-handoff.md) | P0 |
| PRD-012 | Workspace Inbox | [workspace-inbox.md](./workspace-inbox.md) | P0 |
| PRD-013 | Website Chat | [website-chat.md](./website-chat.md) | P0 |
| PRD-014 | Telegram | [telegram.md](./telegram.md) | P0 |
| PRD-015 | Bale | [bale.md](./bale.md) | P0 |
| PRD-016 | Order Lookup | [order-lookup.md](./order-lookup.md) | P0 |
| PRD-017 | Product Recommendation | [product-recommendation.md](./product-recommendation.md) | P0 |
| PRD-018 | Audit Logs | [audit-logs.md](./audit-logs.md) | P0 |
| PRD-019 | Basic Analytics | [basic-analytics.md](./basic-analytics.md) | P0 |
| PRD-020 | Revenue Dashboard (basic) | [revenue-dashboard.md](./revenue-dashboard.md) | P0 |

---

## Explicitly not in this folder (MVP)

Instagram, WhatsApp, email, voice, CRM, helpdesk, marketing automation, flow/workflow builders, Skill Marketplace, multi-brand enterprise, white label, native apps, advanced BI, self-serve billing (V1), Support Employee as dedicated role (Growth).
