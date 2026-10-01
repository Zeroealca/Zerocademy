# Zerocademy architecture

## Monorepo

| App | Path                  | Role                                     |
| --- | --------------------- | ---------------------------------------- |
| API | `BackendZerocademy/`  | Business rules, auth, persistence        |
| UI  | `FrontendZerocademy/` | Presentation, client validation, caching |

Package manager: **npm workspaces** (root `package.json`).

## Domain registry

Canonical domains (from root `agent.md`):

| Domain                            | Backend module         | Frontend feature                       |
| --------------------------------- | ---------------------- | -------------------------------------- |
| Auth                              | `auth`                 | `auth`                                 |
| Users                             | `users`                | `users`                                |
| Academic periods                  | `academic-periods`     | `academic-periods`                     |
| Subjects                          | `subjects`             | `subjects`                             |
| Teacher assignments               | `teacher-assignments`  | `teacher-assignments`                  |
| Academic execution                | `academic-execution`   | `academic-execution`                   |
| Institutions                      | `institutions`         | `institutions`, `institution-settings` |
| Academic evaluation               | `academic-evaluation`  | `academic-evaluation`                  |
| Grades                            | `grades`               | `grades`                               |
| Academic performance              | `academic-performance` | `academic-performance`                 |
| Students, Teachers, Attendance, … | Partial / planned      | Partial / planned                      |

**Implemented:** Auth, Users, RBAC, Institutions, Academic periods, Academic structure (levels, grades, courses), Subjects, Teacher assignments, Academic Planning backend (AcademicPlan, AcademicUnit, and LessonPlan), the AcademicPlan/AcademicUnit/LessonPlan frontend workspace, the Academic Execution ClassSession backend/API contract and execution workspace, and Dashboard shell.

## Boundaries

Academic Planning and Academic Execution remain separate graphs:

```text
Planning:  TeacherAssignment → AcademicPlan → AcademicUnit → LessonPlan
Execution: TeacherAssignment → ClassSession → optional LessonPlan reference
```

`ClassSession` represents an actual teaching occurrence; it is not an AttendanceRecord. Attendance remains enrollment/date-owned until a future session/subject attendance design explicitly integrates it.

## Authorization and permissions architecture

The role-bounded permissions architecture has a Phases 1–2 foundation: code-defined catalog and role allowed/baseline maps, a read-only effective-permission resolver, and a seed-synchronized persistence mirror for catalog and role boundaries. It is not enforced and does not alter current RBAC. The proposed model separates a code-controlled role catalog, permission profiles/effective permissions, resource scope, and domain/lifecycle rules. See [authorization-permissions.md](./authorization-permissions.md) for the decision, current-state inventory, parity matrix, persistence model, and staged migration plan.

Phase 3 adds system-owned, live ADMIN and TEACHER permission profile compositions as persistence-only infrastructure. Phase 4 adds optional `InstitutionMembership` → `PermissionProfile` assignment persistence and domain validation (compatibility via `User.role`), still without profile-aware authorization. Phase 5 adds membership-aware effective permission resolution with live profile composition and null-profile baseline fallback, still without endpoint enforcement. Phase 6 adds a non-blocking ClassSession READ dual-evaluation pilot that observes profile-aware capability beside legacy RBAC without changing allow/deny. Phase 7 enforces `class_sessions.read` on ClassSession list/detail. Phase 10 extends the same fail-closed `Legacy AND Permission` pattern to teacher-owned ClassSession CREATE (`class_sessions.create`) and UPDATE (`class_sessions.update`) after resource ownership/nesting and before lifecycle/domain validation; it adds no global PermissionsGuard. Global `User.role` remains a known multi-institution limitation tracked in DEMY-126.

Phase 11 formalizes the existing RBAC-side `MembershipPermissionEnforcer` as the reusable membership capability foundation. Its service-level API is intentionally called after each domain's legacy resource authorization and receives authoritative institution context from that domain resource. This avoids a global/decorator permission guard duplicating resource queries or trusting client input; it keeps capability evaluation separate from resource scope and lifecycle rules. ClassSession READ/CREATE/UPDATE are the only consumers migrated in this phase.

Phase 12 adds AcademicPlan detail as the next service-level consumer: `GET /v1/academic-plans/:id` applies `academic_planning.read` after legacy scope using the plan's loaded TeacherAssignment institution. The multi-institution paginated list is intentionally deferred to avoid per-row membership-resolution queries.

Phase 13 extends that planning-aggregate capability to nested AcademicUnit list/detail requests. The parent AcademicPlan supplies one authoritative TeacherAssignment institution, enabling a single service-level enforcement evaluation per request with no per-unit N+1 behavior.

Phase 14 extends the same aggregate capability to nested and single-plan aggregate LessonPlan reads. Their parent Unit/Plan chains supply the institution context once; write paths remain outside permission enforcement.

Phase 15 adds the planning create capability at the service boundary. AcademicPlan creation resolves its owned TeacherAssignment first, then requires `academic_planning.create` against that assignment's institution before domain lifecycle checks or writes. This keeps resource scope, capability policy, and lifecycle validation in their respective layers.

Phase 16 uses the corresponding existing-plan context for ordinary AcademicPlan edits: after legacy owner authorization, the already-loaded plan's TeacherAssignment institution is passed to `academic_planning.update` enforcement before draft/lifecycle validation and persistence. The separate publish operation is intentionally outside this migration.

Phase 17 migrates that separate publish operation using `academic_planning.publish`. The same already-loaded resource context is evaluated after owner isolation and before DRAFT, period, completeness, term/date, and publish-mutation rules, keeping the UPDATE and PUBLISH capabilities separate.

