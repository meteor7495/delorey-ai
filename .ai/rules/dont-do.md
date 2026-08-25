# Do Not (Anti-Vibecoding)

Agents MUST NOT:

1. Invent APIs, endpoints, schemas, or Prisma models
2. Invent database columns that are not migrated
3. Create a duplicate API client beside `createApiClient`
4. Create duplicate services for cart/orders/payments/customers
5. Bypass `SessionAuthGuard`, ValidationPipe, or domain workflow checks
6. Bypass AI Gateway and call provider SDKs from Runtime/Skills
7. Put business rules in adapters or the widget
8. Introduce Zustand / TanStack Query / Zod / RHF / new UI kits by default
9. Introduce Kafka, microservices, or new monorepo apps without an explicit task
10. Refactor unrelated files to “clean while here”
11. Rewrite working modules without evidence
12. Create mock `/v1` backends when Nest already exposes the route
13. Silently change API response contracts
14. Ignore or delete tests to make CI/local green
15. Weaken validation or security “temporarily”
16. Invent prices, SKUs, or stock
17. Claim Figma / Swagger / CI / tests were used when they were not
18. Duplicate utilities/components that already exist under `components/`, `lib/`, `packages/`, or `shop/domain`
19. Force Feature-Sliced Design onto Workspace as a drive-by
20. Treat DeloRey naming as current brand (use Seloma; keep legacy key reads only)

Core principle:

```
SEARCH → UNDERSTAND → REUSE → EXTEND → CREATE ONLY WHEN NECESSARY
```
