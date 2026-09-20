# Representatives — Phase 1

## Purpose

Representatives are existing `User` accounts with the global `REPRESENTATIVE` role. They have read-only access to the academic information of students with an active authorized relationship. This phase intentionally excludes submitting attendance justifications, messaging, notifications, and billing.

## Domain model

`RepresentativeStudent` is an explicit many-to-many relationship between `User` (the representative) and `StudentProfile`. It stores `relationshipType` (`MOTHER`, `FATHER`, `LEGAL_GUARDIAN`, `GRANDPARENT`, or `OTHER`), `isPrimary`, `isActive`, and timestamps. One user may relate to many students and a student may relate to many users. The unique representative/student pair prevents duplicates; removal deactivates the row so historical linkage metadata is retained. A partial database index allows only one active primary relationship per student. Primary status is descriptive and never changes authorization.

Representative profiles retain their optional institution link for provisioning and administration. Access itself is based on an active relationship, so a representative can be extended to multiple institutions without changing the relationship model.

## Authorization

The shared `assertActorCanAccessStudent` policy now permits a representative only when an active `RepresentativeStudent` row matches both the authenticated user and requested student. It returns `404` for unrelated students, preventing IDOR enumeration. This policy is reused by student reads, enrollment reads, report cards/PDFs, attendance history, and representative performance reads. Grade list/detail queries are additionally filtered by active relationships.

Representatives receive no grade, attendance, enrollment, configuration, or student-management mutations. They may submit an attendance justification only through the shared `AttendanceJustification` workflow for an `ABSENT` attendance record owned by an actively associated student. Attendance history exposes only the factual justification identifier/status, never review comments, reasons, or reviewer metadata.

Representative submission uses the authenticated user as `submittedByUserId`; no representative identity is accepted from the client. The attendance record is resolved through its enrollment and student, then authorization requires an active `RepresentativeStudent` relation and a matching student/attendance institution context. Unrelated or cross-context records return `404`, including after a relationship has been deactivated. A relationship deactivation never deletes the historical justification or submitter audit information.

The existing one-pending-justification-per-attendance-record constraint is shared across students and every representative. A representative may view the factual status of a request for an associated student but cannot edit a request submitted by another actor; this Phase 3 implementation has no pending-edit endpoint. Evidence attachments remain unavailable because the current attendance workflow has no durable storage provider.

## API

| Method | Path                                                          | Role           | Description                                                                                 |
| ------ | ------------------------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------- |
| GET    | `/v1/representatives/me/students`                             | REPRESENTATIVE | Active associated student cards with current active enrollment summary.                     |
| GET    | `/v1/representatives/students/:studentId`                     | ADMIN          | List a student's current and inactive relationships in the administrator institution scope. |
| POST   | `/v1/representatives/students/:studentId`                     | ADMIN          | Associate an active representative user.                                                    |
| PATCH  | `/v1/representatives/:relationshipId`                         | ADMIN          | Change relationship type or primary marker.                                                 |
| DELETE | `/v1/representatives/:relationshipId`                         | ADMIN          | Deactivate the relationship.                                                                |
| GET    | `/v1/report-cards/:studentId` and `/pdf`                      | REPRESENTATIVE | Read/download an associated student's historical report card.                               |
| GET    | `/v1/academic-performance/representative/student-performance` | REPRESENTATIVE | Read associated student performance for an academic period.                                 |
| GET    | `/v1/attendance/students/:studentId/history`                  | REPRESENTATIVE | Read associated student attendance and factual justification state.                         |
| POST   | `/v1/attendance/:attendanceRecordId/justifications`           | REPRESENTATIVE | Submit the existing justification workflow for an eligible associated student's absence.    |

Existing user provisioning is reused. ADMIN can create `STUDENT` and `REPRESENTATIVE` users; duplicate email creation remains a `409` and does not overwrite a role. The current RBAC model has one global role per user, so multi-role users are not introduced in this phase.

## Frontend

`/representative` is a minimal representative portal with loading, error, and empty states. It lists all active relationships and links to existing academic surfaces. The attendance link supplies explicit student and academic-period context; the history query key includes the representative student ID, period, and date range to avoid cache leakage when one representative switches between students. Eligible absences use the same Spanish reason form as student self-service and show Pending, Approved, or Rejected status.

## Seed data

The development demo account `rep.demo@zerocademy.edu` / `DemoRep123!` is linked to the first two demo students, giving a reproducible one-to-many authorization case.
