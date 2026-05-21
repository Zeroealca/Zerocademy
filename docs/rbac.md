# Role-Based Access Control (RBAC)

## Overview

Each user has one **system role** on `User.role`. NestJS `JwtAuthGuard` and `RolesGuard` enforce route access. Institution memberships add institution-scoped roles for admins and teachers.

Granular permissions and ABAC remain future work.

## System roles (updated)

### SUPER_ADMIN

| Can | Cannot |
|-----|--------|
| Create institutions | Manage institution operational data (courses, assignments) via strict routes |
| Create academic levels, grades, subjects, periods | |
| Activate/deactivate periods (one active per regime globally) | |
| Create all user types | |
| Assign institution memberships | |

### ADMIN

| Can | Cannot |
|-----|--------|
| Create students | Create global catalog or calendar periods |
| Manage courses/parallels and teacher assignments | Assign institution memberships |
| Run institution academic transitions | Manage super admins |
| Select academic period context | |
| View academic structures | |

### TEACHER

| Can | Cannot |
|-----|--------|
| Access assigned courses/subjects for selected period | Institution or platform configuration |
| Select academic period context | Unassigned data |

### STUDENT

| Can | Cannot |
|-----|--------|
| View own academic data for selected period | Other students or configuration |

### REPRESENTATIVE

Read-only linked students (unchanged foundation).

## Architecture

```
HTTP Request
  → JwtAuthGuard
  → RolesGuard (optional StrictRoles — no SUPER_ADMIN bypass)
  → Controller → Service
  → assertActorCanAccessPeriod / institution filters
```

### Strict routes

`@ApiRequireRolesStrict(...)` + `StrictRoles` metadata blocks implicit `SUPER_ADMIN` access. Used for:

- Courses, teacher assignments
- Institution academic transitions (execute, preview, set active period)

### Role sets (`common/rbac/rbac-role-sets.ts`)

| Constant | Roles |
|----------|-------|
| `PLATFORM_READ_ROLES` | SUPER_ADMIN, ADMIN, TEACHER, STUDENT |
| `PLATFORM_CALENDAR_WRITE_ROLES` | SUPER_ADMIN |
| `PLATFORM_CATALOG_WRITE_ROLES` | SUPER_ADMIN |
| `INSTITUTION_OPS_WRITE_ROLES` | ADMIN (strict) |
| `INSTITUTION_OPS_READ_ROLES` | SUPER_ADMIN, ADMIN, TEACHER |

## Academic period context API

| Method | Path | Roles |
|--------|------|-------|
| GET | `/v1/academic-periods/context` | Platform read roles |
| PUT | `/v1/academic-periods/context/selection` | ADMIN, TEACHER, STUDENT |

Returns `selectedPeriod`, `effectivePeriod`, and `activeByRegime`.

## User provisioning

- `ADMIN` may assign only `STUDENT` (`RoleUtils.getAssignableRoles`)
- `SUPER_ADMIN` may assign any role
- Admins receive `404` for super-admin user IDs in list/detail

## Frontend gating

`FrontendZerocademy/src/lib/permissions.ts` mirrors backend intent (cosmetic; API enforces).

- Period selector in dashboard header for ADMIN / TEACHER / STUDENT
- Academic periods admin UI: SUPER_ADMIN only
- Catalog nav (levels, grades, subjects): SUPER_ADMIN write; ADMIN/TEACHER view operations via courses

## JWT payload

`sub`, `email`, `role`, `profileId`, `profileType`, `institutionId` — reload user from DB each request.

## Related

- [ownership-strategy.md](./ownership-strategy.md)
- [academic-periods.md](./academic-periods.md)
- [auth.md](./auth.md)
