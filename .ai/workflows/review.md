# Workflow: /agent-review

1. Load review agent + core/security/api/testing/architecture rules.
2. Inspect git diff (or provided patch).
3. Inspect changed files and trace dependencies (api-client ↔ controller ↔ service).
4. Check architecture, contracts, validation, tests, security, performance, scope.
5. Emit findings + verdict.
6. Do not edit unless explicitly asked.

Output: `.ai/templates/review.md`.
