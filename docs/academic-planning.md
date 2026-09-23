# Academic Planning — Phases 1A, 2A, and 2B

## Status

Academic Planning Phase 1A is implemented as a backend feature. Phase 1B provides the `/academic-plans` teacher workspace and ADMIN read-only overview, using TanStack Query keys scoped by list filters and plan id. Phase 2A is implemented end-to-end and adds ordered Academic Units to each plan. **Phase 2B — LessonPlan is technically complete**: persistence, nested API, authorization, ordering, typed frontend integration, and the Unit-nested UI have passed final verification.

### Phase 2C status — Teaching Session Foundation (in progress)

**Phase 2C is the Teaching Session Foundation.** It introduces the domain primitive for a real teaching occurrence: a `ClassSession` owned by a `TeacherAssignment`. It is the next phase because Attendance explicitly defers subject/session attendance until a timetable/session domain exists, while the completed LessonPlan feature deliberately remains planning-only. The phase is an **Academic Execution** capability adjacent to Planning; it is not a new pedagogical child in the `AcademicPlan → AcademicUnit → LessonPlan` tree.

**Phase 2C.1 and 2C.2 are technically complete.** Phase 2C.2 exposes the assignment-scoped backend API at `/v1/teacher-assignments/:teacherAssignmentId/class-sessions`; Phase 2C remains in progress pending contract hardening and frontend phases.

The relationship is intentionally asymmetric:

```text
TeacherAssignment (teaching context and execution owner)
├── AcademicPlan → AcademicUnit → LessonPlan (pedagogical intent)
└── ClassSession (actual teaching occurrence; Phase 2C)
    └── optional LessonPlan reference (what the teacher intended to teach)

Enrollment → AttendanceRecord (current daily, course-level history)
                         └── future session/subject attendance may use ClassSession
```

`TeacherAssignment` is the natural owner because it already establishes the teacher, subject, course, academic period, and institution context for both planning and a real class occurrence. A `ClassSession` must not be owned by `AcademicPlan`, `AcademicUnit`, or `LessonPlan`: a plan may never be taught, a lesson can be taught on another date, one plan can inform more than one occurrence, and an occurrence can be held without a formal lesson plan. Its optional LessonPlan reference must be validated through the shared assignment context, rather than duplicating that context on the session.

This decision does not make a session an AttendanceRecord and does not change the existing daily attendance contract. Current attendance remains enrollment-owned and unique per enrollment/calendar date. A later attendance evolution can introduce session/subject attendance only after it defines its own historical-record and uniqueness migration path; Phase 2C merely provides the missing execution primitive.

#### Scope and boundaries

| Candidate | Decision | Rationale |
| --- | --- | --- |
| Teaching-session / class-execution layer | **Phase 2C — next** | It provides the actual-occurrence primitive deferred by Attendance and keeps execution separate from pedagogical planning. |
| LessonPlan enhancements | Later | Timetable, completion tracking, grades, assessments, attachments, AI, notifications, and export are not session ownership and remain LessonPlan non-goals. |
| Curriculum versioning / standards | Independent foundational work | The current curriculum catalog is global, grade/subject-oriented, and period-independent. Versioning belongs to configurable curriculum/catalog governance, not to a teacher assignment or a lesson/session. |

`ClassSession` has its own operational lifecycle: `SCHEDULED`, `COMPLETED`, or `CANCELLED`. It never inherits `AcademicPlan`'s `DRAFT`/`PUBLISHED` lifecycle. The academic period remains the governing historical boundary: new execution writes are rejected when its period is `CLOSED` or `ARCHIVED`, while authorized historical reads remain available through the Phase 2C.2 API.

Dates retain distinct semantics. `LessonPlan.lessonDate` is a planned pedagogical **calendar date** (`YYYY-MM-DD`), not evidence that class occurred. `ClassSession.scheduledDate` and `ClassSession.occurredOn` are independent optional PostgreSQL `DATE` values, normalized from `YYYY-MM-DD` at UTC midnight by the foundation service; neither is a timezone-bearing timestamp. `SCHEDULED` and `CANCELLED` sessions require `scheduledDate`; `COMPLETED` sessions require `occurredOn`. Each supplied date must fall within the assignment's academic period. Start/end times, recurrence, room, and timetable-slot semantics are intentionally deferred until scheduling is separately designed.

