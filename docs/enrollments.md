# Enrollments

## Overview

An **enrollment** links a permanent `StudentProfile` to a `Course` and `AcademicPeriod`. Status changes preserve history; student/course/period keys are immutable after creation.

## Lifecycle (`EnrollmentStatus`)

| Status | Meaning |
|--------|---------|
| ACTIVE | Currently enrolled |
| WITHDRAWN | Left before completion |
| COMPLETED | Finished successfully |
| FAILED | Did not meet requirements |
| TRANSFERRED | Moved to another offering |

## Constraints

- `@@unique([studentId, courseId, academicPeriodId])` — one enrollment row per triple.
- Updates may change `status` and `enrollmentDate` only (no reassignment to another course/period).

## API (`/v1/enrollments`)

| Method | Path | Roles (strict) |
|--------|------|----------------|
| GET | `/` | ADMIN, TEACHER, STUDENT (scoped) |
| GET | `/student/:studentId/history` | ADMIN, TEACHER, STUDENT (scoped) |
| GET | `/:id` | ADMIN, TEACHER, STUDENT (scoped) |
| POST | `/` | ADMIN |
| POST | `/bulk` | ADMIN |
| GET | `/available-students` | ADMIN |
| PATCH | `/:id` | ADMIN |

## RBAC

- **ADMIN:** create and update enrollments.
- **SUPER_ADMIN:** excluded (strict).
- **TEACHER:** read enrollments for assigned courses.
- **STUDENT:** read own enrollments only.

## Frontend

- Feature: `FrontendZerocademy/src/features/enrollments`
- Routes: `/enrollments`, `/enrollments/new`, `/enrollments/bulk`, `/enrollments/[id]/edit`
- Institution student history: `/students/[id]/enrollments` (ADMIN, TEACHER)
- Student self-service: `/my-enrollments` (STUDENT only)
- **Nueva matrícula:** el selector de estudiantes excluye quienes ya tienen matrícula **ACTIVE** en el período elegido (`excludeEnrolledInPeriodId` en `GET /v1/students`).
- **Matriculación masiva:** elige curso/paralelo y marca estudiantes sin matrícula en ese curso (`GET /v1/enrollments/available-students`, `POST /v1/enrollments/bulk`).

## Logging

`ENROLLMENT_CREATED`, `ENROLLMENT_UPDATED` (context `EnrollmentsService`).

## Related

- [students.md](./students.md)
- [academic-structure.md](./academic-structure.md)
