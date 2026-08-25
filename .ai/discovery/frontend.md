# Frontend Architecture (as implemented)

Docs in `docs/03-architecture/frontend-architecture.md` describe a **target** Feature-Sliced Design + TanStack Query stack. **That stack is not what the apps use today.** Follow the code.

## Stack (actual)

| Concern | Choice | Evidence |
|---------|--------|----------|
| Workspace / Storefront / Web | Next.js `^15.3.3` App Router | each app `package.json`, `src/app/` |
| Widget | Vite `^6.3.5` + React `^19.1.0` | `apps/widget/package.json` |
| React | `^19.1.0` | all UI apps |
| Styling | Tailwind CSS `^3.4.17` | workspace, storefront, web |
| Workspace UI primitives | Radix + CVA + `cn()` + lucide-react | `apps/workspace/src/components/ui/` |
| Theming | `next-themes` (workspace) | `apps/workspace/package.json` |
| Server state | **None** (no TanStack Query, no Zustand) | no matches in any `package.json` |
| Forms | Local `useState` + `FormDialog` | `apps/workspace/src/components/shared/form-dialog.tsx` |
| Validation (FE) | Ad-hoc; backend `class-validator` is the contract | no Zod |
| i18n | Persian-first, `lang="fa"` `dir="rtl"` | `apps/workspace/src/app/layout.tsx` |
| Font | Vazirmatn from jsDelivr | workspace layout |
| Storybook | Not present | — |

Do **not** add Zustand, TanStack Query, React Hook Form, or Zod unless a task explicitly requires them and existing patterns cannot serve.

## Workspace (`apps/workspace`)

Merchant control plane. Port **3010**.

### Routing (App Router)

Routes under `apps/workspace/src/app/`:

| Route | Screen |
|-------|--------|
| `/login` | Auth |
| `/` `/home` | Home / attention |
| `/onboarding` | Checklist |
| `/dashboard` | Outcomes + wallet |
| `/store` | External store connect (Shopify/Woo path) |
| `/shop` | Native shop overview |
| `/shop/products` `/categories` `/attributes` `/inventory` `/discounts` `/articles` `/orders` `/customers` `/settings` `/appearance` | CMS |
| `/employee` | Sales Employee |
| `/channels` | Website / Telegram / Bale / Instagram |
| `/inbox` | Conversations + handoff |
| `/knowledge` | FAQ / overrides |
| `/audit` | Transparent AI + admin audit |
| `/billing` `/billing/usage` `/billing/history` `/billing/ops` | Credit wallet |
| `/access` | Access-request ops |

### Folder conventions (actual, not FSD)

```
apps/workspace/src/
  app/                 route pages (*Client.tsx when needed)
  components/
    ui/                Radix primitives
    layout/            sidebar, topbar, mobile nav
    shared/            page-header, empty-state, form-dialog, stat-card
    shop/              image-field, variant-manager
    providers.tsx
  shared/
    api.ts             createApiClient + localStorage token
    AppShell.tsx
  hooks/use-toast.ts
  lib/notify.ts        toastSuccess / toastFromError
  lib/utils.ts         cn, formatCurrency (تومان)
  lib/money.ts
```

There are **no** `features/`, `entities/`, or `widgets/` FSD layers.

### Data fetching

- `'use client'` pages call `api` from `@/shared/api`.
- Token: `localStorage` key `seloma_token` (legacy `delorey_token`).
- Errors: `toastFromError` / `toastSuccess` (`apps/workspace/src/lib/notify.ts`).
- No global cache. Refetch with `useEffect` + local state.

### API client wiring

```
apps/workspace/src/shared/api.ts
  → createApiClient({ baseUrl: NEXT_PUBLIC_API_BASE_URL, getToken })
  → Authorization: Bearer <session token>
```

## Storefront (`apps/storefront`)

Public shop. Port **3020**. Routes under `apps/storefront/src/app/s/[storeSlug]/`:

| Path | Page |
|------|------|
| `/s/[storeSlug]` | Home |
| `.../products` `.../products/[productSlug]` | Listing / PDP |
| `.../cart` `.../checkout` | Cart / checkout |
| `.../track` | Order track |
| `.../articles` `.../articles/[articleSlug]` | CMS articles |

Themes: `apps/storefront/src/themes/`. Cart session: `localStorage` `seloma_cart_${storeSlug}` (`apps/storefront/src/lib/api.ts`). Money display: **ریال** via `formatIrr` (distinct from Workspace `formatCurrency` in تومان — do not mix).

Uses `@seloma/api-client` **without** a merchant token.

Static Figma export assets exist under `apps/storefront/public/figma/` (SVG icons). That is **not** a live Figma connection.

## Widget (`apps/widget`)

Vite embed + harness. Port **5173**.

- `ChatWidget.tsx`, `embed.tsx`, `App.tsx`
- Uses `@seloma/api-client` public chat methods (`createChatSession`, `sendChatMessage`, `listChatMessages`) with `x-public-key`
- No commerce mutations

## Marketing web (`apps/web`)

Port **3000**. Landing, pricing, access request, pay.

- Own fetch helper: `apps/web/src/lib/api.ts` → `POST /v1/public/access-requests`
- Plans defined in that file (`SITE_BUILDER_PLANS`, `AI_EMPLOYEE_PLANS`)
- Uses `@seloma/ui` tokens; does not use api-client

## Shared UI package

`packages/ui/src/`:

- `colors.ts` / `colors.css` — Seloma tokens
- `tokens.ts` — FA labels for AI state, channels, order status, decisions, etc.
- `ai-state-chip.tsx`

Reuse these labels instead of inventing a second enum→Persian map when one already exists. Workspace orders page currently has a **local** `STATUS_FA` in `apps/workspace/src/app/shop/orders/page.tsx` — prefer `@seloma/ui` `orderStatusLabel` when extending, but do not drive-by rewrite working maps.

## Testing

**No frontend unit/E2E test files** were found under workspace/storefront/web/widget. Frontend tasks still require typecheck. Do not introduce Jest/Playwright/Cypress unless explicitly requested.

## Accessibility / RTL

Workspace and storefront are RTL. Keep `dir="rtl"`. Merchant-visible enums must be Persian labels, not raw English codes (`docs/05-ui/copy-tone.md`).
