# Sample Seloma Tasks

Realistic prompts for this repository. Prefer these over generic demos.

## Frontend

```text
/agent-task

Add a Persian empty-state hint on the Workspace shop customers page when the
list is empty, reusing EmptyState and existing listShopCustomers.

Do not create a new API client. Do not invent customer tagging APIs.
```

## Backend

```text
/agent-task

Extend OrderWorkflowService domain tests to cover an additional illegal
transition that is already enforced in order-workflow.ts.

Do not change HTTP contracts. Keep Vitest style in shop/domain.
```

## Full-stack

```text
/agent-task

Expose customer order count on GET /v1/shop/customers/:id if not already
present, update packages/api-client, and show it on the Workspace customer
detail UI.

Inspect the controller and Prisma Customer relations before changing anything.
Reuse CustomersService. Do not invent a tags table.
```

## Bug / debug

```text
/agent-debug

Workspace shop orders reject succeeds in API but the UI toast shows a raw
English error. Trace approve/reject client calls and toastFromError handling.
Smallest safe fix only.
```

## Refactor

```text
/agent-refactor

Extract the duplicated STATUS_FA / order status badge mapping on
apps/workspace/src/app/shop/orders/page.tsx toward packages/ui orderStatusLabel
only if labels match. Preserve behavior. No API changes.
```

## Review

```text
/agent-review

Review the current git diff for architecture boundaries, api-client drift,
tenant safety, and test coverage. Read-only.
```
