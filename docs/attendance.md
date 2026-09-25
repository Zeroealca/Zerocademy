# Daily attendance

Product guides: [20 — Asistencia diaria](https://emilioandresalcivarcarrera.atlassian.net/wiki/spaces/DDS/pages/9142293/20+Asistencia+diaria) and [21 — Reportes de asistencia](https://emilioandresalcivarcarrera.atlassian.net/wiki/spaces/DDS/pages/9142320/21+Reportes+de+asistencia). Tracking: [DEMY-81](https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-81), [DEMY-82](https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-82), and [DEMY-83](https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-83).

## Purpose and scope

The `attendance` domain records daily, course-level attendance for an enrollment. It supports roster entry, read-only reports, and the controlled justification workflow described below. Notifications, document storage, and timetable sessions remain out of scope.

## Architecture decisions

- **Course-level daily attendance:** a teacher with at least one `TeacherAssignment` for the selected course and academic period may record the course roster. Subject/session attendance is deferred until a timetable/session domain exists.
- **Historical owner:** each `AttendanceRecord` belongs to `Enrollment`, which already preserves the student, course, and academic-period relationship. Records are never attached directly to `StudentProfile`.
- **Calendar date:** `date` is PostgreSQL `DATE` (`@db.Date`) and API requests use `YYYY-MM-DD`. The service parses it at UTC midnight only for Prisma's date value; it serializes the submitted calendar string, so browser/server timezones cannot move the school date.
- **No implied presence:** a missing record returns `status: null`. The UI may offer “Mark all present,” but only an explicit batch save persists it.

## Data model

`AttendanceRecord` contains `institutionId`, `academicPeriodId`, `courseId`, `enrollmentId`, `date`, `status`, optional `notes` (maximum 500 characters), `recordedByUserId`, and timestamps.

`@@unique([enrollmentId, date])` prevents duplicates because an enrollment is immutable for one course and academic period. Indexes support course/period/date rosters and institution/date auditing. The redundant course, period, and institution keys make authorization and day-roster queries efficient while service validation guarantees they match the enrollment and course context.

Statuses are the typed Prisma enum: `PRESENT`, `ABSENT`, `LATE`, and `EXCUSED`.

## API

| Endpoint                                                               | Roles                       | Purpose                                             |
| ---------------------------------------------------------------------- | --------------------------- | --------------------------------------------------- |
| `GET /v1/attendance/courses?academicPeriodId=`                         | SUPER_ADMIN, ADMIN, TEACHER | Courses the actor can use for attendance.           |
| `GET /v1/attendance/daily?academicPeriodId=&courseId=&date=YYYY-MM-DD` | SUPER_ADMIN, ADMIN, TEACHER | Roster plus explicit recorded or unrecorded status. |
| `POST /v1/attendance/bulk`                                             | SUPER_ADMIN, ADMIN, TEACHER | Transactional create/update batch.                  |

Every submitted enrollment must be active, belong to the exact course and academic period, and have an enrollment date no later than the selected date. Existing records remain visible even if an enrollment subsequently becomes inactive, preserving the historical roster. The current enrollment model has no withdrawal-effective date, so it cannot reconstruct membership before a later withdrawal beyond already recorded records.

## Authorization and period lifecycle

- TEACHER access is derived from an existing `TeacherAssignment` in the selected course and period.
- ADMIN access uses active institution memberships; SUPER_ADMIN keeps platform-wide access.
- Cross-course, cross-period, and cross-institution enrollment IDs fail validation; routes do not trust frontend scope.
- `CLOSED` and `ARCHIVED` academic periods are read-only. The daily response exposes `isReadOnly` for the UI.

## Frontend workflow

`/attendance` is available to teachers, administrators, and super administrators. Select period, course, and date, then use the roster's Spanish status labels (Presente, Ausente, Atraso, Justificado). “Marcar todos presentes” changes only the local draft. One save sends all rows in a single batch, and reopening a date loads persisted values for editing.

## Future extensibility

Future work can add exports, notifications, and a session/subject layer without changing the enrollment-based historical record. The Academic Execution `ClassSession` backend foundation and API now exist: it is owned by `TeacherAssignment` and may optionally link to a planning-only `LessonPlan`; see [academic-planning.md](./academic-planning.md). It represents an actual teaching occurrence, not a daily attendance row.

The current attendance contract does **not** yet reference `ClassSession`: it remains course-level and enrollment/date-unique. A future session/subject attendance phase must explicitly choose its record ownership and uniqueness rules before adding a session relationship, so multiple subject sessions on one calendar day cannot silently conflict with the present `@@unique([enrollmentId, date])` invariant.

## Phase 2 reporting

Attendance records remain the reporting source of truth; no summary table is stored. Student history uses the historical enrollment relationship and filters actual records by period, date range, and optional status. Course reports aggregate `AttendanceRecord` by enrollment and status, then join the course roster in a bounded course query.

`UNRECORDED` is never persisted or counted as `ABSENT`. `recordedDays` is the sum of the four persisted statuses. The neutral `attendancePercentage` is `(PRESENT + LATE) / recordedDays * 100`; `EXCUSED` remains a factual separate count and the percentage is informational only, with no regulatory or promotion implication.

Student self-service is `GET /v1/attendance/me/history`; authorized staff use `GET /v1/attendance/course-summary`. Both support historical closed periods because they are read-only queries. The frontend route `/attendance/reports` provides student history or the staff course report.

PDF and CSV exports remain deferred: Phase 2 exposes the typed report DTO that a future renderer can consume without querying raw attendance data.

## Phase 3 absence justifications

An `AttendanceJustification` belongs to an individual `AttendanceRecord`, never directly to a student. This preserves the exact course, period, and calendar date being challenged. Its independent enum is `PENDING`, `APPROVED`, or `REJECTED`; it is intentionally separate from `AttendanceStatus`.

Only the authenticated student whose enrollment owns an `ABSENT` record, or an authenticated representative with an active `RepresentativeStudent` relationship to that enrollment's student, may submit a reason (1–1000 characters). The submitter is always recorded as `submittedByUserId`; the justification remains attached to the attendance record. Representative authorization resolves the full attendance → enrollment → student relationship and verifies the attendance institution matches the student context, so a relationship for one student never grants access to another student's or institution's attendance record.

Submission is blocked for `CLOSED` and `ARCHIVED` periods and when a pending justification already exists for that record. A PostgreSQL partial unique index permits only one `PENDING` row per attendance record regardless of whether the requester is a student or representative; the service returns a clear conflict for ordinary and concurrent submissions. The regular `(attendanceRecordId, status)` index supports the lookup path.

An institution `ADMIN` lists pending submissions and is the only reviewer role in this phase. Rejection requires a review comment. Approval and the related attendance change execute in one Prisma transaction: the justification receives reviewer, timestamp, and decision, then the attendance status changes from `ABSENT` to `EXCUSED`. A rejected record stays `ABSENT`; a reviewed submission cannot be reviewed again. The service also records structured submit/approve/reject events through `AppLoggerService`.

| Endpoint                                                     | Roles                   | Purpose                                                                                                     |
| ------------------------------------------------------------ | ----------------------- | ----------------------------------------------------------------------------------------------------------- |
| `POST /v1/attendance/:attendanceRecordId/justifications`     | STUDENT, REPRESENTATIVE | Submit a reason for the caller's own eligible absence or an actively associated student's eligible absence. |
| `GET /v1/attendance/justifications?status=PENDING`           | ADMIN                   | List scoped institution justifications for review.                                                          |
| `POST /v1/attendance/justifications/:justificationId/review` | ADMIN                   | Approve or reject a pending justification.                                                                  |

The student and representative history response includes a factual justification status plus a backend-computed submission eligibility flag, and `/attendance/reports` exposes the shared submit and administrator-review flows. The administrator queue includes a safe submitter descriptor (role and display name), so representative requests use the same review queue and state transition. No binary attachments are accepted in this phase: the current local upload mechanism is not durable across Render instances. Add attachment metadata and object storage only when a persistent storage provider is selected.