Authorization follows the existing ownership direction: an owning `TEACHER` may create and manage sessions only for that teacher's assignment in an open period; `ADMIN` and `SUPER_ADMIN` have scoped operational/history reads unless a later execution policy explicitly grants a mutation; `STUDENT` and `REPRESENTATIVE` receive no direct Phase 2C access. Student and representative access to their existing attendance history is unchanged.

#### Phase 2C roadmap

- **2C.1 — Domain and persistence foundation (technically complete):** `ClassSession` persistence, additive migration, operational status, assignment ownership, optional scoped LessonPlan reference, date semantics, and focused invariant tests are complete.
- **2C.2 — Backend behavior and API (technically complete):** assignment-scoped list, detail, create, and update endpoints enforce ownership, staff read scope, period mutability, parent-reference compatibility, and final-state lifecycle validation. DELETE is intentionally deferred because physical deletion of historical execution records is not approved.
- **2C.3 — Backend contract hardening:** add focused service/controller tests for IDOR, lifecycle transitions, date semantics, optional LessonPlan linkage, and audit logging.
- **2C.4 — Frontend contracts and data access:** add typed session API contracts and assignment-scoped TanStack Query integration without reusing LessonPlan mutations.
- **2C.5 — Execution workspace UI:** provide teacher session creation/management and authorized read-only staff views with Spanish UI, states, and lifecycle-aware controls.
- **2C.6 — Verification and closure:** run focused backend/frontend checks, validate documentation and authorization, and record the operational boundary with Attendance.

**Phase 2C.1 implementation scope:** create only the execution-domain persistence and invariant foundation for `ClassSession`; establish its assignment ownership, optional LessonPlan compatibility rule, status transition direction, open-period write rule, date semantics, indexes/uniqueness decisions, and migrations/tests. It must not add attendance-record changes, roster entry, timetable generation, recurring schedules, grades, or frontend behavior.

#### Later and independent roadmap candidates

- **Later — session/subject attendance:** evolve Attendance after ClassSession is stable. It needs a deliberate record ownership and uniqueness design because the current `AttendanceRecord` is enrollment/date/course-based, not session-based.
- **Later — timetable and scheduling:** add time slots, recurrence, locations, and calendar conflict rules only after the execution session model exists; these are not implied by a date-only session foundation.
- **Later — LessonPlan enhancements:** completion evidence, attachments, AI generation, notifications, exports, and pedagogical refinements remain separate enhancements and must not make LessonPlan an execution record.
- **Independent — curriculum versioning and standards:** introduce versioned curriculum/catalog governance when product requirements define national or institution-specific versions. It may later inform planning, but neither ClassSession nor Attendance is blocked on it.

Teachers can create and save incomplete drafts, edit their own open-period drafts, explicitly publish after confirmation, and delete drafts. Published or closed-period plans render read-only. The editor loads assignment choices through the existing teacher-assignment endpoint and terms through the selected academic-period configuration; calendar dates retain `YYYY-MM-DD` serialization. ADMIN users can list/filter and read plan details, without mutation controls. STUDENT and REPRESENTATIVE navigation is hidden.

## Model and lifecycle

The planning hierarchy is `TeacherAssignment -> AcademicPlan -> AcademicUnit -> LessonPlan`. `AcademicPlan` belongs to one `TeacherAssignment` and one calendar `AcademicTerm`; `AcademicUnit` belongs only to its parent `AcademicPlan`; and `LessonPlan` belongs only to its parent `AcademicUnit`. The assignment is the authoritative teaching context: it provides the teacher, course, subject, academic period, and institution scope. Units and lesson plans do not duplicate independent teacher, course, subject, institution, academic-period, or academic-term ownership.

Plans begin as `DRAFT` and may transition once through the explicit publish action to `PUBLISHED`.

Drafts may omit planning content. Publishing requires a meaningful title, start/end dates, objectives, contents, and activities. A published plan is immutable and records `publishedAt` and `publishedByUserId`.

Calendar dates are accepted as ISO `YYYY-MM-DD` values and are stored as database `DATE` values. When provided, both plan dates are required, must be ordered inclusively, and must fall within the selected academic term.

