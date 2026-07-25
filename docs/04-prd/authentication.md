# PRD-001 — Authentication

## Metadata

| Field | Value |
|-------|-------|
| **PRD ID** | PRD-001 |
| **Feature** | Authentication |
| **Phase** | MVP |
| **Status** | Ready for eng |
| **Owner** | Product |
| **Last Updated** | July 25, 2026 |
| **Related** | [Product Scope](../02-product/product-scope.md) · [User Journey](../02-product/user-journey.md) Stage 2 · [API Specification](../03-architecture/api-specification.md) · [Security Architecture](../03-architecture/security-architecture.md) |

---

# 1. Problem

Without identity, there is no Workspace, no tenant boundary, and no safe operations. Merchants cannot connect stores or hire an Employee.

# 2. Goal

Merchants can sign up, log in, reset password, and hold a secure session that gates every Workspace action.

# 3. In scope / Out of scope

| In | Out |
|----|-----|
| Signup, login, logout, password reset, secure session, `GET /me` | SSO/SAML (Platform), social login theater, anonymous multi-tenant ops |

# 4. Users & Journey

| Persona | Stage |
|---------|-------|
| Merchant founder | Journey 2 — Signup |

# 5. Functional requirements

1. MUST support email+password signup creating user + Workspace/Tenant provisioning path.  
2. MUST support login establishing secure HTTP-only (or equivalent) session.  
3. MUST support logout invalidating session.  
4. MUST support password reset request + confirm.  
5. MUST expose current user + workspace memberships.  
6. MUST never log or return plaintext passwords.  
7. MUST fail closed on unauthenticated Workspace API access.

# 6. UX requirements

Clear errors; no empty “build a bot” after signup — push to activation checklist (connect store).

# 7. Technical contracts

`/v1/auth/*` per [API Specification](../03-architecture/api-specification.md). Provisioning emits `tenant.provisioned` side effects (default inactive Sales Employee, empty KB namespace).

# 8. Principle checklist

| Question | Pass? | Notes |
|----------|-------|-------|
| Business value | Yes | Enables all SaaS value; metric: signup→Workspace created |
| AI Employee impact | Yes | Gate to hire Employee |
| Friction | Yes | Fast path to control plane |
| Scope fit | Yes | MVP Authentication |
| Principle compliance | Yes | Security By Default |
| Measurement | Yes | Signup/login success events |
| Kill criteria | Yes | Below |

# 9. Measurement

Signup success rate; login failure rate; password-reset completion.

# 10. Acceptance criteria

- [ ] Unauthenticated calls to Workspace APIs return 401.  
- [ ] Session cookie/token not accessible to XSS via HTTP-only where used.  
- [ ] Password reset works end-to-end on staging.  
- [ ] Signup provisions tenant isolation boundary (verified with PRD-003 tests).  

# 11. Kill criteria

Auth so fragile that design partners cannot retain sessions → stop channel polish until fixed.

# 12. Dependencies & risks

Depends on Tenant/Workspace provisioning. Risk: account enumeration — use safe reset messaging.

# 13. Anti-pattern check

Does not introduce CRM, marketplace, or chatbot builder.
