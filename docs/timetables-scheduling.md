# Timetables / Scheduling MVP

Status: implemented through DEMY-144. This is the current-state reference; historic increment notes remain in QA evidence and are not future scope.

Tracking: [DEMY-133 — Timetables / Scheduling MVP](https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-133). Related: [academic-planning.md](./academic-planning.md), [teacher-assignments.md](./teacher-assignments.md), [authorization-permissions.md](./authorization-permissions.md), and [ownership-strategy.md](./ownership-strategy.md).

## Purpose and implemented model

The MVP provides one recurring weekly timetable per institution and academic period. It places `TeacherAssignment` teaching loads in enabled teaching blocks, detects conflicts, supports a versioned DRAFT/PUBLISHED lifecycle, and provides published read-only views to teachers, students, and representatives.

| Entity | Scope / rule |
| --- | --- |
| `PeriodScheduleStructure` | One per `institutionId + academicPeriodId`; enabled weekdays and ordered local-time blocks. |
| `ScheduleBlock` | `TEACHING`, `BREAK`, or `NON_TEACHING`; only teaching blocks receive slots. |
| `TeachingLoad` | Final operational `weeklyPeriods` for a `TeacherAssignment`. |
| `Timetable` | One aggregate per institution/period, with `DRAFT` or `PUBLISHED` status and optimistic `version`. |
| `TimetableSlot` | Assignment placement in a weekday/block; teacher/course denormalization is solely for indexes and conflict checks. |

Slots are unique per timetable/teacher/day/block, timetable/course/day/block, and timetable/assignment/day/block. Assignment, institution, academic period, teacher, course, and block ownership are derived and verified server-side; client-provided identifiers are never authoritative.

`TimetableSlot` is a recurring plan. `ClassSession` is an actual dated occurrence. The timetable never bulk-creates sessions, and manual or exceptional sessions may have no timetable origin.

## Administration, generation, and validation

Strict institutional `ADMIN` users configure enabled weekdays, ordered blocks, and teaching loads. Structures require enabled weekdays, usable teaching blocks, valid time ranges, and no overlaps. CLOSED and ARCHIVED periods reject writes.

The pure TypeScript CSP/backtracking generator receives trusted normalized context from the authorized HTTP boundary and returns a non-persistent proposal. A successful proposal fulfills every configured load and passes complete conflict validation; it becomes persistent only through explicit DRAFT creation.

| Constraint | Meaning |
| --- | --- |
| Structure/context | Enabled teaching positions and matching institution/period ownership. |
| Assignment/load | Assignment and teaching load are valid for the selected context. |
| Teacher occupancy | A teacher cannot occupy two assignments in one weekday/block. |
| Course occupancy | A course cannot occupy two assignments in one weekday/block. |
| Assignment occupancy | An assignment cannot duplicate a weekday/block. |
| Load completion | Complete validation requires exactly `weeklyPeriods`; edits cannot exceed it. |

`INVALID_CONFIGURATION` covers malformed or unready input. `UNSATISFIABLE` covers valid input that fails a modeled feasibility check, including teacher/course demand exceeding usable positions. `SEARCH_LIMIT_REACHED` is the distinct deterministic node-budget outcome; it never reports partial success.

| Method | Path | Behavior |
| --- | --- | --- |
| POST | `/v1/institutions/:institutionId/academic-periods/:academicPeriodId/timetables/generate` | Returns a non-persistent proposal (`200`). |
| POST | `/v1/institutions/:institutionId/academic-periods/:academicPeriodId/timetables` | Creates a complete DRAFT atomically. |
| GET | `/v1/timetables/:timetableId/validation` | Runs complete validation without writes. |
| PUT | `/v1/timetables/:timetableId/slots` | Atomically replaces DRAFT slots with `expectedVersion`. |
| POST | `/v1/timetables/:timetableId/publish` | Revalidates and publishes a complete current DRAFT. |
| POST | `/v1/timetables/:timetableId/unpublish` | Returns PUBLISHED to DRAFT while preserving slots. |
| DELETE | `/v1/timetables/:timetableId` | Discards a DRAFT only. |

## Publication lifecycle

Only a complete current DRAFT in a PLANNED or ACTIVE period can be published. Publication revalidates inside its transaction, increments `version`, and records `publishedAt` and `publishedByUserId`. PUBLISHED timetables are read-only. Unpublish is explicit and versioned: it preserves slots, clears publication metadata, and restores the editable DRAFT. Stale versions and invalid transitions conflict; CLOSED and ARCHIVED periods reject mutations.

The `/timetables` ADMIN workspace implements configuration, proposal preview, DRAFT save/discard, revalidation, accessible slot editing, stale-version recovery, and publish/unpublish confirmation. It has no client-side source of scheduling truth.

## Published views and ClassSession integration

