# Curriculum catalog

## Purpose

The curriculum layer defines **which subjects apply to which grade levels**, independent of academic periods and classroom courses. It supports Ecuador as the initial reference country while remaining extensible for other countries and institution-specific catalogs.

## Hierarchy

```
AcademicLevel  (e.g. Educación General Básica)
    └── GradeLevel  (e.g. Primero de EGB)
            └── SubjectGradeLevel  →  Subject  (e.g. Matemática)
```

Classroom offerings (`Course`) and teacher staffing (`TeacherAssignment`) sit on top of this structure per [academic-structure.md](./academic-structure.md).

## Prisma models

| Concept | Prisma model | Table |
|---------|--------------|-------|
| Reusable subject | `Subject` | `subjects` |
| Grade ↔ subject link | `SubjectGradeLevel` | `subject_grade_levels` |

`SubjectGradeLevel` is the join table (equivalent to a `GradeLevelSubject` naming); it enforces `@@unique([subjectId, gradeLevelId])`.

## Ecuador reference catalog (seed)

Display names are **Spanish** (Ecuadorian MINEDUC terminology). Application code does not hardcode country enums.

### Academic levels

| Code | Name |
|------|------|
| `INICIAL` | Educación Inicial |
| `EGB` | Educación General Básica |
| `BGU` | Bachillerato General Unificado |

### Grade levels (examples)

| Level | Examples |
|-------|----------|
| Inicial | Inicial 1, Inicial 2 |
| EGB | Primero de EGB … Décimo de EGB |
| BGU | Primero de BGU, Segundo de BGU, Tercero de BGU |

### Subjects (catalog)

Includes common areas such as:

- Lengua y Literatura
- Matemática
- Ciencias Naturales
- Estudios Sociales
- Educación Física
- Educación Cultural y Artística
- Inglés
- Física, Química, Biología
- Filosofía, Historia, Ciudadanía
- Emprendimiento y Gestión
- Informática

### Assignment rules (design)

| Pattern | Typical grades |
|---------|----------------|
| Core troncal | Inicial, EGB 1–10, BGU |
| Inglés | EGB 8–10, BGU |
| Sciences split (Física, Química, Biología) | BGU 2–3 |
| Ciudadanía, Emprendimiento | BGU 2–3 |

Rules live in `prisma/seeds/curriculum/ecuador.data.ts` — not in NestJS services.

## Extensibility

| Need | Approach |
|------|----------|
| Another country | Add `prisma/seeds/curriculum/<country>.data.ts` + orchestrator |
| Institution custom subjects | API (`isSystem: false`, optional `institutionId` later) |
| Curriculum versioning | Future `CurriculumVersion` model + seed bundles per version |
| Override national catalog | Institution-scoped `Subject` / links without changing system rows |

## Boundary with planning and execution

Curriculum versioning is independent catalog governance, not a child of `TeacherAssignment`, `AcademicPlan`, `AcademicUnit`, `LessonPlan`, or `ClassSession`. A future version may inform planning through references or validation, but the current Planning Phase 2C Teaching Session Foundation is not blocked by it. This keeps Ecuador reference data configurable and avoids coupling a teaching occurrence to one Ministry format, pedagogical methodology, or grading model.

## Related

- [seeds.md](./seeds.md) — execution and idempotency
- [subjects.md](./subjects.md) — API module
- [academic-structure.md](./academic-structure.md) — levels and grades
- [database.md](./database.md) — schema reference
