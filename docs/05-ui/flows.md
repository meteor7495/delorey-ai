# UX Flows

## Metadata

| Field | Value |
|-------|-------|
| **Version** | 0.1 |
| **Status** | Active — MVP merchant & operator flows |
| **Last Updated** | July 25, 2026 |
| **Parent** | [User Journey](../02-product/user-journey.md) · [Information Architecture](./information-architecture.md) |
| **Related** | [Workspace Screens](./workspace-screens.md) · [Widget UX](./widget-ux.md) |

**Job:** Screen-level sequencing for critical paths. PRDs own requirements; these flows own taps and branches.

---

# 1. Happy path — Signup → first live grounded chat

Target: under 24 hours on standard path; UI should feel completable in one sitting when credentials ready.

```mermaid
flowchart TD
    Signup[Signup / Login] --> Home{Home triage}
    Home --> Onb[Onboarding checklist]
    Onb --> Store[Connect store]
    Store --> Sync{Sync healthy?}
    Sync -->|No| StoreFix[Fix / retry sync]
    StoreFix --> Sync
    Sync -->|Yes| Emp[Configure Employee]
    Emp --> Ch[Connect channel]
    Ch --> Web[Website snippet] 
    Ch --> Tg[Telegram bot]
    Ch --> Bale[Bale bot]
    Web --> Test[Test conversation]
    Tg --> Test
    Bale --> Test
    Test --> Live[Go live / mark channel live]
    Live --> Monitor[Home / Inbox / Dashboard]
```

**UI rules:**

- Checklist items link to the owning screen; status comes from API (not optimistic lies).  
- Do not nudge “Go live” while sync unhealthy or zero channels connected ([PRD-006](../04-prd/ai-sales-employee.md)).  
- After first successful test, Home primary CTA shifts away from onboarding.

---

# 2. Connect Website Chat

```mermaid
flowchart TD
    Ch[Channels] --> Web[Website unit]
    Web --> Key[Show public key / snippet]
    Key --> Copy[Copy snippet]
    Copy --> Origin[Confirm allowed origin]
    Origin --> Health{Widget health check}
    Health -->|Fail CSP/domain| Diag[Diagnostics copy]
    Diag --> Origin
    Health -->|OK| Done[Connected]
    Done --> Test[Open test / Inbox]
```

---

# 3. Connect Telegram / Bale

```mermaid
flowchart TD
    Ch[Channels] --> Unit[Telegram or Bale unit]
    Unit --> Instr[Show connect instructions]
    Instr --> Token[Enter bot token / credentials]
    Token --> Save[Save encrypted via API]
    Save --> Hook{Webhook OK?}
    Hook -->|No| Err[Error + retry]
    Err --> Token
    Hook -->|Yes| Connected[Status connected]
    Connected --> Test[Send test message from messenger]
```

---

# 4. Human handoff (operator)

```mermaid
flowchart TD
    Trig[Escalation trigger in Runtime] --> Badge[Inbox badge + reason]
    Badge --> Open[Open thread]
    Open --> Pkt[Read context package]
    Pkt --> Take[Takeover]
    Take --> Reply[Reply via composer]
    Reply --> Deliver{Delivered on channel?}
    Deliver -->|No| Retry[Show delivery error]
    Deliver -->|Yes| Wait[Wait / continue]
    Wait --> Release{Return to AI?}
    Release -->|Yes| Rel[Release + audit]
    Release -->|No| Stay[Remain human_owned]
```

**UI rules:** Takeover is explicit; AI must not keep replying on `human_owned`. Release is intentional + audited ([PRD-011](../04-prd/human-handoff.md), [PRD-012](../04-prd/workspace-inbox.md)).

---

# 5. Knowledge gap → fix → verify

```mermaid
flowchart TD
    Dash[Dashboard gaps] --> Topic[Pick gap topic]
    Topic --> KB[Knowledge editor]
    KB --> Save[Save FAQ / policy + attribution]
    Save --> Idx{Index status}
    Idx -->|indexing| Wait[Show indexing]
    Idx -->|failed| Retry[Retry / keep last good]
    Idx -->|active| Test[Test in Inbox or Widget]
    Test --> Done[Gap clears over time]
```

Never pretend upload = instantly learned.

---

# 6. Sync failure recovery

```mermaid
flowchart TD
    Banner[Sync unhealthy banner] --> Store[Store screen]
    Store --> Reason[Show failure reason]
    Reason --> Act{Action}
    Act -->|Retry| Retry[Retry sync]
    Act -->|Reconnect| Recon[Reconnect credentials]
    Retry --> Health{Healthy?}
    Recon --> Health
    Health -->|No| Reason
    Health -->|Yes| Clear[Clear banner / resume go-live eligibility]
```

---

# 7. Shopper Widget session (summary)

```mermaid
flowchart TD
    Open[Open launcher] --> Sess[Create/resume session]
    Sess --> Msg[Send message]
    Msg --> Stream[Stream / show reply]
    Stream --> Branch{Outcome}
    Branch -->|Answer| Cont[Continue]
    Branch -->|Recommend| Cards[Product refs if API sends]
    Branch -->|Escalate| Human[Human joining state]
    Branch -->|Offline| Deg[Degraded message]
```

Detail: [Widget UX](./widget-ux.md).

---

# 8. Flow non-goals

- Visual workflow builder between stages  
- Multi-brand workspace switcher  
- Ticket status Kanban as primary ops flow  
- Forced CRM contact merge UI
