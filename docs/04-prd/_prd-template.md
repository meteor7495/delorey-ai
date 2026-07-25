# PRD Template

## Metadata

| Field | Value |
|-------|-------|
| **PRD ID** | PRD-XXX |
| **Feature** | |
| **Phase** | MVP \| V1 \| Growth \| Platform |
| **Status** | Draft \| Ready for eng \| In build \| Shipped |
| **Owner** | Product |
| **Last Updated** | |
| **Related** | [Product Scope](../02-product/product-scope.md) · [Product Principles](../02-product/product-principles.md) · [User Journey](../02-product/user-journey.md) · architecture docs |

Incomplete PRDs (missing principle checklist, metrics, or kill criteria) **do not enter engineering** ([Product Principles](../02-product/product-principles.md)).

---

# 1. Problem

Who hurts, how often, cost of doing nothing.

---

# 2. Goal

One sentence: what merchant/shopper outcome this unlocks.

---

# 3. In scope / Out of scope

| In | Out |
|----|-----|
| | Must cite Product Scope OUT OF MVP or phase |

---

# 4. Users & Journey stages

| Persona | Journey stage(s) |
|---------|------------------|
| | |

---

# 5. Functional requirements

Numbered MUST / SHOULD.

---

# 6. UX requirements

Align with UX Principles: one job per screen, clear AI state, visible failures, mobile-usable where Workspace.

---

# 7. Technical contracts

APIs, events, data entities — link [API Specification](../03-architecture/api-specification.md) and relevant architecture docs. Do not invent outside those contracts.

---

# 8. Principle checklist (required)

| Question | Pass? | Notes |
|----------|-------|-------|
| Business value (named metric + hypothesis) | | |
| AI Employee impact | | |
| Friction reduction | | |
| Scope fit (phase) | | |
| Principle compliance (no unresolved violations) | | |
| Measurement (events/dashboards before build) | | |
| Kill criteria defined | | |

---

# 9. Measurement

| Metric / event | Where shown |
|----------------|-------------|
| | |

---

# 10. Acceptance criteria

Testable bullets. Map to [Testing Strategy](../03-architecture/testing-strategy.md) where relevant.

---

# 11. Kill criteria

Evidence that would stop or reverse the feature.

---

# 12. Dependencies & risks

---

# 13. Anti-pattern check

Confirm this does **not** introduce: chatbot builder, CRM/helpdesk SoR, marketing suite, flow builder, black-box AI, channel-native logic, attribution theater, premature marketplace.
