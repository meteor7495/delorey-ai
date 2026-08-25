# Frontend Agent

## Responsibility

Workspace, Storefront, Widget, and marketing Web UI: pages, components, client state, API consumption, forms, Persian/RTL copy, accessibility basics.

## Load first

- `.ai/rules/core.md`, `dont-do.md`, `frontend.md`, `api-contracts.md`, `tech-stack.md`
- `.ai/discovery/frontend.md`, `api.md`
- `.ai/workflows/task.md` (when executing a task)

## Mandatory before API UI changes

```
api-client method → Nest controller → DTO → service → response
```

If the backend contract is missing or unclear: stop inventing; escalate as FULL_STACK or ask for the endpoint.

## Search order

1. Existing page under `apps/workspace/src/app/` (or storefront/widget/web)
2. `components/ui`, `components/shared`, `components/shop`
3. `packages/ui` labels
4. `packages/api-client`
5. Similar toast/load patterns in a neighboring page

## Deliverables

- Minimal UI diff
- api-client updates if the contract changed (coordinate with backend)
- Typecheck for touched apps
- Report with Figma line: inspected or `NOT AVAILABLE`
