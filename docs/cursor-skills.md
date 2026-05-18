# Cursor Skills Catalog

Project-scoped skills live in [`.cursor/skills/`](../.cursor/skills/). Cursor discovers `SKILL.md` files with YAML frontmatter (`name`, `description`).

## When to use skills vs agent.md

| Question | Use |
|----------|-----|
| What are our architecture rules? | `agent.md` |
| How do I scaffold a new NestJS module? | `backend-module-generator` |
| What roles can access this route? | `rbac-security-skill` + `docs/rbac.md` |
| How should I write the commit message? | `commit-message-skill` |

## Skill index

| Skill | Purpose | Typical trigger |
|-------|---------|-----------------|
| [backend-module-generator](../.cursor/skills/backend-module-generator/SKILL.md) | NestJS domain module scaffold | "Add backend module for X" |
| [frontend-feature-generator](../.cursor/skills/frontend-feature-generator/SKILL.md) | Next.js feature slice + routes | "Add frontend for X" |
| [prisma-schema-architect](../.cursor/skills/prisma-schema-architect/SKILL.md) | Schema design and migrations | "Add model / migration" |
| [rbac-security-skill](../.cursor/skills/rbac-security-skill/SKILL.md) | Guards, roles, Swagger auth | "Secure endpoint" |
| [crud-foundation-skill](../.cursor/skills/crud-foundation-skill/SKILL.md) | Standard list/create/update/delete | "CRUD for X" |
| [api-frontend-sync-skill](../.cursor/skills/api-frontend-sync-skill/SKILL.md) | Zod/types vs backend DTOs | "API changed" |
| [logging-error-handling-skill](../.cursor/skills/logging-error-handling-skill/SKILL.md) | AppLogger, HTTP exceptions | "Add logging / errors" |
| [documentation-sync-skill](../.cursor/skills/documentation-sync-skill/SKILL.md) | Update `docs/` after features | "Ship feature" |
| [commit-message-skill](../.cursor/skills/commit-message-skill/SKILL.md) | Conventional commits | User asks to commit |
| [architecture-review-skill](../.cursor/skills/architecture-review-skill/SKILL.md) | Pre-merge checklist | "Review PR / feature" |

## Feature delivery chain (example)

Academic Periods–style work:

1. `prisma-schema-architect`
2. `backend-module-generator` + `rbac-security-skill` + `logging-error-handling-skill`
3. `crud-foundation-skill` (backend)
4. `frontend-feature-generator` + `api-frontend-sync-skill` + `crud-foundation-skill` (UI)
5. `documentation-sync-skill`
6. `architecture-review-skill`

## Adding a new skill

1. Create `.cursor/skills/<kebab-name>/SKILL.md`
2. Frontmatter: `name`, `description` (third-person, includes **when** to use)
3. Sections: Prerequisites, Inputs, Workflow, Expected output, Anti-patterns
4. Link from [`.cursor/skills/README.md`](../.cursor/skills/README.md) and this file
5. Keep under ~500 lines; split if larger

## Prerequisites pattern

Every skill should start with:

```markdown
## Prerequisites (read first)
1. [`agent.md`](../agent.md) — ...
2. [`BackendZerocademy/agent.md`](../BackendZerocademy/agent.md) — ...
```

Adjust paths for frontend-only skills.

## Related

- [ai-workflow.md](./ai-workflow.md)
- [development-workflow.md](./development-workflow.md)
