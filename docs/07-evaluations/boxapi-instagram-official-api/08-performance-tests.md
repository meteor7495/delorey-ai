# 08 — Performance Tests

Measure BoxAPI Official API and webhook path. **Do not measure LLM latency** in this suite except as a controlled confounder (use echo adapter / stub Runtime).

---

## 1. Goals

| Goal | Target (initial hypothesis — calibrate after baseline) |
|------|--------------------------------------------------------|
| API p50 send | < 800 ms |
| API p95 send | < 2.5 s |
| API p99 send | < 5 s |
| Webhook delay p50 (user send → DeloRey receive) | < 2 s |
| Webhook delay p95 | < 10 s |
| Webhook delay p99 | < 30 s |
| Rate-limit queue delay at 180 req/h | < 30 s extra |
| Rate-limit queue delay when over 200/h | Document distribution; no silent drop |
| Error rate under soak | < 0.5% non-4xx |

All targets are **hypotheses** until measured.

---

## 2. Lab setup

| Component | Requirement |
|-----------|-------------|
| Environment | Staging DeloRey + BoxAPI trial page |
| Runtime | Stub that ACKs without OpenAI |
| Clock | NTP; record T0 at Instagram client if possible |
| Instrumentation | `request_id`, `account_id`, `mid`, timestamps |
| Concurrency tools | k6 / vegeta / custom worker |
| Duration | Warm-up 10 min; soak 2–24 h |

---

## 3. Metrics to capture

### Average / distribution response time (API)

| Endpoint | n | p50 | p95 | p99 | max | error% |
|----------|---|-----|-----|-----|-----|--------|
| `GET /service/info` | | | | | | |
| `GET /service/accounts` | | | | | | |
| `POST send_message` | | | | | | |
| `POST reply_comment` | | | | | | |
| `POST follow_status` | | | | | | |
| `POST list_posts` | | | | | | |
| `DELETE accounts/{id}` | | | | | | | Destructive — limited runs |

### Webhook delay

Define:

```text
delay = t_webhook_received - t_user_message_sent
```

| Scenario | n | p50 | p95 | p99 | max |
|----------|---|-----|-----|-----|-----|
| Text DM | | | | | |
| Comment create | | | | | |
| Async follow_status result | | | | | |
| Async list_posts result | | | | | |

### Media

| Operation | n | p50 | p95 | Notes |
|-----------|---|-----|-----|-------|
| Inbound media webhook delay | | | | |
| Media URL download | | | | |
| Outbound media upload/send | | | | If unsupported, mark N/A |

### Failure recovery

| Test | MTTDetect | MTTRecover | Data loss? |
|------|-----------|------------|------------|
| Kill DeloRey webhook 5 min | | | |
| BoxAPI API 5xx injection / observed outage | | | |
| Exceed rate limit 30 min | | | |

---

## 4. Test cases

### 4.1 Baseline latency

1. 100 sequential `send_message` under limit.
2. Record distribution.
3. Repeat at 3 times of day (Iran peak / off-peak).

### 4.2 Webhook delay

1. Scripted human or secondary account sends 100 DMs with paced interval.
2. Compare send timestamps vs ingest timestamps.

### 4.3 Media upload/download

1. If send image exists — 20 images 100KB / 1MB / 5MB.
2. If inbound image — download URLs from DeloRey IPs (Iran hosting nuance).

### 4.4 Failure recovery

1. Return 500 for 50 webhooks → observe retry timing.
2. Stop consumer 15 minutes → measure gap.
3. Rotate API key → measure reconnect time.

### 4.5 Large conversations

| Case | Method | Observe |
|------|--------|---------|
| 200-message thread | Manual / script | Provider history? DeloRey DB only? |
| 2,000-message local history | DeloRey Inbox load | Not provider — ensure provider doesn’t require full history pull |

### 4.6 Concurrent requests

| Pattern | Config | Pass criteria |
|---------|--------|---------------|
| Parallel sends one page | 10 workers | No duplicates beyond documented; respect 200/h |
| Parallel sends 20 pages | 1 worker each | Fairness; no global lock Unknown |
| Concurrent `/service/info` | 50 rps | Stable |

---

## 5. Rate-limit performance profile

| Load | Duration | Measure |
|------|----------|---------|
| 100 req/h | 1 h | Baseline queue delay ≈ 0 |
| 180 req/h | 2 h | Near ceiling |
| 250 req/h | 1 h | Queue delay, drops, ordering |
| 500 req/h burst 5 min then idle | | Drain behavior |

Plot: `send_accepted_at` (HTTP) vs `customer_visible_at` (if observable).

---

## 6. Reporting template

```markdown
## Run ID
Date / build / provider plan / page id

## Summary
p95 send / p95 webhook / error rate / queue delay

## Incidents
...

## Verdict
PASS / FAIL / PASS WITH LIMITS
```

---

## 7. Performance gate for Growth design approval

- [ ] p95 webhook delay measured and accepted by Product
- [ ] Over-limit behavior characterized (delay vs drop)
- [ ] No unbounded memory/queue growth on DeloRey ingress
- [ ] Concurrent multi-page test completed
- [ ] Media path characterized or waived
