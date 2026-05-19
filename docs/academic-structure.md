# Academic structure

## Purpose

The academic structure layer models **reusable** education stages and grades, plus **period-scoped** classroom offerings (parallels/sections). It supports Ecuadorian schools as the initial reference model without hardcoding Ecuador-only logic in application code.

Institutions can:

- Reuse **system catalog** entries (`isSystem: true`, global scope)
- Create **custom** levels and grades (`institutionId` set)
- Open **courses** (classroom groups) per academic period and grade

## Hierarchy

```
AcademicLevel  (e.g. EGB, Bachillerato, Inicial)
    └── GradeLevel  (e.g. 8vo, 9no, 1ro Bachillerato)
            └── Course  (e.g. section A, B, C — per AcademicPeriod)
```

- **Academic levels** and **grade levels** are reusable across academic periods.
- **Courses** are always tied to one `academicPeriodId` and one `gradeLevelId`.

## Prisma models

| Model | Table | Scope |
|-------|-------|--------|
| `AcademicLevel` | `academic_levels` | Global or institution-specific |
| `GradeLevel` | `grade_levels` | Child of academic level |
| `Course` | `courses` | Per period + grade (section/parallel) |

### AcademicLevel

| Field | Notes |
|-------|--------|
| `code` | Unique per scope (global partial unique index when `institutionId` is null) |
| `order` | Display / sort order |
| `isSystem` | Catalog entry managed by platform admins |
| `institutionId` | `null` = global catalog |

### GradeLevel

| Field | Notes |
|-------|--------|
| `academicLevelId` | Required parent |
| `code` | Unique per `academicLevelId` |
| `institutionId` | Optional institution override scope |

### Course

| Field | Notes |
|-------|--------|
| `name` | Display name (e.g. grade label + parallel) |
| `section` | Parallel identifier (A, B, C) |
| `capacity` | Optional seat cap |
| `academicPeriodId` | School year / period |
| `gradeLevelId` | Grade within level |

Unique: `(academicPeriodId, gradeLevelId, section)`.

## API (prefix `/v1`)

| Resource | Base path |
|----------|-----------|
| Academic levels | `/academic-levels` |
| Grade levels | `/grade-levels` |
| Classroom courses | `/courses` |

### Hierarchy endpoint

`GET /academic-levels/hierarchy/tree`

Query:

- `institutionId` (optional) — include global catalog + institution custom rows
- `academicPeriodId` (optional) — embed courses for that period under each grade

### Common operations

All three resources support:

- Paginated list (`page`, `limit`, filters)
- CRUD (admin roles)
- `POST /:id/activate` and `POST /:id/deactivate`

### RBAC

| Action | Roles |
|--------|-------|
| Read | `SUPER_ADMIN`, `ADMIN`, `TEACHER` |
| Write | `SUPER_ADMIN`, `ADMIN` |

## Business rules

1. System levels cannot have `institutionId`.
2. Grade level codes are unique within an academic level.
3. Course sections are unique per period + grade.
4. Deactivating an academic level requires no active child grades.
5. Deleting levels/grades is blocked when dependent rows exist.
6. Course creation validates that the period and grade exist and the grade is active.

## Ecuador reference (seed only)

The Ecuador national reference catalog is seeded via modular files under `prisma/seeds/curriculum/` (see [seeds.md](./seeds.md) and [curriculum.md](./curriculum.md)):

- **Educación Inicial**, **Educación General Básica**, **Bachillerato General Unificado**
- Grades such as *Primero de EGB*, *Décimo de EGB*, *Primero de BGU* (Spanish names)
- Common subjects and `SubjectGradeLevel` links

Institutions may add custom structures through the API; no Ecuador enum is enforced in application code.

## Frontend

| Feature | Routes |
|---------|--------|
| Academic levels | `/academic-levels` |
| Grade levels | `/grade-levels` |
| Courses | `/courses` |
| Hierarchy tree | `/academic-structure` |
| Subjects | `/subjects` |
| Teacher assignments | `/teacher-assignments` |

UI copy is Spanish; see `FrontendZerocademy/agent.md`.

## Logging

Structured events (examples):

- `ACADEMIC_LEVEL_CREATED`, `ACADEMIC_LEVEL_DEACTIVATED`
- `GRADE_LEVEL_CREATED`, `GRADE_LEVEL_UPDATED`
- `COURSE_CREATED`, `COURSE_DEACTIVATED`

Context: `AcademicLevelsService`, `GradeLevelsService`, `CoursesService`.

## Subjects and teacher assignments

Staffing sits on top of this hierarchy:

```
GradeLevel → Course (per period) → TeacherAssignment ← Subject
                                      ↑
                               TeacherProfile
```

See [subjects.md](./subjects.md) and [teacher-assignments.md](./teacher-assignments.md).

## Extensibility

- New levels/grades via API (no schema change)
- Institution-specific rows via `institutionId`
- Subjects and teacher assignments use the same `Course` model (classroom offering) without renaming it

## Related

- [database.md](./database.md)
- [academic-periods.md](./academic-periods.md)
- [api-flow.md](./api-flow.md)
