# Academic Planning — Phases 1A and 2A

## Status

Academic Planning Phase 1A is implemented as a backend feature. Phase 1B provides the `/academic-plans` teacher workspace and ADMIN read-only overview, using TanStack Query keys scoped by list filters and plan id. Phase 2A adds ordered Academic Units to each plan.

Teachers can create and save incomplete drafts, edit their own open-period drafts, explicitly publish after confirmation, and delete drafts. Published or closed-period plans render read-only. The editor loads assignment choices through the existing teacher-assignment endpoint and terms through the selected academic-period configuration; calendar dates retain `YYYY-MM-DD` serialization. ADMIN users can list/filter and read plan details, without mutation controls. STUDENT and REPRESENTATIVE navigation is hidden.

## Model and lifecycle

`AcademicPlan` belongs to one `TeacherAssignment` and one calendar `AcademicTerm`. The assignment is the authoritative teaching context: it provides the teacher, course, subject, academic period, and institution scope. Plans begin as `DRAFT` and may transition once through the explicit publish action to `PUBLISHED`.

Drafts may omit planning content. Publishing requires a meaningful title, start/end dates, objectives, contents, and activities. A published plan is immutable and records `publishedAt` and `publishedByUserId`.

Calendar dates are accepted as ISO `YYYY-MM-DD` values and are stored as database `DATE` values. When provided, both plan dates are required, must be ordered inclusively, and must fall within the selected academic term.

## Academic Units (Phase 2A)

An `AcademicUnit` belongs to exactly one `AcademicPlan` and stores its title, optional instructional fields, optional date range, and a backend-owned `position`. The pair `(academicPlanId, position)` is unique, so each plan has a deterministic ordered unit sequence.

Base path: `/v1/academic-plans/:planId/units`.

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/` | Scoped plan reader | List units ordered by position |
| GET | `/:id` | Scoped plan reader | Read one unit belonging to the plan |
| POST | `/` | TEACHER owner | Append a unit to a mutable draft plan |
| PATCH | `/:id` | TEACHER owner | Update editable unit fields without changing position |
| DELETE | `/:id` | TEACHER owner | Delete a unit and normalize remaining positions |
| POST | `/reorder` | TEACHER owner | Replace the complete ordered unit ID set |

Teachers may mutate only units on their own `DRAFT` plans during a non-`CLOSED` academic period. Published plans and closed periods remain readable but reject unit creation, updates, deletion, and reordering. Unit lookup is nested under the requested plan, preventing a unit from another plan from being read or mutated through its ID.

Creation calculates the next position from the current maximum; client DTOs cannot choose a position. Delete and reorder perform collision-safe two-pass updates inside a Prisma transaction, first assigning temporary positions and then the final contiguous positions. Reorder requires the submitted IDs to match the plan's complete current unit set exactly, with no duplicates, foreign units, or unknown IDs.

## API

Base path: `/v1/academic-plans`.

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/` | SUPER_ADMIN, ADMIN, TEACHER | Paginated scoped list |
| GET | `/:id` | SUPER_ADMIN, ADMIN, TEACHER | Scoped plan detail |
| POST | `/` | TEACHER | Create a draft for an owned assignment |
| PATCH | `/:id` | TEACHER owner | Update a draft; assignment is immutable |
| POST | `/:id/publish` | TEACHER owner | Validate and publish a draft |
| DELETE | `/:id` | TEACHER owner | Delete a draft |

List responses use `{ data, meta }`, with `meta: { page, limit, total, totalPages }`. Filters are `academicPeriodId`, `teacherAssignmentId`, `courseId`, `subjectId`, `academicTermId`, `status`, `startDateFrom`, `startDateTo`, and `search`.

Plan responses include the plan content and safe denormalized planning context for the teacher, course, subject, academic period, and academic term. They do not expose unrelated user or membership data.

## Authorization and history

Teachers are server-scoped to assignments whose `teacherId` matches their authenticated teacher profile. They cannot use, list, read, modify, publish, or delete another teacher's plans. ADMIN users receive read-only plans only for institutions they can access through the existing membership model. STUDENT and REPRESENTATIVE roles have no endpoint access. Existing non-strict project semantics permit SUPER_ADMIN read access; mutations remain strict TEACHER routes.

When the owning academic period is `CLOSED`, authorized users may read historical plans but create, update, publish, and delete operations are rejected.

## Database migration

`20260920100000_academic_planning_phase1` creates the `AcademicPlanStatus` enum, `academic_plans` table, foreign keys to assignments, terms, and publication/creator users, plus indexes supporting assignment/status and term filtering.

`20260920110000_academic_units_phase2` creates `academic_units`, including its parent-plan foreign key, ordered-position index, and unique `(academicPlanId, position)` constraint.

## Related

- [Teacher assignments](./teacher-assignments.md)
- [Academic periods](./academic-periods.md)
- [RBAC](./rbac.md)
