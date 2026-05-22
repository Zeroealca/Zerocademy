# Students

## Overview

Students are **permanent academic entities** stored as `StudentProfile` (1:1 with `User` where `role = STUDENT`). Demographic and contact fields live on the profile; authentication stays on `User`.

## Architecture

```
User (STUDENT role)
  └── StudentProfile (permanent record)
        └── Enrollment[] (period-scoped)
              ├── Course
              └── AcademicPeriod
```

## API (`/v1/students`)

| Method | Path | Roles (strict) |
|--------|------|----------------|
| GET | `/` | ADMIN, TEACHER, STUDENT (scoped) |
| GET | `/me` | STUDENT |
| GET | `/:id` | ADMIN, TEACHER, STUDENT (scoped) |
| POST | `/` | ADMIN |
| PATCH | `/:id` | ADMIN |
| POST | `/:id/activate` | ADMIN |
| POST | `/:id/deactivate` | ADMIN |
| POST | `/bulk-import` | ADMIN |

## RBAC

- **ADMIN:** full student CRUD and CSV import.
- **SUPER_ADMIN:** no access (strict routes — no implicit bypass).
- **TEACHER:** read students enrolled in assigned courses.
- **STUDENT:** read own profile via `/me` and list filter to self.

## Frontend

- Feature: `FrontendZerocademy/src/features/students`
- Routes: `/students`, `/students/new`, `/students/[id]/edit`, `/students/bulk-import`, `/students/[id]/enrollments`
- Permissions: `canManageStudents`, `canViewStudents` in `lib/permissions.ts`

## Logging

Structured events: `STUDENT_CREATED`, `STUDENT_UPDATED` (context `StudentsService`).

## Related

- [enrollments.md](./enrollments.md)
- [bulk-imports.md](./bulk-imports.md)
- [rbac.md](./rbac.md)
