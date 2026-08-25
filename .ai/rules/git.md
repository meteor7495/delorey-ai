# Git Rules

## Default

- Do **not** commit unless the user explicitly asks
- Do **not** push unless asked
- Do **not** amend unless the user’s rules for amend are all met
- Do **not** update git config
- Do **not** force-push `main`

## When committing (user asked)

1. `git status`, `git diff`, `git log` in parallel
2. Stage only relevant files (never `.env`, secrets, upload binaries)
3. Commit message: 1–2 sentences focusing on **why**, matching repo style
4. Verify with `git status`

## Diff hygiene

- No unrelated refactors in the same commit as a feature
- No generated `dist/` noise if it is not part of the project’s commit practice (api `dist/` is often untracked build output — do not mass-add it)
- Keep `.ai/` updates in the same change set when the task is framework/learning, otherwise only when promoting a stable rule
