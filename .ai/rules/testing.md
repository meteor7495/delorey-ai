# Testing Rules

## Use Seloma’s tools

- Backend: Vitest, files named `*.spec.ts` next to code or under `domain/`
- Typecheck: `tsc -p tsconfig.json --noEmit`
- Lint: currently stub — report honestly
- No frontend test runner yet — do not fake coverage

## Before adding tests

Find an existing neighboring spec and match its style.

## Minimum expectations

| Change | Tests |
|--------|-------|
| Domain invariant | Unit spec in `shop/domain` or billing domain |
| Service rule with pure logic | Unit with mocks only where needed |
| API-only wiring | Prefer typecheck + focused unit if logic is non-trivial |
| Bug fix | Regression test when feasible |

## Forbidden

- Deleting or skipping tests to greenwash
- Claiming E2E / AI eval / isolation suites ran when they did not
- Introducing a second test framework

## Reporting

Use `PASS` / `FAIL` / `NOT RUN` with command names in the task template.