## Academic Units (Phase 2A)

An `AcademicUnit` belongs to exactly one `AcademicPlan` and stores its title, optional instructional fields, optional date range, and a backend-owned `position`. The pair `(academicPlanId, position)` is unique, so each plan has a deterministic ordered unit sequence.

Base path: `/v1/academic-plans/:planId/units`.

| Method | Path       | Access             | Purpose                                                                 |
| ------ | ---------- | ------------------ | ----------------------------------------------------------------------- |
| GET    | `/`        | Scoped plan reader | List units ordered by position                                          |
| GET    | `/:id`     | Scoped plan reader | Read one unit belonging to the plan                                     |
| POST   | `/`        | TEACHER owner      | Append a unit to a mutable draft plan                                   |
| PATCH  | `/:id`     | TEACHER owner      | Update editable unit fields without changing position                   |
| DELETE | `/:id`     | TEACHER owner      | Delete a unit and normalize remaining positions                         |
| PATCH  | `/reorder` | TEACHER owner      | Replace the complete ordered unit ID set; returns `200 OK` with no body |

Teachers may mutate only units on their own `DRAFT` plans during a non-`CLOSED` academic period. Published plans and closed periods remain readable but reject unit creation, updates, deletion, and reordering. Unit lookup is nested under the requested plan, preventing a unit from another plan from being read or mutated through its ID.

Creation calculates the next position from the current maximum; client DTOs cannot choose a position. Delete and reorder perform collision-safe two-pass updates inside a Prisma transaction, first assigning temporary positions and then the final contiguous positions. Reorder requires the submitted IDs to match the plan's complete current unit set exactly, with no duplicates, foreign units, or unknown IDs. The frontend presents this through Move Up and Move Down controls; it does not implement drag-and-drop, and the backend remains authoritative for final ordering.

### Backend quality status

The AcademicUnit backend is covered by the service test suite for the complete Phase 2A.2 contract. The suite verifies teacher ownership and nested-plan IDOR protection; draft-only mutations; ordering, deletion normalization, and reorder transaction behavior; and visibility of published plans and closed academic periods as historical, read-only data.

Authorization coverage confirms that ADMIN users may read units only inside their institution and cannot mutate them. STUDENT and REPRESENTATIVE users are denied access. The existing service policy also allows SUPER_ADMIN reads; writes remain restricted to the owning TEACHER.

Unit dates use calendar-day `YYYY-MM-DD` input. The client retains those date-only strings without timezone conversion, while the server persists valid dates at UTC midnight. When a range is supplied, both dates are required, ordered inclusively, and contained within the parent AcademicPlan range; exact parent boundaries are valid. Successful create, update, delete, and reorder operations emit structured `AppLoggerService` events only after their writes succeed.

### Frontend behavior

The AcademicPlan detail workspace renders its AcademicUnit section with typed API operations and plan-scoped TanStack Query keys. An owning TEACHER can create, edit, delete, and move units only for a `DRAFT` plan in a non-`CLOSED` period. Published plans and plans from closed periods continue to render units and their empty state, but expose no mutation controls.

ADMIN users can view units only in their allowed institution context and receive no teacher mutation controls. SUPER_ADMIN follows the backend's read-only behavior. STUDENT and REPRESENTATIVE roles are excluded at the Academic Planning route/navigation layer, so the Unit component does not duplicate route-guard testing. The UI includes loading, API-error, and empty states; a failed load is distinct from an empty successful list. Forms provide Spanish labels, accessible controls, client validation, and server-error display, and use the existing responsive light/dark component system.

## Lesson Plans (Phase 2B backend)

`LessonPlan` belongs to exactly one `AcademicUnit`. It stores a required title and calendar lesson date, optional duration and instructional content, and a backend-owned `position`. The unique `(academicUnitId, position)` constraint and index preserve deterministic ordering within the unit.

Base path: `/v1/academic-plans/:planId/units/:unitId/lesson-plans`.

