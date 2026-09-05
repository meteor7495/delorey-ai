# Seloma Persian Terminology Dictionary

Single source of truth for user-facing product language.  
Implementation mirror: `packages/ui/src/tokens.ts`.

## Core product

| Current (avoid) | Recommended | Alternative | Where | Never use |
|-----------------|-------------|-------------|-------|-----------|
| AI Employee | دستیار هوشمند | دستیار هوشمند فروش / پشتیبانی (by role) | Nav, pages, marketing | کارمند هوش مصنوعی، AI Employee |
| AI Employees (plural) | دستیارهای هوشمند | تیم دستیارها | Lists, marketing | کارمندان AI |
| AI Agent / Agent | دستیار | — | If needed at all | ایجنت، Agent |
| AI Commerce / AI Commerce OS | تجارت هوشمند | پلتفرم فروش هوشمند | Marketing only | AI Commerce OS in UI |
| Workspace | فضای کاری | پنل سِلوما | Onboarding, CTAs | Workspace (Persian UI) |
| Dashboard | پیشخوان | — | Nav, page title | داشبورد |
| Analytics | آمار فروش / گزارش‌ها | — | KPI sections | آنالیتیکس |
| Knowledge Base / دانش | اطلاعات فروشگاه | اطلاعات کسب‌وکار | Knowledge pages | Knowledge Base |
| Integration | اتصال سرویس | اتصال | Nav, settings | یکپارچه‌سازی، Integration |
| Workflow | فرایند | — | Automations | ورک‌فلو |
| Automation | خودکارسازی | — | Features | اتوماسیون |
| Prompt | نمونه سؤال / درخواست | — | Onboarding tests | پرامپت |
| Generate | ایجاد / ساخت | تولید | Buttons | جنریت |
| Configure | تنظیم | — | Forms | Configure |
| Execute | اجرا | انجام | Actions | Execute |
| Submit | ارسال / ذخیره | — | Forms | Submit |
| Loading | (contextual) | در حال … | Loading states | Loading… |
| Grounded | بر اساس داده واقعی فروشگاه | — | Descriptions | grounded |
| Intent | نیت خرید | — | Sales flows | intent |
| GMV | حجم فروش | ارزش کل فروش | Dashboard | GMV (prefer FA) |
| MCP / Runtime | (hide from merchants) | اتصال سرویس | Integrations page | MCP، Runtime |
| Command Center | پیشخوان فروش | مرکز کنترل | Home (AI) | مرکز فرمان AI |

## Commerce

| Current | Recommended | Never use |
|---------|-------------|-----------|
| Product | محصول | پروداکت |
| Customer | مشتری | کاستومر |
| Order | سفارش | اوردر |
| Store | فروشگاه | استور |
| Sales | فروش | سیلز |
| Support | پشتیبانی | ساپورت |
| Campaign | کمپین | (English in FA UI) |
| Settings | تنظیمات | ستینگ |
| Insights | پیشنهادها / نکات مهم | اینسایت |

## Assistant roles (marketing & UI)

| Role key | Display name |
|----------|--------------|
| sales | دستیار هوشمند فروش |
| support | دستیار هوشمند پشتیبانی |
| product | مشاور هوشمند محصول |
| marketing | دستیار هوشمند بازاریابی |
| commerce | دستیار هوشمند تجارت |
| operations | دستیار هوشمند عملیات |
| analyst | دستیار هوشمند تحلیل |

## Employee status (API → UI)

| API | Persian |
|-----|---------|
| active | فعال |
| paused | متوقف |
| inactive | غیرفعال |

## Operating mode (API → UI)

| API | Persian |
|-----|---------|
| copilot | همراه (پیشنهاد می‌دهد) |
| assistant | دستیار (پاسخ می‌دهد) |
| autopilot | خودکار (بدون تأیید) |

## Ownership

| API | Persian |
|-----|---------|
| ai_owned | پاسخ‌گوی دستیار |
| human_owned | در اختیار همکار |

## Message roles

| API | Persian |
|-----|---------|
| assistant / ai / employee | دستیار هوشمند |
| operator | همکار فروشگاه |
| shopper | مشتری |

## Marketing vs product UI

- **Marketing** (`apps/web`): benefit-oriented, may say «تیم هوشمند»، «دستیارهای هوشمند»
- **Product UI** (`apps/workspace`): short, functional — «دستیار هوشمند»، «پیشخوان»، «اطلاعات فروشگاه»

Brand name **سِلوما / Seloma** stays as-is.
