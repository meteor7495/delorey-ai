# Seloma Persian UX Writing Skill

Use this skill for any user-facing copy in Seloma (Workspace, Storefront, Widget, Web).

## Purpose

Seloma speaks to **Iranian online-shop owners** who may know little about AI. Copy must explain **what happens for the business**, not how the technology works.

## Language principles

The UI must be:

- Persian-first
- Clear, simple, natural, friendly, professional
- Action-oriented and concise
- Non-technical for functional UI
- Suitable for merchants with little AI knowledge

Avoid:

- Literal English-to-Persian translations
- Overly formal Persian / corporate jargon
- Technical AI terminology in product UI
- Unnecessary English words
- Marketing buzzwords inside buttons, forms, and settings

## Product philosophy

Communicate:

> این ابزار چه کاری از دوش شما برمی‌دارد؟

Do **not** repeatedly expose: Agent, Model, Workflow architecture, Prompt, MCP, Runtime, Grounded, tenant-scoped, etc.

Marketing pages may be more persuasive; **functional UI** stays short and direct.

## Canonical terms

See **`.ai/writing/persian-terminology.md`** — the single source of truth. Never invent alternate labels in one-off PRs.

Key defaults:

| Concept | Use | Avoid |
|---------|-----|-------|
| AI Employee | دستیار هوشمند (+ نقش: فروش، پشتیبانی، …) | AI Employee، کارمند AI، ایجنت |
| Dashboard | پیشخوان | داشبورد |
| Knowledge | اطلاعات فروشگاه | Knowledge Base، دانش‌نامه |
| Integration | اتصال سرویس | یکپارچه‌سازی، Integration |
| Automation | خودکارسازی | اتوماسیون، Automation |
| Workflow | فرایند | ورک‌فلو |
| Workspace (product) | فضای کاری / پنل سِلوما | Workspace (in FA UI) |

## Writing patterns

### Buttons

Describe the action: «ذخیره تغییرات»، «ساخت دستیار»، «اتصال فروشگاه» — not «Submit»، «Configure»، «Execute».

### Empty states

Explain situation + next step:

> هنوز سفارشی ثبت نشده است.  
> وقتی اولین سفارش ثبت شود، اینجا نمایش داده می‌شود.

### Errors

Human-readable, no API jargon:

> دریافت اطلاعات با مشکل مواجه شد. لطفاً دوباره تلاش کنید.

### Loading

Contextual: «در حال دریافت سفارش‌ها…» — not generic «Loading…».

### API enum values

Never show raw English enums (`active`, `copilot`, `enabled`) to merchants. Map via `@seloma/ui` label helpers.

## Persian quality

- Use نیم‌فاصله: می‌توانید، راه‌اندازی، به‌روزرسانی
- Prefer contemporary Persian over Arabic-heavy formalisms
- Keep sentences short
- Stay consistent with the terminology dictionary

## English exceptions

Keep English only when genuinely clearer or required: brand names (Seloma, Google, WhatsApp), stable product names (Shopify), and technical identifiers in `code` / developer-only UI.

## Where labels live

1. **`packages/ui/src/tokens.ts`** — shared FA labels for enums, roles, decisions
2. **`apps/web/src/lib/landing-content.ts`** — marketing copy
3. Page components — minimal local copy; prefer importing from tokens or landing-content

## Review checklist (before merge)

For every changed screen:

1. Does the user understand what this page is for?
2. Is the next step obvious?
3. Are CTAs action-oriented?
4. Is unnecessary technical language removed?
5. Is terminology consistent with `.ai/writing/persian-terminology.md`?
6. Does copy focus on **result**, not technology?

## Do not change

- API contracts, Prisma, route paths, TypeScript interface names
- Internal variable names unless they leak to UI
- Backend error codes (map to FA at display layer only)