| Audience | Published view and boundary |
| --- | --- |
| TEACHER | `/v1/timetables/me` and `/me/today`; authenticated `TeacherProfile` slots only. |
| STUDENT | `/v1/timetables/student/me` and `/student/me/today`; active enrollment course and period only. |
| REPRESENTATIVE | `/v1/timetables/representative` and `/representative/today`; selected student’s active authenticated relationship required. |

Drafts, another institution/period, unlinked students, and unrelated courses are not exposed. Empty results are intentional. The UI supplies read-only Semana/Hoy views, with an authorized linked-student selector for representatives. Today uses `America/Guayaquil` until an institution timezone exists.

From a teacher Today slot, Academic Execution opens exactly one `SCHEDULED` ClassSession for the original slot and Ecuador calendar date. The origin must be a teacher-owned slot in a PUBLISHED timetable. It persists nullable `timetableSlotId` (`ON DELETE SET NULL`), an immutable unique occurrence key, and immutable schedule data. Slot replacement, unpublication, or deletion cannot rewrite historical execution or attendance context. Opening is idempotent; no bulk materialization or replacement workflow exists.

## Authorization and institutional isolation

Administration uses strict `ADMIN` routes, active institutional membership, authoritative institution/period resource checks, and fail-closed legacy-role **and** effective membership-permission enforcement. `SUPER_ADMIN` is not an implicit timetable operator. These boundaries apply to configuration, generation, mutation, and lifecycle transitions.

Teacher reads also enforce `timetables.read` membership capability and profile ownership. Student/representative reads use strict role guards plus authoritative enrollment/relationship filters, since `InstitutionMembership` currently holds ADMIN and TEACHER roles only. These are server-side boundaries, not UI conventions.

### DEMY-126 dependency decision

DEMY-126 is not required for the Timetables MVP or DEMY-145 closure. Existing membership, strict ADMIN boundaries, resource-scoped checks, and permission enforcement already prevent platform-only or cross-institution timetable administration. DEMY-126 remains a valid authorization-model improvement for further institutional roles; making it a prerequisite would add migration risk without addressing a demonstrated Timetables gap.

## Valid-UNSAT testability rationale

Supported valid hard constraints are enabled teaching positions, exact assignment loads, teacher occupancy, course occupancy, and assignment duplicate prevention. The model has no teacher availability, room, multi-shift, preference, adjacency, or distribution constraint.

| Scenario | Evidence |
| --- | --- |
| Valid proposal and exact loads | `timetable-generation.service.spec.ts`; HTTP lifecycle coverage in `BackendZerocademy/test/timetables.e2e-spec.ts`. |
| Invalid/unready structure | HTTP E2E returns readiness failure without persistence. |
| Search budget exhaustion | HTTP E2E sends `maxSearchNodes: 1` and verifies `SEARCH_LIMIT_REACHED` with no partial proposal. |
| Valid capacity UNSAT | `TimetableGenerationService` unit test verifies `UNSATISFIABLE` and `COURSE_CAPACITY_EXCEEDED`. |
| Slot conflicts | Conflict-engine unit and HTTP E2E cover teacher, course, duplicate, invalid-block/day, and context diagnostics. |
| Determinism | Unit test compares permuted normalized inputs; HTTP E2E compares two proposals from the same fixture. |

No HTTP test is claimed for `UNSATISFIABLE`. The authenticated generator preflights teacher and course capacity. With the supported valid constraints, input passing those per-teacher and per-course checks is an occupancy packing into available weekday/block cells; no remaining supported valid constraint can form a genuine non-capacity HTTP UNSAT fixture. Capacity UNSAT is tested at the generator integration boundary.

A production-only test hook or artificial solver constraint would change behavior, weaken the contract, or manufacture non-domain state merely to force a branch. It is inappropriate. If a future real constraint (for example availability or rooms) makes a valid HTTP UNSAT fixture possible, add that fixture and coverage with the feature.

## QA evidence and current status

The consolidated DEMY-140–144 acceptance campaign is [final-summary.md](../qa/demy-144-acceptance/campaign-20261101T202546-f29528cef82b/final-summary.md): three passes of 46 scenarios, **138/138**, zero failures, skips, or retries. It covers ADMIN structure/lifecycle/authorization/grid, teacher, student/representative, and ClassSession flows on desktop and Pixel 5. Its baseline is Git `f29528cef82b08c53aa3e2a08bc1390d72b2ab23` with fingerprint `9ec92e1ae65360bff1d40151ff8ab90a9f2b2c5078094776774f8da92e0b2144`.

DEMY-145 is a non-mutating coverage audit; its traceability and outstanding Jira reconciliation are in [coverage-matrix.md](../qa/demy-145-audit/coverage-matrix.md). The documented DEMY-144 missing-permission HTTP exception is not represented as a passing HTTP test.

## Deferred features

- Institution timezone persistence for Galápagos or multi-timezone Today correctness.
- Rooms, campuses, and resource allocation.
- Multi-jornada / shift structures.
- Teacher availability/preferences, gap minimization, load distribution, consecutive-period, and double-period optimization.
- Historical timetable versions and bulk ClassSession materialization.
