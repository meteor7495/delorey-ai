# Vertical Slice 05 — Knowledge FAQ

## Metadata

| Field | Value |
|-------|-------|
| **Version** | 0.1 |
| **Status** | Done — FAQ CRUD + keyword index + Runtime retrieval |
| **Last Updated** | July 26, 2026 |
| **Depends on** | Slice 01–04 (Runtime, channels) |
| **PRD** | [PRD-009 Knowledge Base](../04-prd/knowledge-base.md) |

**Goal:** Merchants CRUD FAQ / policy overrides with `source_attribution`; sync chunk index (keyword retrieval); Runtime retrieves Knowledge into CONTEXT before generation; citations show attribution. Honest index status (`indexing` → `active`).

Verified: list/create docs → index active → ask «شرایط بازگشت» / «هزینه ارسال» → `answer_knowledge` with source attribution.

**Out of this slice:** Vector DB / embeddings live path, PDF malware scan, gap dashboard analytics, marketplace packs.

---

# Checklist

- [x] Prisma `knowledge_docs` + `knowledge_chunks`  
- [x] `GET/POST/PATCH/DELETE /v1/knowledge/docs` + `GET /v1/knowledge/index-status`  
- [x] Sync index worker (chunk body → active)  
- [x] Keyword retrieve wired into Runtime + mock gateway  
- [x] Workspace `/knowledge` UI + nav  
- [x] Demo seed FAQ; smoke: ask policy → attributed answer  

---

# Local note

Index is **synchronous keyword chunks** for MVP demos (`status: indexing` then `active`). Vector embed path stays behind Gateway for a later slice — never pretend instant magic without status.
