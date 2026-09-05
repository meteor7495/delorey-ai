# Seloma UX Writing Audit (2026-08-31)

## A. Terminology problems

| Term | Locations | Issue |
|------|-----------|-------|
| AI Employee / کارمند AI | landing-content, workspace nav, employees pages | Technical; merchants don't know what it means |
| AI Commerce OS | HERO, ValueProp, footer | English product jargon |
| Workspace | landing CTAs, request/pay pages | English in Persian UI |
| داشبورد | sidebar, mobile nav, dashboard page | Transliteration; prefer پیشخوان |
| یکپارچه‌سازی / MCP | integrations nav & page | Technical |
| مرکز فرمان AI | home page | Exposes AI architecture |
| GMV, IRT, grounded, intent, estimate | dashboard, home, landing | English/internal metrics in UI |
| Sales AI, Support AI, … | hero, value prop | English role names |
| پرامپت smoke, harness | onboarding | Developer jargon |
| Tool overrides, enabled/disabled | integrations | Untranslated English |
| active, copilot, autopilot | employee detail selects | Raw API enums |
| COMMERCE | sidebar brand | English tagline |

## B. Ambiguous UX copy

| Location | Text | Problem |
|----------|------|---------|
| home | «بسپار به AI» | Unclear action |
| home | «وظایف موفق AI» | Technical |
| dashboard empty | «هنوز داده‌ای نیست» | Generic; improved with channel hint (kept) |
| integrations | «کلاینت‌های MCP» | Meaningless to merchants |
| employee detail | «پیکربندی» | Prefer «تنظیمات دستیار» |
| knowledge nav | «دانش» | Prefer «اطلاعات فروشگاه» |

## C. Inconsistent terminology

| Concepts mixed | Chosen standard |
|----------------|-----------------|
| کارمند فروش / کارمند AI / کارمند هوش مصنوعی / AI Employee | **دستیار هوشمند** (+ role) |
| داشبورد / dashboard | **پیشخوان** |
| دانش / Knowledge Base | **اطلاعات فروشگاه** |
| یکپارچه‌سازی / Integration | **اتصال سرویس** |
| فضای کاری / Workspace | **فضای کاری** (FA) |

## D. Technical language exposed to users

- MCP, Runtime, tenant-scoped (FAQ)
- Grounded AI, AI Team, AI Commerce
- API enum values in employee cards
- Developer doc paths in onboarding
- JSON-LD English description (partially updated)

## E. UX writing problems

| Category | Examples | Fix direction |
|----------|----------|---------------|
| CTAs | «درخواست بسته AI» | «درخواست فعال‌سازی دستیار» |
| Onboarding | «کارمند فروش فعال» | «دستیار هوشمند فعال» |
| Empty states | «کارمند AI grounded» | Explain catalog benefit in FA |
| Errors | Mostly OK via notify | Keep human FA messages |
| AI features | «تأییدهای AI» | «درخواست‌های تأیید» |
| Long marketing | FAQ tenant-scoped | Remove infra terms |

## F. Approved vocabulary (summary)

See **`.ai/writing/persian-terminology.md`** for full dictionary.

Primary transforms applied in this task:

1. `packages/ui/src/tokens.ts` — enum label helpers expanded
2. `apps/workspace/**` — nav, pages, locked states
3. `apps/web/src/lib/landing-content.ts` — marketing rewrite
4. Landing components — inline English removed
5. Storefront dev strings — Workspace → فضای کاری

## Post-implementation scan targets

Search and review (user-facing only):

- `AI Employee`, `AI Agent`, `Agent`, `Workflow`, `Automation`
- `Dashboard`, `Analytics`, `Integration`, `Prompt`, `Generate`
- `Configure`, `Execute`, `Submit`, `Loading`, `grounded`, `intent`
- `کارمند AI`, `کارمندان AI`, `داشبورد`, `یکپارچه`

Internal code identifiers and API paths are intentionally unchanged.
