# Attendance ClassSession design spike

## Scope and current state

This design spike reviews how to add attendance recorded against actual `ClassSession` occurrences. It does not alter the existing daily `AttendanceRecord` implementation, schema, migrations, authorization migration, or frontend.

Attendance already exists as a separate module. It records one daily, course-level `AttendanceRecord` per `Enrollment` and calendar date, with `PRESENT`, `ABSENT`, `LATE`, and `EXCUSED` statuses; optional notes; reporting; student/representative history; and absence justification workflows. Its unique constraint is `@@unique([enrollmentId, date])`. That invariant intentionally prevents a direct reuse of the current record model for subject/session attendance because one student can have multiple ClassSessions on the same date.

## Existing execution and enrollment context

`ClassSession` is an actual teaching occurrence owned by `TeacherAssignment`. Its assignment supplies the teacher, course, academic period, and institution. A session has `SCHEDULED`, `COMPLETED`, or `CANCELLED` status; `scheduledDate`, `occurredOn`, and an optional planning-only `LessonPlan` link. `COMPLETED` requires `occurredOn`; `SCHEDULED` and `CANCELLED` require `scheduledDate`; all supplied dates must be in the assignment period. Teachers can create and update only their own assignment sessions; ADMIN and SUPER_ADMIN can read them under the existing execution policy. ClassSession writes are already immutable in `CLOSED` and `ARCHIVED` periods.

The authoritative roster is the assignment's course and academic period: `ClassSession → TeacherAssignment → Course + AcademicPeriod → Enrollment → StudentProfile`. `Course` already represents the course/section (parallel); there is no separate parallel attendance identity. An `Enrollment` is immutable for its student/course/period triple and carries a mutable status plus `enrollmentDate`. It therefore remains the correct attendance identity, rather than `StudentProfile`.

The current data cannot fully reconstruct a roster at an arbitrary historical date after a withdrawal or transfer: it has no status-effective date. The initial session roster may select `ACTIVE` enrollments whose `enrollmentDate` is on or before the session's `occurredOn`, and persisted session-attendance rows then preserve the actual submitted roster. Exact historical membership for an unrecorded old session needs future enrollment effective-date/history work.

## Recommended model

Add a distinct `ClassSessionAttendanceRecord`; do not repurpose or mutate `AttendanceRecord`.

```prisma
model ClassSessionAttendanceRecord {
  id               String           @id @default(uuid())
  classSessionId   String
  enrollmentId     String
  status           AttendanceStatus
  note             String?          @db.VarChar(500)
  recordedByUserId String
  createdAt        DateTime         @default(now())
  updatedAt        DateTime         @updatedAt

  classSession     ClassSession     @relation(fields: [classSessionId], references: [id], onDelete: Restrict)
  enrollment       Enrollment       @relation(fields: [enrollmentId], references: [id], onDelete: Restrict)
  recordedByUser   User             @relation("ClassSessionAttendanceRecordedBy", fields: [recordedByUserId], references: [id], onDelete: Restrict)

  @@unique([classSessionId, enrollmentId])
  @@index([enrollmentId])
  @@index([classSessionId, status])
  @@map("class_session_attendance_records")
}
```

Reuse the existing `AttendanceStatus` enum: `PRESENT`, `ABSENT`, `LATE`, and `EXCUSED`. All four are justified in the MVP because they already exist in the daily attendance product and support practical teacher recording. `note` is optional and limited to 500 characters; it supports a concise factual teacher note, not attachments or an evidence workflow.

The composite unique constraint is the record identity and concurrency safeguard. `Restrict` relations preserve historical evidence and expose any conflict with future deletion policies rather than silently deleting attendance. The existing `AttendanceJustification` is intentionally not attached to this new model in the first session-attendance slice; student/representative session-history and formal absence justifications require a coherent extension of their current daily-record contract.

## Lifecycle and recording rules

- Attendance is recorded only for `COMPLETED` sessions. It does not automatically transition a session from `SCHEDULED` to `COMPLETED`; recording attendance and declaring a session completed are separate teacher decisions.
- `SCHEDULED` sessions return no writable attendance roster. A teacher completes the session with an `occurredOn` date first.
- `CANCELLED` sessions reject new or edited attendance. A cancellation after records exist must not delete them; the session status remains the authoritative indicator that the occurrence was cancelled, and the inconsistency should be surfaced for an explicit corrective workflow rather than erased.
- `CLOSED` and `ARCHIVED` academic periods are read-only, matching ClassSession behavior. No new ARCHIVED policy is introduced.
- Teachers may edit their own completed-session attendance while the period remains writable. No separate attendance lock is needed initially; completion is derived by comparing expected eligible enrollments with persisted rows.

## Aggregate API and bulk behavior

Attendance is naturally a ClassSession aggregate. Use the existing nested execution route shape:

| Endpoint                                                                                     | Role boundary              | Capability         | Purpose                                                                        |
| -------------------------------------------------------------------------------------------- | -------------------------- | ------------------ | ------------------------------------------------------------------------------ |
| `GET /v1/teacher-assignments/:teacherAssignmentId/class-sessions/:classSessionId/attendance` | existing execution readers | `attendance.read`  | Return session metadata and its expected roster with persisted values, if any. |
| `PUT /v1/teacher-assignments/:teacherAssignmentId/class-sessions/:classSessionId/attendance` | strict owner TEACHER       | `attendance.write` | Atomically replace the complete attendance state for the completed session.    |

The service must first resolve the authoritative nested session and assignment, enforce legacy scope, then evaluate the current membership permission foundation once against the assignment institution. Existing keys are `attendance.read` and `attendance.write`; no new key is required. The eventual service must reuse `MembershipPermissionEnforcer` and `AUTHORIZATION_PERMISSION_ENFORCEMENT`, preserving `legacy scope AND effective permission AND lifecycle/domain rules`.