| Method | Path             | Access             | Purpose                                                                        |
| ------ | ---------------- | ------------------ | ------------------------------------------------------------------------------ |
| GET    | `/`              | Scoped unit reader | List lesson plans ordered by position                                          |
| GET    | `/:lessonPlanId` | Scoped unit reader | Read one lesson plan belonging to the nested unit                              |
| POST   | `/`              | TEACHER owner      | Append a lesson plan to a mutable draft plan                                   |
| PATCH  | `/reorder`       | TEACHER owner      | Replace the complete ordered lesson-plan ID set; returns `200 OK` with no body |
| PATCH  | `/:lessonPlanId` | TEACHER owner      | Update editable lesson fields without changing parent or position              |
| DELETE | `/:lessonPlanId` | TEACHER owner      | Delete a lesson plan and normalize remaining positions                         |

The editable payload contains `title`, `lessonDate`, optional `durationMinutes`, and optional `objectives`, `introduction`, `development`, `closure`, `resources`, `evaluationStrategy`, and `notes`. `lessonDate` is a strict `YYYY-MM-DD` value stored in a database `DATE` column, and the response DTO serializes it back as a date-only string. If the parent unit has start and end dates, the lesson date must fall within those inclusive boundaries.

Lesson-plan creation appends at the current maximum position. Delete and reorder use a collision-safe two-pass position update inside a Prisma transaction. Reorder accepts only the exact complete current ID set for the nested unit, with no duplicates, unknown IDs, or lesson plans from another unit. Parent IDs are immutable through the API.

The same planning lifecycle protects lesson plans: only the owning TEACHER may mutate a `DRAFT` plan in a non-`CLOSED` period. ADMIN and SUPER_ADMIN can perform scoped historical reads; STUDENT and REPRESENTATIVE have no access. Create, update, delete, and reorder log structured events only after the corresponding transaction succeeds.

The focused `LessonPlansService` suite currently contains 44 tests covering nested-IDOR protection, scoped read access, write lifecycle checks, date boundaries, payload immutability, logging, complete-set reorder validation, and transaction behavior.

### Frontend types and API client (Phase 2B.3a)

The planning feature now exposes typed `LessonPlan` response, create, update, and reorder payload contracts that mirror the backend DTOs. The authenticated shared API client provides list, detail, create, update, delete, and reorder operations while preserving the nested `AcademicPlan → AcademicUnit → LessonPlan` context: every operation receives `planId` and `unitId`, and detail/update/delete additionally receive `lessonPlanId`.

`lessonDate` remains a date-only `YYYY-MM-DD` string throughout the API layer, so it is never converted to a timezone-bearing timestamp. `durationMinutes` remains a planned duration in minutes and is nullable in responses. Position is server-owned and absent from create/update payloads. Reorder accepts the complete ordered `lessonPlanIds` set for the unit and returns `200 OK` with no body; delete is likewise typed as a no-body response.

### TanStack Query integration (Phase 2B.3b)

The LessonPlan API client is integrated through a feature-local query-key factory and hooks for list/detail queries and create, update, delete, and reorder mutations. Keys preserve the nested resource hierarchy `LessonPlan root → AcademicPlan → AcademicUnit → list/detail → LessonPlan`, so both list and detail cache identity include `planId` and `unitId`; detail keys additionally include `lessonPlanId`.

Create, delete, and reorder invalidate only the affected Plan/Unit list. Update invalidates both the affected nested detail and that same Unit list. Delete removes the matching detail entry before invalidating the Unit list, ensuring the authoritative refetch obtains normalized positions; reorder likewise refetches the backend-authoritative ordering. These operations never invalidate or overwrite LessonPlans for another Unit or Plan.

### Frontend UI (Phase 2B.4)

LessonPlans render directly under their parent AcademicUnit in compact, backend-position order. Each summary shows its position, title, calendar lesson date, and planned duration when provided. The nested section has independent loading, empty, and retryable error states, so a failed lesson-plan request does not replace the surrounding plan or unit UI.

