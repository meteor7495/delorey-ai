# Validation Rules

## Backend (source of truth for writes)

- DTO classes with `class-validator`
- Global pipe: whitelist + forbid non-whitelisted + transform (`main.ts`)
- Domain invariants in `shop/domain` (order transitions, rejection reason, stock, discounts)
- `CommerceRuleError` for domain rule failures

Never weaken `forbidNonWhitelisted` globally. Never skip DTO validation “just for the UI”.

## Frontend

- No Zod / RHF in tree today
- Validate UX-side for empty fields and Persian copy, but **do not** treat UI checks as security
- Server must re-validate everything (tenant, stock, price, status transitions)

## Orders

- Reject requires a reason (`normalizeRejectionReason` / reject API)
- Illegal status transitions must fail (see `order-workflow.spec.ts`)
- Prefer `approve` / `reject` endpoints over free-form status strings when those semantics apply

## Payments

- Never trust client “paid” flags
- Verify via provider + lock + DB uniqueness patterns already in PaymentsService

## Phone / customer identity

- Use existing `phone` normalization helpers (`modules/shop/phone.ts`)
- Prefer no merge over wrong merge across channel identities
