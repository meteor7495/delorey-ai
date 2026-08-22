# Billing — Credit Wallet, Pay-as-you-go, Auto Recharge

## Metadata

| Field | Value |
|-------|-------|
| **Status** | Active |
| **Last Updated** | August 22, 2026 |
| **Module** | `apps/api/src/modules/billing` |

## Audit summary (what existed vs what was built)

| Area | Before | Decision |
|------|--------|----------|
| SaaS plan strings on `Tenant` | existed | **Reuse** — included credit grants map from `plan` |
| Shop `Payment` / ZarinPal | existed (storefront orders) | **Reuse providers**, **do not** overload order `payments` |
| `AiCallEvent` USD ledger | existed (COGS observability) | **Keep** internal; merchant billing is IRT UsageRecord |
| Wallet / ledger / auto-recharge | missing | **Build** in modular monolith |
| Kafka / billing microservice | non-goal | **Do not build** |

Tenant is **always** taken from `SessionAuthGuard` (`auth.tenantId`). Merchant APIs ignore body `tenantId`. Admin APIs use URL/body tenant as the **target** tenant and require `PLATFORM_ADMIN_EMAILS`.

## Model

```
Subscription → Included Credit (SUBSCRIPTION_CREDIT)
Usage → Pricing Engine → customer_charge vs provider_cost
Wallet debit (atomic, FOR UPDATE) → append-only ledger
Low balance → optional Auto Recharge (lock + cooldown + monthly cap)
```

Merchant UI unit is **تومان**. Tokens appear only on `/admin/billing/*` (provider cost / units).

## Money path

Critical charges run in a Postgres transaction with `SELECT … FOR UPDATE` on `wallets`. Available balance is `balance - reserved`. Negative balance is rejected in the same update.

Payment callbacks are idempotent via:

- `billing_payments.idempotency_key` unique
- `billing_payments.provider_transaction_id` unique
- `wallet_transactions.idempotency_key` unique (`ledger:{paymentKey}`)

Replay of ZarinPal/mock callback credits once.

## Integration

- **AI Gateway** `complete()`: reserve estimated IRT → provider → capture actual + `UsageRecord`. Mock mode does not charge.
- **Access** `confirmPayment`: grants `SubscriptionCreditGrant` for the plan.
- **Identity** trial signup: grants trial included credit.
- Notifications use existing `notification_outbox` (`channel=workspace`, `kind=billing.*`).

## APIs

Tenant (session-scoped):

- `GET /v1/billing/wallet`
- `GET /v1/billing/usage`
- `GET /v1/billing/transactions`
- `POST /v1/billing/credits/purchase`
- `GET|PUT /v1/billing/auto-recharge`
- `GET|PUT /v1/billing/spending-limit`

Callbacks (public):

- `GET /v1/billing/payments/zarinpal/callback`
- `GET /v1/billing/payments/mock/:paymentId`

Admin (`PLATFORM_ADMIN_EMAILS`):

- `GET /v1/admin/billing/tenants/:tenantId`
- `GET /v1/admin/billing/usage|transactions|margins`
- `POST /v1/admin/billing/credit|refund`
- `GET|POST /v1/admin/billing/pricing`

## Fail closed

If billing cannot lock/price/charge, live AI does not call the provider (or does not retry a new charge key after an uncertain capture). Read-only wallet views may return empty after a soft error at the UI.