In an owned `DRAFT` plan whose academic period is not `CLOSED`, a TEACHER can create, edit, delete after confirmation, and use explicit **Subir**/**Bajar** controls. The form represents `title`, `lessonDate`, optional positive `durationMinutes`, `objectives`, `introduction`, `development`, `closure`, `resources`, `evaluationStrategy`, and `notes`; it never exposes parent identifiers or `position`. Date inputs preserve calendar-date `YYYY-MM-DD` strings and, where the unit defines dates, use them as inclusive input boundaries. Reordering sends the complete resulting ordered ID set and waits for the authoritative query refetch; drag-and-drop is not implemented.

ADMIN and SUPER_ADMIN may see the scoped read-only UI but receive no mutation controls. Published plans and closed academic periods are likewise historical/read-only. STUDENT and REPRESENTATIVE access remains excluded by the existing planning route and navigation policy. Forms, destructive actions, retry controls, and move actions have Spanish visible or accessible labels, use existing responsive layout primitives, and rely on design tokens that support light and dark modes.

LessonPlan scope deliberately excludes drag-and-drop, timetable scheduling, attendance, lesson execution or completion tracking, grades, assessment records, curriculum standards or Ministry integrations, attachments, AI generation, notifications, and PDF/export.

### Final verification (Phase 2B.5)

Final verification confirmed the `AcademicUnit → LessonPlan` relation and the absence of duplicated inherited academic context on `LessonPlan`. The nested controller and service enforce Plan/Unit/Lesson isolation, ownership and lifecycle checks, while ADMIN and SUPER_ADMIN remain read-only and STUDENT/REPRESENTATIVE remain excluded. Reorder stays a complete-set, transactional two-pass update with contiguous final positions; create appends server-side, delete normalizes positions, and successful mutations emit only identifier-based structured events.

The focused `LessonPlansService` suite passed **44/44** tests. Focused backend ESLint, the backend production build, and Prisma schema validation passed. Frontend `tsc --noEmit`, focused ESLint, and `git diff --check` passed. The frontend production build was attempted and is blocked solely by this environment's inability to fetch Geist and Geist Mono from Google Fonts through `next/font`; this is not a LessonPlan defect. The repository has no established automated frontend component/integration test infrastructure, so the UI flow received a source-level structural trace rather than browser E2E coverage.

## API

Base path: `/v1/academic-plans`.

| Method | Path           | Access                      | Purpose                                 |
| ------ | -------------- | --------------------------- | --------------------------------------- |
| GET    | `/`            | SUPER_ADMIN, ADMIN, TEACHER | Paginated scoped list                   |
| GET    | `/:id`         | SUPER_ADMIN, ADMIN, TEACHER | Scoped plan detail                      |
| POST   | `/`            | TEACHER                     | Create a draft for an owned assignment  |
| PATCH  | `/:id`         | TEACHER owner               | Update a draft; assignment is immutable |
| POST   | `/:id/publish` | TEACHER owner               | Validate and publish a draft            |
| DELETE | `/:id`         | TEACHER owner               | Delete a draft                          |

List responses use `{ data, meta }`, with `meta: { page, limit, total, totalPages }`. Filters are `academicPeriodId`, `teacherAssignmentId`, `courseId`, `subjectId`, `academicTermId`, `status`, `startDateFrom`, `startDateTo`, and `search`.

Plan responses include the plan content and safe denormalized planning context for the teacher, course, subject, academic period, and academic term. They do not expose unrelated user or membership data.

## Authorization and history

Teachers are server-scoped to assignments whose `teacherId` matches their authenticated teacher profile. They cannot use, list, read, modify, publish, or delete another teacher's plans. ADMIN users receive read-only plans only for institutions they can access through the existing membership model. STUDENT and REPRESENTATIVE roles have no endpoint access. Existing non-strict project semantics permit SUPER_ADMIN read access; mutations remain strict TEACHER routes.

When the owning academic period is `CLOSED`, authorized users may read historical plans but create, update, publish, and delete operations are rejected.

## Database migration

`20260920100000_academic_planning_phase1` creates the `AcademicPlanStatus` enum, `academic_plans` table, foreign keys to assignments, terms, and publication/creator users, plus indexes supporting assignment/status and term filtering.

`20260920110000_academic_units_phase2` creates `academic_units`, including its parent-plan foreign key, ordered-position index, and unique `(academicPlanId, position)` constraint.

`20260921090000_lesson_plans_phase2b` creates `lesson_plans`, including the parent-unit cascade foreign key, `lessonDate` as `DATE`, and the unique/indexed `(academicUnitId, position)` ordering constraint.

## Related

- [Teacher assignments](./teacher-assignments.md)
- [Academic periods](./academic-periods.md)
- [RBAC](./rbac.md)
