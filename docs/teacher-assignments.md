# Teacher assignments

## Purpose

Teacher assignments connect the academic staffing graph:

```
TeacherProfile ↔ TeacherAssignment ↔ Subject
                              ↔ Course
                              ↔ AcademicPeriod
```

A teacher may teach multiple subjects, courses, and periods. Assignments are **period-scoped** and reference a specific classroom course (parallel).

## Data model

| Model | Table | Notes |
|-------|-------|--------|
| `TeacherAssignment` | `teacher_assignments` | Unique per teacher + subject + course + period |

### Foreign keys

| Field | References |
|-------|------------|
| `teacherId` | `TeacherProfile.id` |
| `subjectId` | `Subject.id` |
| `courseId` | `Course.id` |
| `academicPeriodId` | `AcademicPeriod.id` |

Unique constraint: `(teacherId, subjectId, courseId, academicPeriodId)`.

## Assignment lifecycle

1. **Create** — Admin selects period, teacher, course, and subject. Service validates:
   - Teacher user is active with role `TEACHER`
   - Subject and course are active
   - `course.academicPeriodId` matches payload
   - Non-system subjects are linked to the course’s grade level
   - No duplicate assignment for the same tuple
2. **Update** — Same validations when keys change
3. **Delete** — Hard delete (staffing row only; no cascade to users or catalog)

## API (`/v1/teacher-assignments`)

| Method | Path | Roles |
|--------|------|-------|
| GET | `/` | Read: SUPER_ADMIN, ADMIN, TEACHER |
| GET | `/hierarchy/by-period` | Read (`academicPeriodId`, optional `teacherId`) |
| GET | `/:id` | Read |
| POST | `/` | Write: SUPER_ADMIN, ADMIN |
| PATCH | `/:id` | Write |
| DELETE | `/:id` | Write |

List filters: `teacherId`, `subjectId`, `courseId`, `academicPeriodId`, `gradeLevelId`, `search`.

## Business rules

1. One assignment row per teacher/subject/course/period combination.
2. Course must belong to the selected academic period.
3. Custom subjects must apply to the course’s grade level.
4. System subjects may be assigned without grade links (catalog-wide).
5. Conflicts return `409` with structured log `TEACHER_ASSIGNMENT_CONFLICT`.

## Frontend

| Route | Feature |
|-------|---------|
| `/teacher-assignments` | Paginated table, period filter |
| `/teacher-assignments/new` | Create form (cascading period → course → subject) |

Teachers are loaded from `/v1/users?role=TEACHER`; `profileId` is sent as `teacherId`.

## Logging

Structured events (`TeacherAssignmentsService`):

- `TEACHER_ASSIGNMENT_CREATED`, `TEACHER_ASSIGNMENT_UPDATED`, `TEACHER_ASSIGNMENT_DELETED`
- `TEACHER_ASSIGNMENT_CONFLICT` (warn, no PII)

## Extensibility

- Institution scoping can filter teachers and courses by `institutionId` on profiles.
- Future scheduling reads assignments without schema changes.
- Workload limits or co-teaching can be modeled with additional columns or a child table.

## Related

- [subjects.md](./subjects.md)
- [academic-structure.md](./academic-structure.md)
- [academic-periods.md](./academic-periods.md)
- [database.md](./database.md)
