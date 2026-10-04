# Role-Based Access Control (RBAC)

## Overview

Each user has one **system role** on `User.role`. NestJS `JwtAuthGuard` and `RolesGuard` enforce route access. Institution memberships add institution-scoped roles for admins and teachers.

Granular permissions and ABAC remain future work. The approved design direction and incremental migration plan are documented in [authorization-permissions.md](./authorization-permissions.md); this document continues to describe the production RBAC behavior currently enforced.

## Permission foundation (Phases 1–2)

The backend contains a code-defined capability catalog, explicit role allowed/baseline maps, and an in-memory effective-permission resolver for migration parity tests. Phase 2 persists catalog keys and role allowed relationships as a seed-synchronized mirror. It is **not** connected to `RolesGuard`, controllers, services, JWT claims, or frontend gating. Existing RBAC remains the only production authorization mechanism; baseline permissions and runtime resolution remain code-defined. See [authorization-permissions.md](./authorization-permissions.md) for synchronization, removal safety, and deferred work.

Phase 3 adds system-owned ADMIN and TEACHER baseline profile compositions only. They are role-bounded, live, and not consulted at runtime.

Phase 4 persists an optional one-profile-per-membership assignment on `InstitutionMembership`, with domain validation against authoritative `User.role`. Assignment is not used for production authorization.

Phase 5 adds membership-aware effective permission resolution (`resolveForMembership` / `canForMembership` / `canAnyForMembership`) with live profile composition, null-profile baseline fallback, and a code-defined Role allowed ceiling. Dual evaluation (`compareMembershipResolution`) is internal/test-only. **Production endpoint authorization still uses existing RBAC only**; profile-aware results are not wired to guards.

Phase 6 adds a non-blocking ClassSession READ dual-evaluation pilot (`class_sessions.read`) that logs `MATCH` / `MISMATCH` / `NOT_APPLICABLE` / `ERROR` beside legacy decisions. Phase 7 enforces `class_sessions.read` on ClassSession list/detail after legacy allow. Phase 10 extends the same narrow, fail-closed `Legacy AND Permission` model to teacher-only ClassSession CREATE (`class_sessions.create`) and UPDATE (`class_sessions.update`) after ownership/nesting checks, while preserving period and domain validation. ADMIN and SUPER_ADMIN remain read-only; no global PermissionsGuard, JWT permission claims, or frontend permission UX was introduced.

Phase 11 formalizes `MembershipPermissionEnforcer.requireForInstitutionMembership(...)` as the reusable capability-enforcement API. It is called only with institutional context derived by the domain service after legacy authorization; it resolves active membership by actor and institution, applies profile-aware permission evaluation with null-profile baseline fallback, emits enforcement telemetry, and fails closed. It does not replace `RolesGuard`, own resource scope, or make authorization decisions from client-supplied institution input.

Phase 12 applies that foundation to `GET /v1/academic-plans/:id` only. Existing AcademicPlan detail scope remains authoritative (owner TEACHER, institution-scoped ADMIN, and existing SUPER_ADMIN behavior); `academic_planning.read` can restrict an otherwise allowed ADMIN/TEACHER read but cannot broaden ownership or institution isolation. The paginated AcademicPlan list remains unchanged because it may span multiple institutions.

Phase 13 applies the same `academic_planning.read` capability to the nested AcademicUnit list and detail routes. Both routes have one authoritative AcademicPlan parent, so membership permission resolution runs once per request rather than per returned unit. Existing parent and nested-resource isolation remains before enforcement.

Phase 14 applies `academic_planning.read` to nested LessonPlan list/detail and the one-plan aggregate LessonPlan read route. Each uses a single parent planning context and one membership capability evaluation per request; LessonPlan writes remain unchanged.

Phase 15 applies `academic_planning.create` only to AcademicPlan creation. A teacher-owned TeacherAssignment establishes authoritative institution scope, then membership capability enforcement occurs before lifecycle validation and persistence; the strict TEACHER route boundary and all other planning writes remain unchanged.

Phase 16 applies `academic_planning.update` only to ordinary AcademicPlan editing at `PATCH /v1/academic-plans/:id`. The loaded plan's TeacherAssignment supplies authoritative institution scope after owner-TEACHER authorization. Publication remains a separate operation with its distinct catalog permission and is not changed.

Phase 17 applies the distinct `academic_planning.publish` capability to `POST /v1/academic-plans/:id/publish`. It reuses the loaded plan's TeacherAssignment institution after legacy owner authorization and before publication lifecycle/completeness validation; it does not use the ordinary update capability.

Phase 18 applies `academic_planning.delete` to owner-TEACHER `DELETE /v1/academic-plans/:id`. It uses the loaded plan's TeacherAssignment institution before existing DRAFT/period validation and hard deletion; database cascades own AcademicUnit/LessonPlan removal and set linked ClassSession lesson references null.

