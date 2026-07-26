# Vertical Slice 06 — Order Lookup

## Metadata

| Field | Value |
|-------|-------|
| **Version** | 0.1 |
| **Status** | Done — Skill `order_status` with verification gate |
| **Last Updated** | July 26, 2026 |
| **Depends on** | Slice 01–05 |
| **PRD** | [PRD-016 Order Lookup](../04-prd/order-lookup.md) |

**Goal:** Skill `order_status` reads synced mock orders from Commerce Core; requires order number + phone last-4 verification before revealing status/tracking; never invents; never mutates.

Verified: need id → need verify (no leak) → verified grounded (`DR-1001` / `1234`) → missing / bad verify refuse.

**Out:** Cancel/refund, carrier live APIs, full Support Employee.

---

# Checklist

- [x] Prisma `orders` + demo seed (`DR-1001`, `DR-1002`)  
- [x] Employee `order_status` skill enabled for demo  
- [x] Runtime skill path + verification gate  
- [x] Audit `order_lookup` / `order_lookup_need_verify`  
- [x] Smoke: verified → grounded; unverified → no leak  

---

# Demo

| Order | Phone last4 | Status |
|-------|-------------|--------|
| `DR-1001` | `1234` | shipped · tracking `TRK-77881` |
| `DR-1002` | `5678` | processing |

Widget/Telegram/Bale: «وضعیت سفارش DR-1001» → then «1234».
