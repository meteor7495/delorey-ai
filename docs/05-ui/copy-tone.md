# Copy & Tone

## Metadata

| Field | Value |
|-------|-------|
| **Version** | 0.1 |
| **Status** | Active — Persian-first MVP voice |
| **Last Updated** | July 25, 2026 |
| **Parent** | [Product Vision](../02-product/product-vision.md) · [UX Foundation](./ux-foundation.md) |
| **Related** | [Workspace Screens](./workspace-screens.md) · [Widget UX](./widget-ux.md) |

**Job:** One voice for merchant Workspace and shopper Widget system messages. Hire an Employee — don’t “build a bot.”

---

# 1. Positioning language

| Prefer | Avoid |
|--------|-------|
| کارمند فروش هوش مصنوعی | ربات چت / چت‌بات‌ساز |
| همگام‌سازی فروشگاه | آموزش مدل |
| دانش و سیاست‌ها | پرامپت جادویی |
| تحویل به همکار انسانی | تیکت |
| وضعیت همگام‌سازی ناسالم | همه‌چیز عالی (وقتی نیست) |

English eng docs may say Employee / Handoff / Sync; **UI strings are Persian-first** for Iran MVP.

---

# 2. Voice attributes

| Attribute | Meaning |
|-----------|---------|
| **Direct** | Short sentences; one action |
| **Honest** | Admit gaps; no fake confidence |
| **Calm** | Ops under stress — no hype |
| **Respectful** | Merchants are operators; shoppers are customers |

---

# 3. Merchant Workspace — patterns

### Success

- «فروشگاه متصل شد.»  
- «همگام‌سازی موفق — آخرین به‌روزرسانی: …»  
- «کانال وبسایت آماده است.»

### Attention / warning

- «همگام‌سازی عقب افتاده است؛ قیمت و موجودی ممکن است نادرست باشد.»  
- «کارمند در حالت متوقف است.»  
- «N گفتگو در انتظار پاسخ انسانی است.»

### Errors

- Structure: *چه شد* + *چی کار کنی*.  
- «اتصال تلگرام برقرار نشد. توکن را بررسی کنید و دوباره تلاش کنید.»  
- Never: «خطای ناشناخته» without Retry.

### Guardrails / enforcement

- «سقف تخفیف اعمال می‌شود؛ بیش از آن نیاز به تأیید انسانی دارد.»  
- «این تنظیمات در Runtime به‌صورت قطعی اعمال می‌شوند — صرفاً تزئینی نیستند.»

### Empty states

- Inbox: «هنوز گفتگویی نیست. یک کانال را فعال کنید یا گفتگوی آزمایشی بسازید.»  
- Knowledge: «اولین پرسش متداول را اضافه کنید تا پاسخ‌ها دقیق‌تر شوند.»  
- Dashboard: «هنوز داده‌ای برای این بازه نیست.» — not fake charts.

---

# 4. AI state labels (canonical FA)

| State | Label |
|-------|-------|
| inactive | غیرفعال |
| active | فعال |
| paused | متوقف |
| syncing | در حال همگام‌سازی |
| degraded | مختل |
| awaiting_human | در انتظار انسان |

Ownership: `پاسخ‌گوی AI` · `در اختیار اپراتور`.

---

# 5. Escalation reason labels (merchant)

| Code (eng) | Label (FA) |
|------------|------------|
| customer_request | درخواست مشتری برای انسان |
| blocked_topic | موضوع محدودشده |
| low_confidence | اطمینان پایین |
| discount_cap | بیش از سقف تخفیف |
| sync_unhealthy | ریسک داده همگام‌سازی |
| skill_escalate | ارجاع توسط مهارت |
| operator_manual | ارجاع دستی اپراتور |

**Rule:** Inbox list and handoff packet MUST show FA labels — never raw eng codes.

---

# 5b. Inbox surface labels (canonical FA)

