---
name: rbac-security-skill
description: Applies RBAC guards, role decorators, and Swagger auth documentation in BackendZerocademy. Use when securing endpoints, adding roles, or fixing authorization and ApiRequireRoles decorator issues.
---

# RBAC Security Skill

## Prerequisites (read first)

1. [`docs/rbac.md`](../../../docs/rbac.md)
2. [`BackendZerocademy/agent.md`](../../../BackendZerocademy/agent.md) — §9 Authorization
3. `src/common/rbac/` — `RoleUtils`, `RolesGuard`, `ApiRequireRoles`

## Inputs

| Input | Required | Example |
|-------|----------|---------|
| `scope` | Yes | controller class or single route |
| `roles` | Yes | `Role.ADMIN`, `Role.TEACHER` |
| `actorAware` | If mutations | pass `@CurrentUser()` to service |

## Decorator rules (critical)

| Scope | Use |
|-------|-----|
| Same roles for all routes | `@Roles(...)` + `@ApiBearerAuth` + 401/403 on **class** |
| Per-route roles | `@ApiRequireRoles(...)` on **method** + `@ApiOperation` |

**Never** `@ApiRequireRoles` on controller class — causes Swagger bootstrap crash (`descriptor.value` undefined).

## Service rules

- Guards are not enough — re-check in service for sensitive mutations
- `RoleUtils.hasRole()` — `SUPER_ADMIN` bypasses role lists
- Admin cannot see/manage `SUPER_ADMIN` users (see `users` module pattern)
- Hide existence with `404` when policy requires (not `403`)

## Workflow

1. Add `@Roles` metadata on class or method
2. Add Swagger bearer + error responses
3. Pass `AuthenticatedUser` to service when actor-scoped rules apply
4. Filter queries by ownership/institution when domain requires
5. Verify at `/api/docs` (padlock on protected routes)

## Expected output

- Enforced JWT + role checks
- Documented 401/403 in OpenAPI

## Anti-patterns

- Trusting `role` from request body
- UI-only authorization (frontend)
- `@ApiRequireRoles` on class
- Composing `@ApiOperation` into class-level `applyDecorators`
- Returning 403 when 404 is required to avoid enumeration
