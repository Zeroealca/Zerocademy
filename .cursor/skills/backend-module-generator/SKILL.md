---
name: backend-module-generator
description: Scaffolds a new NestJS domain module in BackendZerocademy following modular monolith patterns. Use when creating a backend module, domain endpoint package, or adding a row to the domain registry.
---

# Backend Module Generator

## Prerequisites (read first)

1. [`agent.md`](../../../agent.md) — domain registry, naming, API contract
2. [`BackendZerocademy/agent.md`](../../../BackendZerocademy/agent.md) — layer rules
3. [`docs/backend-conventions.md`](../../../docs/backend-conventions.md)

Confirm the domain exists in the registry; update `agent.md` if adding a new domain.

## Inputs

| Input | Required | Example |
|-------|----------|---------|
| `domain` | Yes | `students` (kebab-case) |
| `resource` | Yes | plural REST name, usually same as domain |
| `rolesRead` | Yes | `SUPER_ADMIN`, `ADMIN`, `TEACHER` |
| `rolesWrite` | Yes | `SUPER_ADMIN`, `ADMIN` |
| `hasPagination` | Default true | list endpoint |
| `subResources` | No | e.g. `terms` under `academic-periods` |

## Workflow

1. Create `src/modules/<domain>/` with:
   - `<domain>.module.ts` — register in `app.module.ts`
   - `<domain>.controller.ts` — thin, Swagger on every handler
   - `<domain>.service.ts` — Prisma + business rules
   - `dto/` — `create-`, `update-`, `*-response`, `list-*-query`
   - `mappers/` — when mapping is non-trivial
   - `constants.ts` — module context string for logs
2. Apply RBAC via [`rbac-security-skill`](../rbac-security-skill/SKILL.md).
3. For CRUD shape, follow [`crud-foundation-skill`](../crud-foundation-skill/SKILL.md).
4. Run `npm run build -w backend-zerocademy`.
5. Invoke [`documentation-sync-skill`](../documentation-sync-skill/SKILL.md).

## Controller template rules

- `@ApiTags('<domain>')` on controller
- Class-wide same roles: `@Roles` + `@ApiBearerAuth` + 401/403 on **class**
- Per-route roles: `@ApiRequireRoles` on **method only** (never on class)
- `@ApiOperation` on each handler
- No Prisma in controller

## Expected output

- Registered module with documented endpoints at `/api/docs`
- Paginated list if applicable: `{ data, meta }`
- Typed DTOs with `class-validator` + `@ApiProperty`

## Anti-patterns

- Prisma in controller or guard
- Returning Prisma models from API
- Undocumented routes
- `@ApiRequireRoles` on controller class
- Sibling module deep imports
- `any` types
