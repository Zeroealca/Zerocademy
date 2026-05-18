---
name: prisma-schema-architect
description: Designs and migrates Prisma schema changes for BackendZerocademy with relations, indexes, and migration safety. Use when adding models, enums, relations, or database migrations.
---

# Prisma Schema Architect

## Prerequisites (read first)

1. [`docs/database.md`](../../../docs/database.md)
2. [`BackendZerocademy/agent.md`](../../../BackendZerocademy/agent.md) — Prisma rules (§10)
3. [`agent.md`](../../../agent.md) — profile separation (`User` vs academic profiles)

## Inputs

| Input | Required | Example |
|-------|----------|---------|
| `models` | Yes | new/changed models |
| `relations` | Yes | FK, `onDelete` |
| `enums` | If needed | `AcademicPeriodStatus` |
| `migrationName` | Yes | descriptive kebab timestamp |

## Workflow

1. Edit `BackendZerocademy/prisma/schema.prisma`:
   - PascalCase models, camelCase fields
   - `@@map` / `@map` for snake_case tables when needed
   - Explicit `onDelete` on relations
   - Indexes on FKs and filter columns
2. Create migration: `npx prisma migrate dev --name <name> -w backend-zerocademy`
3. Run `npx prisma generate -w backend-zerocademy`
4. Update seed only if required (`prisma/seed.ts`)
5. Update services/DTOs in affected modules
6. [`documentation-sync-skill`](../documentation-sync-skill/SKILL.md) — `docs/database.md`

## Design rules

- Auth on `User` only — academic data on profile tables
- Soft delete via `deletedAt` where applicable
- No business logic in schema beyond constraints/defaults
- Never edit applied migration SQL retroactively

## Expected output

- Schema + committed migration folder
- Generated client builds
- Updated docs

## Anti-patterns

- Mixing academic fields into `User`
- Missing indexes on filtered FKs
- Unbounded lists without pagination support in services
- Raw SQL migrations by hand without Prisma migrate
- `$queryRaw` with string concatenation
