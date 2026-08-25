# Security Rules

Aligned with `docs/03-architecture/security-architecture.md` and current code.

## Hard requirements

1. **Tenant isolation** — every merchant read/write scoped; fail closed.
2. **AuthN** — `SessionAuthGuard` for Workspace APIs; widget public key + origin checks; webhook verification.
3. **Secrets** — bot/store/provider keys never in repo, prompts, logs, or GET responses.
4. **AI tool safety** — no unguarded refund/cancel; Guardrails hard stops; Gateway is not the only safety layer.
5. **Uploads** — size/type constraints via existing uploads controller patterns; tenant-scoped paths.
6. **PII** — minimize in logs; do not cache personalized replies across shoppers in shared keys.
7. **CORS / origins** — respect website channel allowlists; do not disable origin checks.

## Threats to keep in mind

Cross-tenant leak, prompt injection bypassing tools, stolen bot token, cost bomb, webhook forgery, invented price/stock (trust failure).

## Do not

- Trust adapter/body `tenantId` without binding lookup
- Return encrypted secrets decrypted to the browser
- Log Bearer tokens or API keys
- Disable handoff to fake automation metrics
- Add “temporary” auth bypasses
