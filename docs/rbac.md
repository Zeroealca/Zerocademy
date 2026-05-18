# Role-Based Access Control (RBAC)

## Overview

Zerocademy uses a **foundational RBAC** model: each user has exactly one **system role** stored on the `User` record. Authorization is enforced globally via NestJS guards and route metadata. Academic identity is separated into **profile tables** linked 1:1 to `User`.

This layer is intentionally simple. Granular permissions, ACLs, and ABAC are **out of scope** for the initial implementation.

## System roles

| Role | Purpose |
|------|---------|
| `SUPER_ADMIN` | Full platform access, global configuration, all institutions (future), admin management, audit logs |
| `ADMIN` | Institutional operations: students, teachers, academic structure, periods, reports |
| `TEACHER` | Own courses, grades, attendance — only assigned academic data |
| `STUDENT` | Read-only personal academic data |
| `REPRESENTATIVE` | Read-only access to linked students (grades, attendance, reports) |

Role metadata (capabilities and limitations) is exposed at `GET /v1/rbac/roles` for `SUPER_ADMIN` and `ADMIN`.

## Architecture

```
HTTP Request
    → JwtAuthGuard (validates JWT, loads user + profiles)
    → RolesGuard (checks @Roles / @ApiRequireRoles metadata)
    → Controller → Service
    → Prisma (ownership filters applied in domain modules — future)
```

### Code layout

| Path | Responsibility |
|------|----------------|
| `src/common/rbac/` | Role constants, utilities, profile provisioning, global `RbacModule` |
| `src/common/guards/roles.guard.ts` | Centralized role enforcement |
| `src/common/decorators/roles.decorator.ts` | `@Roles(...)` metadata |
| `src/common/decorators/api/api-require-roles.decorator.ts` | `@ApiRequireRoles` — Swagger + roles |
| `src/modules/rbac/` | Role definitions API |
| `prisma/schema.prisma` | `Role` enum, profile models |

## JWT role flow

1. User authenticates via `/v1/auth/login`.
2. Service resolves **profile linkage** (`profileId`, `profileType`, `institutionId`) from academic profile tables when applicable.
3. Access token payload includes: `sub`, `email`, `role`, `profileId`, `profileType`, `institutionId`.
4. `JwtStrategy` reloads the user from the database on each request (role changes take effect on next request after DB update).
5. `RolesGuard` compares `request.user.role` against required roles via `RoleUtils.hasRole()`.

**SUPER_ADMIN bypass:** `RoleUtils.hasRole()` grants access when the user role is `SUPER_ADMIN`, regardless of required roles on the route.

## Authorization decorators

```typescript
// Runtime enforcement + Swagger documentation
@ApiRequireRoles(Role.SUPER_ADMIN, Role.ADMIN)
@Get('users')
findAll() { ... }

// Runtime only (no Swagger role hint)
@Roles(Role.TEACHER)
@Get('my-classes')
findMyClasses() { ... }
```

Public routes use `@Public()` to skip JWT validation.

## Profile separation strategy

Authentication data lives on `User`. Academic domain data will live on profile models:

```
User (credentials + role)
 ├── StudentProfile
 ├── TeacherProfile
 └── RepresentativeProfile
```

- **ADMIN** and **SUPER_ADMIN** do not receive academic profiles.
- **STUDENT**, **TEACHER**, and **REPRESENTATIVE** profiles are provisioned automatically on user creation.
- Optional `institutionId` scopes profiles to an `Institution` (multi-tenant ready).

## Ownership strategy (prepared, not fully enforced)

Domain modules (grades, attendance, courses) will apply **query-level filtering** using:

- `AuthenticatedUser.profileId` — academic entity owner
- `AuthenticatedUser.institutionId` — tenant scope
- `RoleUtils.shouldEnforceOwnership(role)` — `true` for `TEACHER`, `STUDENT`, `REPRESENTATIVE`

Types in `src/common/rbac/ownership.types.ts` define `ResourceOwnershipContext` and `OwnershipQueryScope` for future services.

## Security decisions

- Single role per user — no implicit role escalation in JWT.
- Roles validated from database on each authenticated request (not only JWT claims).
- Generic login errors — no user enumeration.
- Administrative endpoints require explicit `@ApiRequireRoles`.
- **Super admin visibility** — only `SUPER_ADMIN` users appear in list/detail APIs for other super admins. Admins receive `404` for super admin IDs (no enumeration).
- **Role assignment** — `ADMIN` may create/update users with any role except `SUPER_ADMIN`. `SUPER_ADMIN` may assign any role.
- **Role changes** — admins may change roles via `PATCH /v1/users/:id`; profiles are re-provisioned and refresh tokens revoked on role change.

## Future scalability

| Extension | Approach |
|-----------|----------|
| Granular permissions | `PERMISSIONS_METADATA_KEY` + permission guard (not implemented) |
| Multi-role users | Join table `UserRole`; migrate enum column |
| Institution scoping | Filter queries by `institutionId` from JWT |
| Representative ↔ Student links | Join table on `RepresentativeProfile` |
| ABAC / ACL | Out of scope — evaluate when requirements mature |

## Related documentation

- [auth.md](./auth.md) — JWT flows and guards
- [database.md](./database.md) — Prisma models
- [backend-architecture.md](./backend-architecture.md) — NestJS module layout