Phase 19 applies aggregate `academic_planning.create` to owner-TEACHER `POST /v1/academic-plans/:planId/units`. The loaded parent plan supplies the authoritative TeacherAssignment institution before existing date validation and transactional position assignment.

Phase 20 applies aggregate `academic_planning.update` to owner-TEACHER nested AcademicUnit PATCH. Parent scope and Unit nesting are confirmed before one capability evaluation; Unit reorder remains a separate operation.

Phases 21 and 22 complete the AcademicUnit authorization migration. Owner-TEACHER DELETE requires `academic_planning.delete` after parent and nested-Unit isolation and before its delete/position-compaction transaction. Parent-scoped REORDER requires `academic_planning.update` once per request before duplicate/exact-set validation and the existing temporary/final-position transaction; it never evaluates membership once per Unit. Both preserve DRAFT-only, PUBLISHED read-only, CLOSED restriction, null-profile fallback, and fail-closed permission enforcement. ARCHIVED period mutability remains the existing `ARCHIVED Academic Planning Mutation Policy` debt.

Phase 23 migrates ordinary LessonPlan CREATE and UPDATE using the aggregate Academic Planning capabilities. CREATE requires `academic_planning.create` after owner-TEACHER Unit/Plan scope and before domain validation or transactional persistence. UPDATE confirms parent and nested LessonPlan isolation, then requires `academic_planning.update` before mutable-field/date validation and persistence. Both use one membership evaluation from the Unit's authoritative TeacherAssignment institution; null-profile fallback and fail-closed semantics remain unchanged. LessonPlan DELETE and REORDER remain legacy-only pending their separate destructive and bulk-operation phases.

Phase 24 migrates LessonPlan DELETE with `academic_planning.delete`. Existing owner-TEACHER scope and nested LessonPlan isolation remain authoritative before one capability evaluation; only then does the hard-delete/sibling-position-compaction transaction begin. Missing membership or resolver errors fail closed before destructive work. The database continues to set dependent `ClassSession.lessonPlanId` values null.

Phase 25 completes LessonPlan mutation enforcement: parent-scoped REORDER requires one `academic_planning.update` evaluation after the authoritative Unit/Plan/Assignment context has confirmed legacy owner-TEACHER scope and lifecycle mutability, and before duplicate/exact-set validation or the existing temporary/final-position transaction. It never performs membership resolution per LessonPlan. The complete ordered `lessonPlanIds` set remains domain-validated within the transaction; restrictive profiles, missing memberships, and resolver failures fail closed before writes, while null-profile memberships retain the TEACHER baseline. Academic Planning individual-resource authorization is complete; the global/paginated AcademicPlan list remains deferred collection authorization, and ARCHIVED-period mutability remains policy debt.

## System roles (updated)

### SUPER_ADMIN

| Can                                                          | Cannot                                                                                              |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| Create institutions                                          | Manage institution operational data (courses, assignments, students, enrollments) via strict routes |
| Create academic levels, sublevels, grades, subjects, periods |                                                                                                     |
| Activate/deactivate periods (one active per regime globally) |                                                                                                     |
| Create all user types                                        |                                                                                                     |
| List, search, and filter users (including SUPER_ADMIN)       |                                                                                                     |
| Assign institution memberships                               |                                                                                                     |

### ADMIN

| Can                                                                      | Cannot                                              |
| ------------------------------------------------------------------------ | --------------------------------------------------- |
| Create students, enrollments, and CSV bulk import                        | Create academic levels, sublevels, grade levels, or subjects   |
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
- Catalog nav (levels, sublevels, grades, subjects): SUPER_ADMIN write; ADMIN/TEACHER view operations via courses
- Students / enrollments (institution): ADMIN write; TEACHER read (scoped); hidden from SUPER_ADMIN on strict routes
- **STUDENT** nav: `Mis matrículas` (`/my-enrollments`), `Notas` (`/grades`) only — no `/students` or `/enrollments` admin list
- **Academic Planning / AcademicUnit / LessonPlan:** TEACHER can mutate only own open-period `DRAFT` plans; ADMIN and SUPER_ADMIN have scoped read-only access; STUDENT and REPRESENTATIVE have no Academic Planning route or API access. Frontend controls are UX-only and the backend enforces this policy. LessonPlans render within their parent units, with mutation controls limited to the mutable teacher context.

## JWT payload

`sub`, `email`, `role`, `profileId`, `profileType`, `institutionId` — reload user from DB each request.

## Related

- [ownership-strategy.md](./ownership-strategy.md)
- [academic-periods.md](./academic-periods.md)
- [auth.md](./auth.md)
