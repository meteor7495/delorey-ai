# Seloma AI Development Framework

This directory is the **canonical AI engineering source of truth** for the Seloma repository.

It is not a second product. It does not replace Seloma architecture. It describes how AI agents must work **on top of the existing codebase**.

```
Seloma repository (source of truth)
        ↓
.ai/ (canonical AI knowledge layer)
        ↓
Cursor adapter (.cursor/)     Claude adapter (CLAUDE.md, AGENTS.md)
        ↓
AI agents
```

Do not duplicate this framework into Cursor or Claude. Adapters only point here.

## Purpose

Enable a repeatable development workflow:

```
/agent-task → discover → plan → implement → test → review
/agent-review
/agent-refactor
/agent-debug
```

## How to use

1. Read this file.
2. Classify the task (see `.ai/workflows/task.md`).
3. Load **only** the relevant rules under `.ai/rules/`.
4. Load the matching agent under `.ai/agents/`.
5. Follow the matching workflow under `.ai/workflows/`.
6. Report using the matching template under `.ai/templates/`.

Do not load the entire repository or every `.ai` file for a narrow change.

## Progressive context loading

```
Core rules (.ai/rules/core.md, .ai/rules/dont-do.md)
    ↓
Task classification
    ↓
Relevant rules (frontend / backend / api / testing / security)
    ↓
Discovery docs for that area
    ↓
Relevant modules and files
    ↓
Contracts
    ↓
Tests
```

Expand context only when the current layer is insufficient.

## Four agents

| Agent | File | Role |
|-------|------|------|
| Frontend | `.ai/agents/frontend-agent.md` | Workspace, storefront, widget, web, UI |
| Backend | `.ai/agents/backend-agent.md` | NestJS API, Prisma, Runtime, adapters |
| Review | `.ai/agents/review-agent.md` | Read-only review of diffs |
| Refactor / Debug | `.ai/agents/refactor-debug-agent.md` | Root cause, safe refactor |

## Commands

These are **conceptual commands**. Implementation differs by tool:

| Command | Canonical workflow | Cursor | Claude Code |
|---------|--------------------|--------|-------------|
| `/agent-task` | `.ai/workflows/task.md` | `.cursor/commands/agent-task.md` | Prompt prefix + `CLAUDE.md` |
| `/agent-review` | `.ai/workflows/review.md` | `.cursor/commands/agent-review.md` | Prompt prefix + `CLAUDE.md` |
| `/agent-refactor` | `.ai/workflows/refactor.md` | `.cursor/commands/agent-refactor.md` | Prompt prefix + `CLAUDE.md` |
| `/agent-debug` | `.ai/workflows/debug.md` | `.cursor/commands/agent-debug.md` | Prompt prefix + `CLAUDE.md` |

Cursor custom commands are adapters. They must not copy the full rule set.

If a tool does not support slash commands, type the command name as the first line of the prompt. Do not fake unsupported slash-command UX.

## Authority when documents conflict

```
Running code + Prisma schema + controllers + api-client
    ↓
Product Scope / Product Principles / Product Positioning
    ↓
docs/03-architecture/ARCHITECTURE.md (commerce evolution, v0.2 proposal)
    ↓
Older architecture docs (system / frontend / backend / API spec)
    ↓
This .ai/ layer
```

`.ai/` documents **what exists today**. It must be updated when a stable, reusable architectural decision lands. It must not invent a preferred stack.

Known conflicts between docs and code are recorded in `.ai/discovery/conventions.md`.

## Directory map

| Path | Contents |
|------|----------|
| `discovery/` | What the repository actually contains |
| `rules/` | Stable engineering rules for agents |
| `agents/` | Four conceptual agents |
| `workflows/` | `/agent-task`, review, refactor, debug |
| `templates/` | Required output formats |
| `contracts/` | How to find and verify API contracts |
| `examples/sample-tasks.md` | Realistic Seloma tasks |

## Continuous learning

When a recurring architectural decision is discovered during development:

```
Task → Implementation → Review → Architectural insight
    → Update a .ai rule only if broadly applicable
```

Do not add one-off implementation notes to canonical rules.

## Figma

Figma MCP tooling may be available in the agent environment. There is **no committed Figma design-system mapping** in this repository. UI source of truth in-repo is `docs/05-ui/` plus existing components.

If Figma was not inspected, say `Figma source: NOT AVAILABLE`. Never claim a Figma inspection that did not happen.

## OpenAPI / Swagger

**Not present.** There is no Swagger module and no OpenAPI YAML. Contracts are discovered from controllers, DTOs, Prisma, and `packages/api-client`.
