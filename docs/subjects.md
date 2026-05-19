# Subjects

## Purpose

The subjects module manages a **reusable subject catalog** independent of academic periods. Subjects can be linked to multiple grade levels and assigned to teachers per course and period via [teacher-assignments.md](./teacher-assignments.md).

The design avoids Ecuador-only enums and supports future curriculum and institution customization.

## Data model

| Model | Table | Scope |
|-------|-------|--------|
| `Subject` | `subjects` | Global reusable catalog |
| `SubjectGradeLevel` | `subject_grade_levels` | Many-to-many: subject ↔ grade level |

### Subject fields

| Field | Notes |
|-------|--------|
| `code` | Unique globally (normalized uppercase in API) |
| `isSystem` | Platform-managed catalog entry |
| `isActive` | Operational flag; deactivate before removing assignments |

### Relationships

```
Subject
  ├── SubjectGradeLevel → GradeLevel
  └── TeacherAssignment (see teacher-assignments.md)
```

## API (`/v1/subjects`)

| Method | Path | Roles (read / write) |
|--------|------|----------------------|
| GET | `/` | SUPER_ADMIN, ADMIN, TEACHER / — |
| GET | `/hierarchy/catalog` | Read |
| GET | `/:id` | Read |
| POST | `/` | Write: SUPER_ADMIN, ADMIN |
| PATCH | `/:id` | Write |
| POST | `/:id/activate` | Write |
| POST | `/:id/deactivate` | Write |
| DELETE | `/:id` | Write (no assignments) |

List query: `page`, `limit`, `search`, `isActive`, `isSystem`, `gradeLevelId`.

Hierarchy query: `gradeLevelId`, `activeOnly` (default `true`).

## Business rules

1. Subject codes are unique across the catalog.
2. Custom subjects may link to one or more active grade levels.
3. System subjects (`isSystem: true`) are not restricted to grades at creation; links can be added on update.
4. Deactivation is blocked while teacher assignments reference the subject.
5. Deletion is blocked when assignments exist.

## Frontend

| Route | Feature |
|-------|---------|
| `/subjects` | List, filters, activate/deactivate |
| `/subjects/new` | Create form |
| `/subjects/:id/edit` | Edit form, delete |

UI copy is Spanish per `FrontendZerocademy/agent.md`.

## Logging

Structured events (`SubjectsService`):

- `SUBJECT_CREATED`, `SUBJECT_UPDATED`, `SUBJECT_ACTIVATED`
- `SUBJECT_DEACTIVATED`, `SUBJECT_DELETED`

## Extensibility

- Optional `institutionId` can be added later without renaming models.
- Curriculum modules can extend `SubjectGradeLevel` or add parallel join tables.
- Scheduling modules consume assignments, not subject rows directly.

## Related

- [teacher-assignments.md](./teacher-assignments.md)
- [academic-structure.md](./academic-structure.md)
- [curriculum.md](./curriculum.md)
- [seeds.md](./seeds.md)
- [database.md](./database.md)
