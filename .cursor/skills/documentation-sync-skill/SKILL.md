---
name: documentation-sync-skill
description: Updates Zerocademy docs after feature or schema changes. Use when shipping a module, RBAC change, or API contract change that needs documentation.
---

# Documentation Sync Skill

## Prerequisites (read first)

1. [`docs/architecture.md`](../../../docs/architecture.md)
2. [`agent.md`](../../../agent.md) — domain registry

## When to update

| Change | Update |
|--------|--------|
| New domain module | `agent.md` registry, `docs/architecture.md`, domain doc if substantial |
| RBAC | `docs/rbac.md` |
| Schema | `docs/database.md` |
| Feature behavior | `docs/<feature>.md` or create new |
| AI/skills | `docs/cursor-skills.md`, `docs/ai-workflow.md` |

## Workflow

1. List files touched by the feature
2. Update registry table in root `agent.md` if new bounded context
3. Add or extend `docs/<topic>.md` with: purpose, models, endpoints, roles, frontend routes
4. Cross-link from `docs/architecture.md` if structural
5. Keep professional English in all docs
6. Do not create markdown the user did not ask for unless this skill is invoked as part of a feature delivery

## Expected output

- Docs reflect current API and roles
- No stale endpoint lists

## Anti-patterns

- Docs only in code comments
- Duplicating full agent.md content in docs
- Outdated role matrices
