# Grades module

## Purpose

The grades module records **student scores** against teacher-created **assessments**. Phase 1 covers:

- Grade entry (single and bulk)
- Grade updates
- Student self-service read
- Admin / super-admin monitoring (read-only)

Grade-sheet saves are atomic. A request sends only intended enrollment changes:
`SET` creates or updates a numeric score and optional observations, while
`CLEAR` explicitly removes an existing grade. Omitted enrollments remain
unchanged; blank input never means zero or deletion.

**Phase 2 (implemented):** grade calculation engine and academic performance queries — see [grade-calculation-engine.md](./grade-calculation-engine.md).

## Assessment publication and student visibility (Phase 2)

Assessments are created as `DRAFT`; historical rows are backfilled as `PUBLISHED` by the additive publication migration so deployed student results remain visible. An owning teacher with the effective `assessments.update` capability can explicitly publish an assessment. Publication records the authenticated publisher and timestamp, atomically snapshots the active course/period enrollment roster, and does not require every roster member to have a Grade.

Once published, normal Assessment edits/deletion and normal Grade create, update, and bulk sheet writes are locked. The grade-entry sheet reads the frozen roster (including later inactive enrollments); enrollments added after publication are excluded. Teachers use `POST /v1/grades/assessments/:assessmentId/corrections` for a frozen-roster correction. It accepts `SET` or `CLEAR`, an `updatedAt` baseline (or `null` for a missing Grade), and a mandatory non-blank reason. Grade and `GradeAuditEvent` are committed atomically; a stale revision or concurrent missing-Grade create is a conflict.

Student and representative grade lists, academic-performance calculations, dynamic report cards, and report-card PDF data use `PUBLISHED` assessments only. Teacher/internal calculation preview retains draft inputs. Published corrections immediately flow into these dynamic results. Official immutable report-card snapshots, unpublish, and period closure remain Phase 3 work.

**Still out of scope:** PDF exports, promotions, recovery exams, and ministry reports. The read-only report-card view is available through the `reports` domain; see [report-cards.md](./report-cards.md).

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

| Model        | Responsibility                                         |
| ------------ | ------------------------------------------------------ |
| `Assessment` | Evaluation instrument (title, max score, weight, date) |
| `Grade`      | One score per `(assessmentId, enrollmentId)`           |

## API (`/v1/grades`)

| Method | Path                         | Roles                                | Description                                        |
| ------ | ---------------------------- | ------------------------------------ | -------------------------------------------------- |
| GET    | `/`                          | SUPER_ADMIN, ADMIN, TEACHER, STUDENT | Paginated list (scoped)                            |
| GET    | `/entry-sheet/:assessmentId` | SUPER_ADMIN, ADMIN, TEACHER          | Students + existing grades for entry               |
| GET    | `/:id`                       | SUPER_ADMIN, ADMIN, TEACHER, STUDENT | Grade detail                                       |
| POST   | `/`                          | TEACHER                              | Create grade                                       |
| POST   | `/bulk`                      | TEACHER                              | Atomic grade-sheet save (`SET` / explicit `CLEAR`) |
| PATCH  | `/:id`                       | TEACHER                              | Update grade                                       |

## RBAC

| Role          | Access                               |
| ------------- | ------------------------------------ |
| `SUPER_ADMIN` | Read all (monitoring)                |
| `ADMIN`       | Read institution grades (monitoring) |
| `TEACHER`     | CRUD for assigned subjects only      |
| `STUDENT`     | Read own grades only                 |

Services re-check assignment ownership and enrollment eligibility on every mutation.

## Validation

- Score ≥ 0 and ≤ assessment `maxScore`
- Score within institution `GradingScheme` min/max
- Decimal places per institution configuration
- Unique `(assessmentId, enrollmentId)`
- Enrollment must be `ACTIVE` and in the assessment course/period
- A sheet payload cannot repeat an enrollment; all submitted enrollments are
  validated in one bulk query before the write transaction.
- Each sheet entry carries the server `updatedAt` baseline (or `null` for no
  grade). Stale writes return `409`; no partial rows are persisted.

## Logging

Structured events on `GradesModule`:

- `GRADE_CREATED`, `GRADE_UPDATED`, `GRADE_SHEET_SAVED`
- `GRADE_CREATE_FAILED` (validation, no PII in logs)

Every actual grade creation, update, or explicit clear also appends a
`GradeAuditEvent`. It captures assessment/enrollment identity, authenticated
actor, prior/new score and observations, operation, timestamp, and a nullable
future correction reason. Audit events do not reference `Grade`, so clearing a
grade cannot erase its history; there are no audit mutation endpoints.

The normal grade-sheet write additionally enforces `grades.write` with the
membership permission enforcer after legacy teacher ownership validation and
before domain validation. Missing membership, missing capability, or resolver
failure fails closed.

## Frontend routes

| Route                           | Audience                    |
| ------------------------------- | --------------------------- |
| `/grades`                       | Hub (role-based)            |
| `/grades/assessments`           | Assessment list             |
| `/grades/assessments/new`       | Create assessment (teacher) |
| `/grades/assessments/[id]`      | Assessment detail           |
| `/grades/assessments/[id]/edit` | Edit assessment             |
| `/grades/entry`                 | Grade entry workflow        |
| `/grades` (student)             | Own grades with filters     |

## Grade calculation (phase 2)

Averages are computed **dynamically** by `academic-performance` module:

```
Grade → Category Average → Term Average → Subject Average
```

Configuration: `GradingScheme`, `AssessmentCategory`, `EvaluationTerm` (mapped to `AcademicTerm.order`), `InstitutionAcademicConfiguration`.

API: `/v1/academic-performance/*` — see [grade-calculation-engine.md](./grade-calculation-engine.md).

## Future extensibility

- `gradingSchemeId` on `Grade` supports configuration snapshots for report cards
- Assessments retain historical FK graph for analytics and transcripts
- Promotions and ministry exports will consume engine output without schema breaking changes
- Read-only report cards consume calculated results without duplicating grade logic; see [report-cards.md](./report-cards.md)

## Related documentation

- [assessments.md](./assessments.md)
- [grading-workflow.md](./grading-workflow.md)
- [academic-evaluation.md](./academic-evaluation.md)
- [database.md](./database.md)
