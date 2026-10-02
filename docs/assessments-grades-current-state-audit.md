# Assessments and Grades: current-state audit and recommended MVP

## Phase 2 implementation update

Assessment publication is now implemented locally with `DRAFT` and `PUBLISHED` lifecycle states, publication metadata, an atomic frozen `AssessmentRosterEntry` snapshot, and compatibility backfill of existing assessments to `PUBLISHED`. Published assessments cannot be normally edited, deleted, or graded. The dedicated published-grade correction endpoint is roster-scoped, optimistic-concurrency protected, requires a trimmed reason, and records the Phase 1 `GradeAuditEvent` history atomically.

Student and representative grade/result surfaces exclude DRAFT inputs: grade lists, academic-performance calculations, dynamic report cards, and PDF-backed report-card data are publication-filtered. Teacher operational calculations remain allowed to preview DRAFT work. Teacher UI exposes Borrador/Publicada, explicit publication confirmation, frozen published sheets, and row-level correction controls. The additive publication migration remains local-only and must be reviewed with `prisma migrate status` before deployment; it has not been applied to Neon.

## Scope and status

This is a design/audit record, not an implementation plan that changes the
running Grades domain. The ClassSession Attendance MVP is independently
complete and its migration is applied; it is not a prerequisite or a pending
item for the work described here.

The Grades domain is **partially end-to-end implemented**: it has persisted
assessment and grade data, teacher entry, calculations, report cards, seed
data, and scoped APIs. It does not yet provide an official grade-publication
or period-closure workflow.

## Existing model and configuration

`Assessment` is a teacher-owned instrument linked to an institution, academic
period, calendar `AcademicTerm`, subject, `TeacherAssignment`, and
institution-owned `AssessmentCategory`. It stores title, optional description,
`maxScore`, `weight`, and date. `Grade` is one numeric score plus optional
observations for an `(assessmentId, enrollmentId)` pair; the unique database
constraint enforces that identity. At grade creation, `gradingSchemeId` is
captured as an optional scheme reference. An update does not refresh that
snapshot.

The schema and the `20260610120000_grades_assessments_phase1` migration create
the tables, foreign keys, FK/filter indexes, and the grade identity constraint.
The migration is intentionally idempotent because the tables may have existed
from an earlier schema push. The grades demo seed creates a fully linked demo
institution, assessment categories, terms, assessments, and grades. Ecuador
configuration is a seed/template, not a runtime rule.

`InstitutionAcademicConfiguration` selects a grading scheme and stores
rounding/precision. `GradingScheme` provides min, max, passing score, active
and default flags; `GradeScale` defines qualitative bands; active
`AssessmentCategory` weights compose a term; and active `EvaluationTerm`
weights compose a subject. Calendar `AcademicTerm` and weighted
`EvaluationTerm` remain different models and are matched by `order` within an
institution and period.

Migration review found index drift: schema declares
`@@index([institutionId, isDefault])` for `GradingScheme`, but
`20260609120000_academic_evaluation` creates
`grading_schemes_institutionId_isDefault_idx` only on `institutionId`. This is
an index-shape mismatch, not a data-integrity constraint and should be fixed
in a future additive migration after production index inspection.

## Implemented workflow and API

| Capability                        | Status          | Evidence                                                                                                |
| --------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------- |
| Evaluation configuration          | IMPLEMENTED     | Academic-evaluation APIs and frontend manage schemes, scales, categories, terms and institution config. |
| Teacher assessment CRUD           | IMPLEMENTED     | `GET/POST/PATCH/DELETE /v1/assessments`; deletes are blocked once grades exist.                         |
| Single grade write                | IMPLEMENTED     | `POST /v1/grades`, `PATCH /v1/grades/:id`.                                                              |
| Grade entry sheet and bulk entry  | IMPLEMENTED     | `GET /v1/grades/entry-sheet/:assessmentId`, `POST /v1/grades/bulk`.                                     |
| Calculated performance            | IMPLEMENTED     | Scoped `/v1/academic-performance/*` student, representative, teacher and admin queries.                 |
| Report cards/PDF                  | IMPLEMENTED     | Scoped `/v1/report-cards/*` and PDF endpoints.                                                          |
| Official publication/lock/closure | NOT IMPLEMENTED | No state/snapshot/publication model or write gate exists.                                               |