Read response shape:

```ts
{
  classSession: { id, status, occurredOn, teacherAssignmentId },
  isReadOnly: boolean,
  students: [{ enrollmentId, studentId, fullName, status: AttendanceStatus | null, note: string | null }]
}
```

Names are adequate for the roster; national ID is not needed. Before a submission, status is `null` and no row is persisted. The client may offer “Mark all present” as a local draft only.

Write shape:

```ts
{ records: [{ enrollmentId, status, note?: string | null }] }
```

Initial and later submissions must be exact-set replacements: every expected enrollment appears exactly once, duplicates and an empty roster payload are rejected, and omitted students are never interpreted as present or unrecorded. The server performs one bulk enrollment query scoped to the assignment course, period, `ACTIVE` status, and `enrollmentDate <= occurredOn`; it compares the submitted ID set exactly to that roster before persistence. This prevents cross-course, cross-period, cross-institution, and foreign-enrollment submissions without an N+1 query.

Use one Prisma transaction. After validation, delete existing records for the session and create the replacement set in that transaction (or use transactional upserts plus deletion of omitted rows, though exact-set replacement makes delete/create clearer). The composite unique constraint prevents duplicate identities under concurrent requests; last successful complete submission wins. No distributed lock is warranted for the initial workflow.

## Roles, query, audit, and reporting

The recommended MVP role boundary is deliberately narrow:

| Role                     | Session attendance                                                                               |
| ------------------------ | ------------------------------------------------------------------------------------------------ |
| TEACHER                  | Read, record, and edit only own TeacherAssignment sessions.                                      |
| ADMIN                    | No new write capability; defer institution read until a concrete operational review need exists. |
| SUPER_ADMIN              | No new operational access; retain platform-role separation.                                      |
| STUDENT / REPRESENTATIVE | No ClassSession attendance surface in this MVP; daily attendance history remains unchanged.      |

Each request needs one session/assignment context query, one membership/capability evaluation, one bounded roster query (including student names and existing records for reads), and one transaction for writes. No per-student authorization, enrollment lookup, or resolver invocation is permitted.

Emit one structured event per successful bulk operation: `CLASS_SESSION_ATTENDANCE_RECORDED` for the first complete set and `CLASS_SESSION_ATTENDANCE_UPDATED` for a replacement, with classSession ID, assignment ID, count, and actor. Do not emit one event per student.

The model supports later reporting by enrollment/student, session date, course, period, teacher assignment, subject, and status. Attendance percentages and student/representative history are deliberately deferred until product policy defines how daily and session records coexist, so reports never mix incompatible denominators.

## Frontend and delivery plan

Add a “Tomar asistencia” action to each completed session in the existing Academic Execution workspace. The roster view should be responsive, default to unrecorded values, allow local “Marcar todos presentes,” require every row to be selected before an explicit save, warn before discarding dirty drafts, and disable controls for non-completed, cancelled, or read-only-period sessions. Existing `/attendance` daily workflow remains untouched.

MVP: session roster read; owner-TEACHER exact-set bulk write/edit; four statuses; optional note; transactionality; current permission keys and telemetry; focused backend tests; and the execution-workspace action.

Deferred: daily-attendance migration or consolidation; ADMIN session-attendance read; student/representative session history; formal session absence justifications and attachments; notifications; analytics/percentages; exports; QR/biometric capture; offline mode; monthly bulk entry; and automatic ClassSession completion.

Recommended implementation phases:

1. Schema and backend aggregate: migration, `ClassSessionAttendanceRecord`, nested read/replace service/controller, authorization, lifecycle/isolation/atomicity tests, and logging.
2. Teacher execution-workspace workflow: roster UI, local draft controls, exact-set save, read-only states, and frontend tests.
3. Only after product policy: unified reporting/history and justification design across daily and session attendance.

## Open product decisions

1. Is ClassSession attendance additive to the existing daily course attendance, or should it eventually replace it? The answer governs reporting, student history, and justification consolidation.
2. Is the current Enrollment lifecycle sufficient for future historical rosters, or should withdrawals/transfers receive effective dates before a broad historical-attendance rollout?

## Phase 1 implementation

Phase 1 implements the backend aggregate without changing daily attendance. `ClassSessionAttendanceRecord` is a new, separate table using the existing `AttendanceStatus` enum and `@@unique([classSessionId, enrollmentId])`. Its ClassSession, Enrollment, and recording User foreign keys use `Restrict`, preserving historical rows; the normal migration is `20261001110000_class_session_attendance_phase1`.

Strict TEACHER-only endpoints are `GET` and `PUT /v1/teacher-assignments/:teacherAssignmentId/class-sessions/:classSessionId/attendance`. Both first resolve the nested ClassSession and owner TeacherAssignment, then evaluate the existing membership foundation once (`attendance.read` for GET and `attendance.write` for PUT). ADMIN, SUPER_ADMIN, STUDENT, and REPRESENTATIVE have no new session-attendance access.

GET is side-effect free and returns eligible active Enrollment rows for the authoritative course/period whose enrollment date is no later than the completed session date. Missing persisted records return null status/note. PUT requires a COMPLETED session and writable (not CLOSED/ARCHIVED) period; it rejects duplicates and any non-exact roster set, then atomically deletes and recreates the complete set. This deliberately makes the latest successful complete submission the current state and records its actor on every row. SCHEDULED/CANCELLED sessions reject writes, and cancellation never deletes stored attendance.

The roster remains subject to the known historical limitation: Enrollment status changes lack withdrawal/transfer effective dates, so unrecorded retrospective rosters cannot be reconstructed exactly. Frontend workflow, reports, daily/session consolidation, justifications, and session-attendance student/representative history remain deferred.
