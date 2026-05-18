---
name: api-frontend-sync-skill
description: Aligns frontend Zod schemas and TypeScript types with backend DTOs and OpenAPI. Use when API contracts change, adding fields, or fixing type mismatches between backend and frontend.
---

# API Frontend Sync Skill

## Prerequisites (read first)

1. [`agent.md`](../../../agent.md) — API contract section
2. Backend DTOs in `src/modules/<domain>/dto/`
3. Swagger at `/api/docs` (when backend running)

## Inputs

| Input | Required |
|-------|----------|
| `domain` | Yes |
| `endpoints` | Changed routes |
| `dtoFiles` | Backend source of truth |

## Workflow

1. Read backend `*-response.dto.ts`, `create-*.dto.ts`, `list-*-query.dto.ts`
2. Update `features/<domain>/types.ts` — mirror enums and field names
3. Update `schemas/<domain>.schema.ts`:
   - Match required/optional fields
   - Use `z.nativeEnum` or `z.enum` for backend enums
   - Spanish messages for validation errors
   - Prefer `z.number()` over `z.coerce.number()` when API sends JSON numbers
4. Update `api/<domain>.api.ts` — paths, query params, body shapes
5. Update hooks if response shape changed
6. Run `npm run build -w frontend-zerocademy`

## Contract rules

- Backend DTOs are source of truth
- Dates: ISO strings in API; `z.coerce.date()` or string + format on UI
- Pagination: same `page`/`limit` names as backend
- Role enums must include all Prisma `Role` values used in forms

## Expected output

- Build passes
- Forms submit payloads backend accepts
- List filters match query DTO

## Anti-patterns

- Inventing fields not in API
- `any` on API responses
- Drift between `types.ts` and Zod schema
- English validation messages on user-facing forms
