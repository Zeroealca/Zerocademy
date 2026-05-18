---
name: crud-foundation-skill
description: Implements standard CRUD patterns for NestJS services and Next.js list/form UIs. Use when building list, create, update, delete flows, pagination, or resource management screens.
---

# CRUD Foundation Skill

## Prerequisites (read first)

1. [`BackendZerocademy/agent.md`](../../../BackendZerocademy/agent.md) — API response standards
2. [`FrontendZerocademy/agent.md`](../../../FrontendZerocademy/agent.md)
3. Reference: `modules/users`, `modules/academic-periods`, `features/users`, `features/academic-periods`

## Backend pattern

| Operation | Route | Response |
|-----------|-------|----------|
| List | `GET /resource` | `{ data: T[], meta: { total, page, limit } }` |
| Get | `GET /resource/:id` | single DTO |
| Create | `POST /resource` | 201 + DTO |
| Update | `PATCH /resource/:id` | DTO |
| Delete | `DELETE /resource/:id` | 204 or soft-delete DTO |

- List DTO: `page`, `limit`, `search`, `sortBy`, `sortOrder`
- Map Prisma → response DTO in service or mapper
- `NotFoundException` for missing ids
- Transactions for multi-table writes (`prisma.$transaction`)

## Frontend pattern

- List page: table/cards + loading/error/empty + pagination
- Detail: `useQuery` with id from params
- Create/Edit: React Hook Form + Zod + mutation + toast (Spanish)
- Invalidate query keys on success (`*.keys.ts`)
- Delete: confirm dialog (Spanish)

## Workflow

1. Define response DTOs and list query DTO (backend)
2. Implement service methods with logging ([`logging-error-handling-skill`](../logging-error-handling-skill/SKILL.md))
3. Wire controller with Swagger per handler
4. Mirror types in Zod schemas ([`api-frontend-sync-skill`](../api-frontend-sync-skill/SKILL.md))
5. Build list + form components

## Anti-patterns

- Returning raw Prisma entities
- Unpaginated large lists
- Missing empty states
- Optimistic updates without rollback strategy
- Duplicate validation rules only on frontend