Teachers create an assessment only for their own assignment. The service
validates assignment/subject/period/institution agreement, term membership,
active category ownership, max score against the selected scheme, and a
per-assessment weight between 0 and 100. They obtain the active enrollment
roster for the assessment's course and period, then create or amend grades.
Enrollment eligibility requires `ACTIVE` status and the same course/period.
The entry-sheet roster does not filter by enrollment date, so late enrollment
is currently included.

Assessment reads are available to SUPER_ADMIN, ADMIN and TEACHER; grade reads
add STUDENT. Assessment and grade writes are strictly TEACHER. Services
perform resource scoping: teacher ownership, institution monitoring for ADMIN,
platform monitoring for SUPER_ADMIN, student-self grade access, and linked
representative grade access. Assessment endpoints do not admit STUDENT or
REPRESENTATIVE. The report-card endpoint separately supports representatives.

The API surface is documented by controller Swagger decorators and typed DTOs.
Lists are paginated; assessment filters include institution, period, term,
subject, course, assignment and search; grade filters include assessment,
enrollment, period, term, subject and student. One notable boundary is that
the permission catalog is currently a compatibility/baseline model; Grades and
Assessments still use route role sets plus service scope, not the newer
membership capability enforcer.

Relevant catalog keys are `assessments.read`, `assessments.create`,
`assessments.update`, `assessments.delete`, `grades.read`, and `grades.write`.
The baseline grants all assessment and grade keys to TEACHER; ADMIN and
SUPER_ADMIN receive only the read keys; STUDENT and REPRESENTATIVE receive
`grades.read` only. Those grants do not themselves enforce access yet.

## Current calculations and visibility semantics

The calculation engine loads persisted grades dynamically. It computes:

```text
normalized score = (grade.score / assessment.maxScore) × scheme.maxScore
category average = weighted normalized assessment scores
term average = weighted category averages
subject average = weighted calendar-term averages
```

Each aggregation excludes missing values and renormalizes the remaining
weights. `null` means no data, never zero. Category, term, and subject outputs
are rounded with the institution's `ROUND_HALF_UP`, `ROUND_DOWN`, `ROUND_UP`,
or `TRUNCATE` strategy and configured 0–4 decimal places. If a calendar term
has no matching evaluation-term order, the engine uses equal calendar-term
weights and logs `WEIGHT_MAPPING_INCONSISTENCY`.

Grade-sheet writes are atomic and operation-based: `SET` creates/updates a
numeric score while explicit `CLEAR` removes one persisted grade. Omitted
enrollments remain unchanged, blank UI input is not deletion, and zero remains
a real score. Each entry supplies its loaded `updatedAt` baseline (or `null`
for no grade); stale writes return `409` rather than overwriting newer data.
Duplicate enrollment inputs are rejected before persistence. Actual changes
append immutable `GradeAuditEvent` records with assessment/enrollment identity,
actor, before/after values, operation, timestamp, and nullable future reason.

Grades are visible immediately to each allowed reader and feed performance and
report-card calculations immediately. There is no draft, review, publish,
withhold, correction-window, or closed-period state. `Grade.gradingSchemeId`
helps historical qualitative resolution, but it is not a complete
period-configuration or calculated-result snapshot.

Ecuador behavior is configurable defaults only: seed data supplies 0–10,
passing 7, two decimals, the DAR/AAR/PAAR/NAAR bands, and template categories
and terms. The application does not hardcode Ecuador policies.

## Frontend and product readiness

The grades feature has typed API clients, TanStack Query hooks, Zod assessment
form validation, assessment list/detail/create/edit routes, a role-based hub,
student-grade read UI, and an entry sheet. The entry sheet filters course,
subject, calendar term and assessment, displays the roster, supports score and
observations, and reports partial bulk results. It has normal loading/error
states and Spanish UI copy.