| Code / eng key | Label (FA) |
|----------------|------------|
| website | وبسایت |
| telegram | تلگرام |
| bale | بله |
| shopper | مشتری |
| assistant / ai / employee | کارمند فروش |
| operator | اپراتور |
| system | سیستم |
| Handoff context package | بسته زمینه تحویل |
| Takeover | تحویل بگیر |
| Release | بازگشت به AI |

Nav / CTA: همیشه «صندوق ورودی» — نه «Inbox».

---

# 5c. Merchant-visible system data (must be FA)

API may keep eng enums internally. Anything shown to merchants in Inbox / Employee / Store MUST be Persian:

| Surface | Eng (forbidden in UI) | FA |
|---------|----------------------|-----|
| Handoff intentSummary | `blocked topic: X` | `موضوع ممنوع: X` |
| Handoff intentSummary | `refund mutation blocked…` | `درخواست استرداد وجه — مسدود توسط محدودیت سخت` |
| Handoff intentSummary | `cancel mutation blocked…` | `درخواست لغو سفارش — مسدود توسط محدودیت سخت` |
| Handoff intentSummary | `requested N% > cap M%` | `درخواست تخفیف N٪ بالاتر از سقف M٪` |
| Handoff intentSummary | `factual question while sync unhealthy` | `پرسش واقعی در حالی که همگام‌سازی ناسالم است` |
| Default blockedTopics | politics, gambling | سیاسی، قمار، شرط‌بندی |
| Sync health | healthy / stale / failed / never | سالم / عقب‌افتاده / ناموفق / هرگز |
| Order status | shipped / processing | ارسال‌شده / در حال آماده‌سازی |

اگر عبارت ممنوع را خودتان به لاتین بگذارید (مثل `bannedtopicxyz`)، همان عبارت بعد از پیشوند فارسی نشان داده می‌شود — این طبیعی است.

# 5d. Audit / decision labels (canonical FA)

API keeps eng decision/action codes. Audit UI MUST show FA labels:

| Code | Label (FA) |
|------|------------|
| answer_grounded | پاسخ از کاتالوگ |
| answer_knowledge | پاسخ از دانش |
| answer_empty_catalog | کاتالوگ خالی / بدون تطبیق |
| recommend | پیشنهاد محصول |
| order_lookup | پیگیری سفارش |
| escalated:* | ارجاع به انسان (همه) |
| guardrail_block:* | مسدود توسط محدودیت (همه) |
| employee.update | به‌روزرسانی کارمند |
| knowledge.create | ایجاد دانش |
| channel.telegram.connect | اتصال تلگرام |

Nav: «ممیزی» نه Audit. Tab: «نوبت‌های کارمند» نه «نوبت‌های AI». Skills on dashboard: «پیشنهاد محصول» / «پیگیری سفارش» — نه eng skill ids.

# 6. Shopper Widget — system copy

| Situation | Example |
|-----------|---------|
| Typing | «در حال نوشتن…» |
| Handoff | «یک همکار انسانی به گفتگو می‌پیوندد.» |
| Unsure / refuse | «الان اطلاعات مطمئنی ندارم؛ شما را به همکار انسانی وصل می‌کنم.» |
| Offline | «الان گفتگو در دسترس نیست. کمی بعد دوباره تلاش کنید.» |
| Verify order | Ask only what Runtime/Skill requires — e.g. «لطفاً شماره سفارش را وارد کنید.» |

**Employee replies** (generated): tone/language from Employee settings — still must not invent catalog facts (Runtime). Widget must not “improve” answers with local copy that adds prices.

---

# 7. Revenue / analytics honesty

- Always show methodology near revenue figures.  
- Prefer: «گفتگوهای دارای پیشنهاد محصول» over «فروش ساخته‌شده توسط AI».  
- Forbidden in-product: «+X٪ افزایش فروش با AI» without experiment proof ([PRD-020](../04-prd/revenue-dashboard.md)).

---

# 8. Microcopy checklist

- [ ] Uses Employee framing, not bot-builder  
- [ ] Failure includes next action  
- [ ] Uncertainty not decorated as success  
- [ ] Handoff language is respectful to customer and operator  
- [ ] Persian quality reviewed (not machine-placeholder)
