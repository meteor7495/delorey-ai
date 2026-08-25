# Frontend ↔ Backend Wiring

## Workspace

```
apps/workspace/src/shared/api.ts
  createApiClient({ baseUrl, getToken: localStorage seloma_token })
  → Authorization: Bearer
  → apps/api SessionAuthGuard routes
```

## Storefront

```
apps/storefront/src/lib/api.ts
  createApiClient({ baseUrl })  // no merchant token
  → /v1/storefront/:slug/...
  → cart session id in localStorage
```

## Widget

```
createApiClient + x-public-key
  → /v1/public/chat/sessions...
```

## Marketing web

```
apps/web/src/lib/api.ts raw fetch
  → /v1/public/access-requests
```

## When adding a Workspace feature that needs new data

1. Backend endpoint in the correct module
2. Method on `createApiClient`
3. Page calls `api.<method>`
4. Types either inferred or exported from api-client

Skipping step 2 creates drift — forbidden.