| Surface                     | Backend         | Frontend        | Usable E2E                                                                                                         |
| --------------------------- | --------------- | --------------- | ------------------------------------------------------------------------------------------------------------------ |
| Assessment definition       | IMPLEMENTED     | IMPLEMENTED     | Yes for a teacher with configured evaluation data.                                                                 |
| Grade recording             | IMPLEMENTED     | IMPLEMENTED     | Yes, with partial-success bulk semantics.                                                                          |
| Student results             | IMPLEMENTED     | IMPLEMENTED     | Yes for grades/performance/report cards.                                                                           |
| Representative results      | IMPLEMENTED     | PARTIAL         | Report-card flow exists; a dedicated grades workspace is not established.                                          |
| Admin monitoring            | IMPLEMENTED     | PARTIAL         | Read-only assessment/entry-sheet access; no monitoring dashboard.                                                  |
| Super-admin operations      | BACKEND ONLY    | PARTIAL         | APIs allow platform monitoring, but UI permission helpers omit explicit SUPER_ADMIN paths in several grades cards. |
| Publication/official record | NOT IMPLEMENTED | NOT IMPLEMENTED | No.                                                                                                                |

`Assessment` has no relation to `ClassSession`, `LessonPlan`, or attendance.
Class sessions may reference lesson plans for execution, but attendance is a
separate operational record and currently contributes neither a score nor a
grading rule. That separation is sound; any future attendance-derived grade
must be a deliberate assessment/category policy, not an implicit coupling.

The data loader has a performance concern for course calculations: it loads
enrollments then calls the enrollment-grade loader once per enrollment (an
N+1 query pattern). Grade lists use appropriate indexed paths, but staff
monitoring and calculation workloads need profiling before large cohorts.
Structured logs exist for assessment and grade mutations and calculation
configuration warnings; they are event logs, not an immutable before/after
grade audit trail.

## Recommended grading MVP

The next grading milestone should make current entry safe and operationally
complete, without redesigning calculations:

1. Add an assessment lifecycle (`DRAFT`, `OPEN`, `CLOSED`) and a
   period/term-aware write policy. Teachers may edit only open assessments;
   admins oversee but do not silently alter grades.
2. Add publish controls at assessment/term level. Student and representative
   views should consume only published results; staff preview remains scoped.
3. Add a teacher worklist based on the selected period and their assignments:
   assignment → term → category → assessment → roster, with completion and
   unpublished/published state visible.

The MVP should not add promotion rules, recovery exams, ministry exports,
weighted configuration redesign, attendance scoring, or official
transcript/closure snapshots. Those are deferred product phases.

Open product-owner decisions are: whether publication is per assessment, term,
or academic period; whether a blank saved cell means no grade, clear grade, or
an explicit exempt state; which roles can reopen/correct published work; and
whether late enrollment should appear in an existing assessment roster.

## Data-integrity and test recommendations

Address the grading-scheme index drift with an additive migration. Add a
database-enforceable assessment status before using it as a write boundary.
For a full-sheet contract, prevent duplicate enrollment ids in a payload,
define deletion/blank behavior, and use a transaction plus an optional version
column to avoid silent concurrent overwrites. A future period closure must
persist computed outputs and all configuration/scale data required to render
them historically.

Existing unit coverage is strong for evaluation scales/terms and report-card
services, but the audit did not find Grades-service or Assessment-service unit
specifications. Before the proposed MVP, add tests for teacher ownership,
cross-institution hiding, active/enrollment-date roster rules, duplicate
bulk rows, atomic vs partial semantics, score clearing, lifecycle locks,
publication visibility, concurrent writes, audit events, and scheme/period
snapshot stability. Add an integration test for the complete teacher-to-
student publication flow and a query-count test for course calculations.

## Documentation and tracking

This document is the repository design record. Existing implementation docs
remain `assessments.md`, `grades.md`, `academic-evaluation.md`,
`grade-calculation-engine.md`, and `report-cards.md`. No Jira or Confluence
item was created because no connected Atlassian tooling is available in this
audit environment; create one before implementation, cross-link it to this
design record, and record the final product decisions there.

Recommended implementation phases are deliberately workflow-oriented:

1. Assessment/term publication and visibility.
2. Official period closure and historical snapshots.

Grade-entry integrity and audit history were implemented after this spike. The
next phase is **Assessment/term publication and visibility**: lifecycle state,
teacher publication controls, student/representative visibility gates, and
published-grade correction rules that use the existing nullable audit reason.