Phase 18 completes the current AcademicPlan write surface with `academic_planning.delete`. Its enforcement reuses the loaded plan and TeacherAssignment context after owner isolation, before lifecycle validation and the existing hard-delete call. Persistence relationship cascades remain schema-owned rather than application-managed.

Phase 19 extends aggregate create capability to AcademicUnit creation. Parent-plan ownership and context are resolved once, then `academic_planning.create` is evaluated before the existing Unit date validation and transaction-scoped sibling-position allocation.

Phase 20 applies `academic_planning.update` after AcademicUnit parent/nesting isolation and before direct Unit persistence. This leaves the multi-row reorder transaction outside ordinary field-update authorization.

Phases 21–22 complete AcademicUnit capability migration: DELETE applies `academic_planning.delete` once after parent/nested isolation and before the hard-delete plus sibling-compaction transaction; parent-scoped REORDER applies `academic_planning.update` once before exact-set validation and its temporary/final-position transaction. The parent `AcademicPlan → TeacherAssignment → institutionId` remains the sole permission context, preventing per-Unit membership-resolution queries. Lifecycle remains DRAFT mutable, PUBLISHED read-only, CLOSED restricted, with ARCHIVED mutability intentionally deferred.

Phase 23 applies the same service-level model to LessonPlan's ordinary writes. CREATE reuses the loaded `AcademicUnit → AcademicPlan → TeacherAssignment → institutionId` context for one `academic_planning.create` evaluation before date validation and its position-allocation transaction. UPDATE verifies nested LessonPlan membership first, then uses that same context for one `academic_planning.update` evaluation before direct persistence. Capability remains separate from resource scope and lifecycle; DELETE and REORDER are intentionally outside this slice.

Phase 24 applies `academic_planning.delete` to LessonPlan hard deletion. Unit/Plan/Assignment context and nested LessonPlan isolation are resolved before one capability evaluation, outside the existing delete/temporary-position/final-position compaction transaction. Prisma retains the dependent reference semantics: ClassSessions are not deleted and their optional LessonPlan references become null. REORDER remains outside this slice.

For the execution create flow, Planning also exposes the narrow read projection `GET /v1/academic-plans/:planId/lesson-plans`. It is scoped through the AcademicPlan and its TeacherAssignment, applies the existing Planning read authorization, and returns LessonPlans in AcademicUnit/LessonPlan pedagogical order with parent-unit label metadata. It avoids client-side per-unit LessonPlan loading; Unit-scoped LessonPlan CRUD remains unchanged.

| Concern                   | Owner                     |
| ------------------------- | ------------------------- |
| JWT issuance / validation | Backend                   |
| Password hashing          | Backend                   |
| Role enforcement          | Backend                   |
| Permission UI gating      | Frontend (cosmetic)       |
| Rendering / routing       | Frontend                  |
| Server state cache        | Frontend (TanStack Query) |

## API contract

- Prefix: `/v1`
- Lists: `{ data: T[], meta: { page, limit, total, totalPages } }`
- Errors: `{ statusCode, message, error, details? }`
- OpenAPI: `http://localhost:3001/api/docs`

## Infrastructure (development)

Docker Compose: `postgres`, `pgadmin`, `backend` (:3001), `frontend` (:3000).

```bash
cp .env.example .env
npm run docker:up
```

## Documentation index

- [ai-workflow.md](./ai-workflow.md)
- [cursor-skills.md](./cursor-skills.md)
- [development-workflow.md](./development-workflow.md)
- [backend-architecture.md](./backend-architecture.md)
- [frontend-architecture.md](./frontend-architecture.md)
- [auth.md](./auth.md)
- [authorization-permissions.md](./authorization-permissions.md)
- [users.md](./users.md)
- [database.md](./database.md)
- [api-flow.md](./api-flow.md)
- [institutions.md](./institutions.md)
- [tenancy-strategy.md](./tenancy-strategy.md)
- [academic-structure.md](./academic-structure.md)
- [academic-periods.md](./academic-periods.md)
- [academic-evaluation.md](./academic-evaluation.md)
- [grades.md](./grades.md)
- [assessments.md](./assessments.md)
- [grading-workflow.md](./grading-workflow.md)
- [grade-calculation-engine.md](./grade-calculation-engine.md)
- [report-cards.md](./report-cards.md)
- [attendance.md](./attendance.md)
- [academic-periods-frontend.md](./academic-periods-frontend.md)
- [subjects.md](./subjects.md)
- [teacher-assignments.md](./teacher-assignments.md)
- [academic-planning.md](./academic-planning.md)
- [curriculum.md](./curriculum.md)
- [seeds.md](./seeds.md)
- [ui-guidelines.md](./ui-guidelines.md)
- [backend-conventions.md](./backend-conventions.md)
- [frontend-conventions.md](./frontend-conventions.md)

## AI guidance

| Layer                       | Location                                                                                                                         |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Architecture & global rules | `agent.md`, `BackendZerocademy/agent.md`, `FrontendZerocademy/agent.md`                                                          |
| Implementation workflows    | `.cursor/skills/*/SKILL.md`                                                                                                      |
| Workflow docs               | [ai-workflow.md](./ai-workflow.md), [cursor-skills.md](./cursor-skills.md), [development-workflow.md](./development-workflow.md) |

Agents read **agent files** for principles and **skills** for scaffolding, CRUD, RBAC, docs sync, and reviews.

## Agent guides

Authoritative layer rules (concise — no duplicated workflows):

- Root: `agent.md`
- Backend: `BackendZerocademy/agent.md`
- Frontend: `FrontendZerocademy/agent.md`
