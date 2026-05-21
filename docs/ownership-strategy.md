# Ownership and academic scope strategy

## Overview

Zerocademy separates **platform configuration** from **institution operations**. Authorization uses system roles on `User`, optional `institutionId` on academic profiles, and institution memberships for admins and teachers.

## Role boundaries

| Layer | Roles | Data |
|-------|-------|------|
| Platform catalog | `SUPER_ADMIN` | Institutions, levels, grades, subjects, academic periods, memberships |
| Institution operations | `ADMIN` (strict routes) | Students, courses, teacher assignments, transitions |
| Assigned scope | `TEACHER`, `STUDENT` | Own assignments / own academic records |

`SUPER_ADMIN` bypasses role lists on platform routes but **not** on `@ApiRequireRolesStrict` institution-operational endpoints.

## Academic period scope

### Global activation (one per regime)

Only one `ACTIVE` period exists per `AcademicRegime` globally. Activating a period closes all other active periods in that regime (see `AcademicPeriodsService.activate`).

### Institution active period

`Institution.activeAcademicPeriodId` points to the operational year for that school (set via transitions or explicit API).

### User-selected period

`User.selectedAcademicPeriodId` stores UI/query context for `ADMIN`, `TEACHER`, and `STUDENT`.

| Concept | Storage | Purpose |
|---------|---------|---------|
| Selected | `User.selectedAcademicPeriodId` | Manual switch in header selector |
| Effective | Resolved in `GET /academic-periods/context` | Default for lists and dashboards |
| Active per regime | `AcademicPeriod` rows | Calendar truth for activation |

**Effective period resolution:**

1. User-selected period (if accessible)
2. Institution `activeAcademicPeriodId` (when institution scope exists)
3. Global active period for institution regime
4. First available active period by regime

## Access validation

`assertActorCanAccessPeriod` enforces:

- `ADMIN` — periods for their institution (via profile or active membership)
- `TEACHER` — periods with teacher assignments or same institution
- `STUDENT` — periods for their institution (course enrollment filters — future)
- `SUPER_ADMIN` — all periods

## Query-level ownership (evolution)

| Role | Future filter |
|------|----------------|
| `TEACHER` | `teacherAssignment.teacherId = profileId` |
| `STUDENT` | Enrolled course / parallel |
| `ADMIN` | `institutionId` on domain rows |

`RoleUtils.shouldEnforceOwnership` remains true for academic roles.

## Logging

- `PERIOD_ACTIVATED`, `PERIOD_AUTO_DEACTIVATED`, `PERIOD_DEACTIVATED`
- `ACADEMIC_PERIOD_SELECTED`
- `RBAC_DENIED`, `RBAC_STRICT_DENIED` in `RolesGuard`

## Related

- [rbac.md](./rbac.md)
- [academic-periods.md](./academic-periods.md)
- [tenancy-strategy.md](./tenancy-strategy.md)
