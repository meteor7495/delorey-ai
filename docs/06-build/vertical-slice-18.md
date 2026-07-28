# Vertical Slice 18 — Website Chat Harden (embed + origins + handoff UI)

## Metadata

| Field | Value |
|-------|-------|
| **Version** | 0.1 |
| **Status** | Done |
| **Last Updated** | July 28, 2026 |
| **Depends on** | Website adapter · Widget embed · [PRD-013](../04-prd/website-chat.md) |
| **UX** | [Widget UX](../05-ui/widget-ux.md) |

**Goal:** Production-usable install path: correct snippet (`data-api-base`), merchant origin allowlist in Workspace, CORS that allows HTTPS storefronts while `assertOrigin` enforces the allowlist, session resume in the widget, and clear handoff UI when AI escalates.

---

# Checklist

- [x] Snippet uses `WIDGET_EMBED_BASE_URL` + `data-api-base` (`PUBLIC_API_BASE_URL`)  
- [x] `PUT /v1/channels/website/origins` + Channels UI textarea  
- [x] Re-provision no longer wipes `allowedOrigins`  
- [x] CORS: allow HTTPS storefront origins; tenant gate remains `assertOrigin`  
- [x] Production: require `Origin` when allowlist non-empty  
- [x] Light in-process rate limit on public session/message  
- [x] Widget: localStorage session resume; handoff banner; friendlier 403/404 copy  
- [x] Esc closes panel; mobile full-bleed already present  

---

# Out of this slice

CDN publish / versioned asset pipeline · token streaming · brand color from merchant settings · public message history fetch · Redis rate limiter · focus trap library polish.

---

# Local smoke

1. Workspace → کانال‌ها → copy snippet (should include `data-api-base`).  
2. Add `http://localhost:5173` (and your test store origin) to دامنه‌های مجاز → ذخیره.  
3. Open harness or paste snippet into a local HTML page → open launcher → ask product Q.  
4. Trigger human handoff (e.g. ask for اپراتور) → banner «همکار انسانی» appears.  
5. Reload page → same conversation resumes from localStorage.  
6. Wrong origin (prod) → calm Persian error, no spam loop.
