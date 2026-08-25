# API Contract Rules

## Never invent contracts

Do not invent endpoints, request bodies, or response shapes. Discover them.

## Discovery checklist

1. `packages/api-client/src/index.ts`
2. Nest `@Controller` + method decorators
3. DTO `class-validator` fields
4. Service return value / Prisma select
5. Existing frontend usage

OpenAPI: **not available**. Do not claim to have read a Swagger file.

## Changing contracts

| Change | Required |
|--------|----------|
| New merchant endpoint | Controller + service + **api-client method** + caller |
| New storefront endpoint | Controller + **api-client** + storefront page |
| Field rename/remove | Update client types and all callers; note breaking change |
| Widget public API | Keep surface restricted; public-key auth |

Silently changing a response shape used by Workspace/Storefront is a defect.

## Error handling

- Backend: Nest HTTP exceptions + validation errors
- Client: throws `Error` with status + body text
- UI: `toastFromError` / Persian merchant-safe messages

Do not invent a parallel error framework.

## Versioning

Stay on `/v1`. Additive fields are preferred over breaking changes.

## Verification for FULL_STACK tasks

Trace one happy path end-to-end in the plan:

`UI → api-client method → controller → service → DB field`
