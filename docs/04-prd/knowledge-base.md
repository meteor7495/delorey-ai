# PRD-009 — Knowledge Base

## Metadata

| Field | Value |
|-------|-------|
| **PRD ID** | PRD-009 |
| **Feature** | Knowledge Base |
| **Phase** | MVP |
| **Status** | Ready for eng |
| **Owner** | Product |
| **Last Updated** | July 25, 2026 |
| **Related** | [Product Scope](../02-product/product-scope.md) · [Knowledge & RAG Design](../03-architecture/knowledge-rag-design.md) · [User Journey](../02-product/user-journey.md) Stages 7 & 11 |

---

# 1. Problem

Sync alone cannot cover edge FAQs, sizing charts, and brand policy overrides. Thin KB → escalations and weak policy answers.

# 2. Goal

Merchants manage FAQ/policy overrides and basic uploads with source attribution; async RAG index; retrieval for Context; correction loop from dashboard gaps.

# 3. In scope / Out of scope

| In | Out |
|----|-----|
| FAQ, policy_override, PDF/text upload; chunk/embed/index; citations; index status; keyword fallback; `knowledge.updated` | Unattributed dump; billing by KB size; approval workflow IDE; Marketplace packs |

# 4. Users & Journey

Stages 7 testing edits; 10 gaps; 11 continuous improvement.

# 5. Functional requirements

1. MUST CRUD FAQ/policy overrides with `source_attribution`.  
2. MUST accept basic uploads to Object Storage with validation/malware scan.  
3. MUST chunk → Embed via Gateway → tenant Vector on `batch.embed`.  
4. MUST show status active/indexing/failed — never pretend instant learn.  
5. MUST serve Retrieve API to Context with citations.  
6. MUST fallback keyword/FAQ on vector timeout.  
7. MUST serve last good index if reindex fails; emit `knowledge.reindex_failed`.  
8. Empty policy retrieval → prefer “I don’t know”/escalate over inventing.

# 6. UX requirements

KB editors; attribution visible; index health; gap lists from dashboard.

# 7. Technical contracts

`/v1/.../knowledge/*` — API Spec. Knowledge & RAG Design.

# 8. Principle checklist

| Question | Pass? | Notes |
|----------|-------|-------|
| Business value | Yes | Higher resolution, fewer hallucinations |
| AI Employee impact | Yes | Ground answers in Knowledge |
| Friction | Yes | Edit FAQ vs rewrite flow trees |
| Scope fit | Yes | MVP Knowledge Base |
| Principle compliance | Yes | Transparent AI; Improve from correction |
| Measurement | Yes | Index lag; retrieval hit rate; gaps |
| Kill criteria | Yes | Below |

# 9. Measurement

Index lag; reindex failure rate; citation coverage; knowledge-gap topics.

# 10. Acceptance criteria

- [ ] FAQ edit becomes searchable after index job.  
- [ ] Audit shows source attribution on policy answers.  
- [ ] Cross-tenant vector isolation tested.  

# 11. Kill criteria

Unattributed blob dump shipped as “KB” → reject.

# 12. Dependencies & risks

Gateway Embed, Context, Workspace UI, index-worker.

# 13. Anti-pattern check

Not a document CMS product; not flow builder replacement.
