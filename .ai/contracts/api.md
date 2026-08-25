# API Contract Discovery

## Procedure

```
Task involves HTTP?
  → Search createApiClient methods
  → Grep @Controller / @Get/@Post in apps/api
  → Read DTO class-validator fields
  → Read service method
  → Confirm Prisma model fields
  → Implement UI or extend client last
```

## If missing

| Situation | Action |
|-----------|--------|
| Client method missing, controller exists | Add method to api-client matching controller |
| Controller missing | Backend change first; do not fake fetch URLs |
| Spec doc disagrees with code | Prefer code; note conflict |
| Cannot verify shape | Stop; report missing contract |

## Do not

- Generate fictional Swagger
- Copy paths from outdated `api-specification.md` without checking controllers
- Add a second client
