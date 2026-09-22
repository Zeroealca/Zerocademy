# Role-Based Access Control (RBAC)

## Overview

Each user has one **system role** on `User.role`. NestJS `JwtAuthGuard` and `RolesGuard` enforce route access. Institution memberships add institution-scoped roles for admins and teachers.

Granular permissions and ABAC remain future work.

## System roles (updated)

### SUPER_ADMIN

| Can                                                          | Cannot                                                                                              |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| Create institutions                                          | Manage institution operational data (courses, assignments, students, enrollments) via strict routes |
| Create academic levels, grades, subjects, periods            |                                                                                                     |
| Activate/deactivate periods (one active per regime globally) |                                                                                                     |
| Create all user types                                        |                                                                                                     |
| List, search, and filter users (including SUPER_ADMIN)       |                                                                                                     |
| Assign institution memberships                               |                                                                                                     |

### ADMIN

| Can                                                                      | Cannot                                              |
| ------------------------------------------------------------------------ | --------------------------------------------------- |
| Create students, enrollments, and CSV bulk import                        | Create academic levels, grade levels, or subjects   |
| Manage courses/parallels and teacher assignments                         | Create academic periods or activate global calendar |
| View academic levels, grades, and subjects (read-only catalog)           | Assign institution memberships                      |
| List, search, and filter users (except SUPER_ADMIN)                      | Manage super admins                                 |
| View and configure **only institutions with an active ADMIN membership** | Access other institutions (404)                     |
| Run institution academic transitions (membership required)               |                                                     |
| Select academic period context                                           |                                                     |
| View academic structures                                                 |                                                     |

### TEACHER

| Can                                                                 | Cannot                                  |
| ------------------------------------------------------------------- | --------------------------------------- |
| Access assigned courses/subjects for selected period                | Institution or platform configuration   |
| Select academic period context                                      | Unassigned data                         |
| View students/enrollments in assigned courses (read-only)           | Create students or manage enrollments   |
| Record and edit daily attendance for assigned course/period rosters | Record attendance outside an assignment |

### STUDENT

| Can                                        | Cannot                          |
| ------------------------------------------ | ------------------------------- |
| View own academic data for selected period | Other students or configuration |

### REPRESENTATIVE

Relationship-scoped access to students with an active `RepresentativeStudent` relationship. Representatives can view associated student profiles, grades, performance, report cards/PDFs, attendance history, and factual justification status. They can submit the existing attendance justification for an eligible associated student's absence; the backend resolves the attendance record through its enrollment/student and never trusts a client-supplied student or representative identity. They cannot record or modify attendance, review justifications, access unrelated students, or access an inactive relationship.

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

| Constant                         | Roles                                |
| -------------------------------- | ------------------------------------ |
| `PLATFORM_READ_ROLES`            | SUPER_ADMIN, ADMIN, TEACHER, STUDENT |
| `PLATFORM_CALENDAR_WRITE_ROLES`  | SUPER_ADMIN                          |
| `PLATFORM_CATALOG_WRITE_ROLES`   | SUPER_ADMIN                          |
| `INSTITUTION_OPS_WRITE_ROLES`    | ADMIN (strict)                       |
| `INSTITUTION_OPS_READ_ROLES`     | SUPER_ADMIN, ADMIN, TEACHER          |
| `STUDENT_ENROLLMENT_WRITE_ROLES` | ADMIN (strict)                       |
| `STUDENT_ENROLLMENT_READ_ROLES`  | ADMIN, TEACHER, STUDENT (strict)     |

## Academic period context API

| Method | Path                                     | Roles                   |
| ------ | ---------------------------------------- | ----------------------- |
| GET    | `/v1/academic-periods/context`           | Platform read roles     |
| PUT    | `/v1/academic-periods/context/selection` | ADMIN, TEACHER, STUDENT |

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
- Students / enrollments (institution): ADMIN write; TEACHER read (scoped); hidden from SUPER_ADMIN on strict routes
- **STUDENT** nav: `Mis matrículas` (`/my-enrollments`), `Notas` (`/grades`) only — no `/students` or `/enrollments` admin list
- **Academic Planning / AcademicUnit / LessonPlan:** TEACHER can mutate only own open-period `DRAFT` plans; ADMIN and SUPER_ADMIN have scoped read-only access; STUDENT and REPRESENTATIVE have no Academic Planning route or API access. Frontend controls are UX-only and the backend enforces this policy. LessonPlan currently has backend API coverage only; its UI is deferred.

## JWT payload

`sub`, `email`, `role`, `profileId`, `profileType`, `institutionId` — reload user from DB each request.

## Related

- [ownership-strategy.md](./ownership-strategy.md)
- [academic-periods.md](./academic-periods.md)
- [auth.md](./auth.md)
