# Grades module (phase 1)

## Purpose

The grades module records **student scores** against teacher-created **assessments**. Phase 1 covers:

- Grade entry (single and bulk)
- Grade updates
- Student self-service read
- Admin / super-admin monitoring (read-only)

**Out of scope (phase 1):** report cards, final averages, promotions, PDF exports, recovery exams, ministry reports.

## Architecture

```
TeacherAssignment (staffing)
        │
        ▼
   Assessment ──► Grade ◄── Enrollment (active student in course)
        │              │
        │              └── gradingSchemeId (snapshot at entry)
        └── AssessmentCategory (institution config)
        └── AcademicTerm (calendar quimester)
```

Grades **read** institution evaluation configuration (`GradingScheme` via `InstitutionAcademicConfiguration`) for score bounds and decimal places. Ecuador-specific logic is **not** hardcoded.

## Models

See [database.md](./database.md) — `Assessment`, `Grade`.

| Model | Responsibility |
|-------|----------------|
| `Assessment` | Evaluation instrument (title, max score, weight, date) |
| `Grade` | One score per `(assessmentId, enrollmentId)` |

## API (`/v1/grades`)

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/` | SUPER_ADMIN, ADMIN, TEACHER, STUDENT | Paginated list (scoped) |
| GET | `/entry-sheet/:assessmentId` | SUPER_ADMIN, ADMIN, TEACHER | Students + existing grades for entry |
| GET | `/:id` | SUPER_ADMIN, ADMIN, TEACHER, STUDENT | Grade detail |
| POST | `/` | TEACHER | Create grade |
| POST | `/bulk` | TEACHER | Bulk create/update |
| PATCH | `/:id` | TEACHER | Update grade |

## RBAC

| Role | Access |
|------|--------|
| `SUPER_ADMIN` | Read all (monitoring) |
| `ADMIN` | Read institution grades (monitoring) |
| `TEACHER` | CRUD for assigned subjects only |
| `STUDENT` | Read own grades only |

Services re-check assignment ownership and enrollment eligibility on every mutation.

## Validation

- Score ≥ 0 and ≤ assessment `maxScore`
- Score within institution `GradingScheme` min/max
- Decimal places per institution configuration
- Unique `(assessmentId, enrollmentId)`
- Enrollment must be `ACTIVE` and in the assessment course/period

## Logging

Structured events on `GradesModule`:

- `GRADE_CREATED`, `GRADE_UPDATED`, `GRADES_BULK_UPSERTED`
- `GRADE_CREATE_FAILED` (validation, no PII in logs)

## Frontend routes

| Route | Audience |
|-------|----------|
| `/grades` | Hub (role-based) |
| `/grades/assessments` | Assessment list |
| `/grades/assessments/new` | Create assessment (teacher) |
| `/grades/assessments/[id]` | Assessment detail |
| `/grades/assessments/[id]/edit` | Edit assessment |
| `/grades/entry` | Grade entry workflow |
| `/grades` (student) | Own grades with filters |

## Future extensibility

- `gradingSchemeId` on `Grade` supports configuration snapshots for report cards
- Assessments retain historical FK graph for analytics and transcripts
- Averages and promotions will consume grades without schema breaking changes

## Related documentation

- [assessments.md](./assessments.md)
- [grading-workflow.md](./grading-workflow.md)
- [academic-evaluation.md](./academic-evaluation.md)
- [database.md](./database.md)
