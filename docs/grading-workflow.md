# Grading workflow (phase 1)

## Overview

Phase 1 implements the teacher-centric flow from evaluation setup to grade entry, integrated with existing academic configuration.

```
Academic Period
    → Course (parallel)
        → Subject (via Teacher Assignment)
            → Academic Term (calendar)
                → Assessment
                    → Grade (per enrolled student)
```

## Teacher workflow (UI)

1. **Select context** — academic period (header selector defaults to effective period).
2. **Create assessment** — `/grades/assessments/new`
   - Pick teacher assignment (course + subject).
   - Pick calendar term and assessment category.
   - Set title, max score, weight, date.
3. **Enter grades** — `/grades/entry`
   - Filter: course → subject → term → assessment.
   - Table lists active enrollments for the course.
   - Bulk save creates or updates grades in one request.
4. **Review** — assessment detail links to grade entry; admins can list assessments read-only.

## Student workflow

1. Open **Notas** (`/grades`).
2. Filter by academic period, term, and subject.
3. View published scores (API scopes to own enrollments).

## Admin / super-admin workflow

- Read-only access to assessments and grade entry sheets for monitoring.
- No mutation endpoints (strict teacher-only writes).

## Validation chain

| Step | Check |
|------|-------|
| Assessment create | Teacher owns assignment; keys aligned; maxScore ≤ scheme max |
| Grade create | Teacher owns assessment; enrollment active; same course/period |
| Score | ≥ 0; ≤ assessment max; within scheme range; decimal places |
| Duplicate | Unique per assessment + enrollment |

## Configuration dependencies

Before grades work in production, the institution needs:

1. `InstitutionAcademicConfiguration` with active `GradingScheme`
2. Active `AssessmentCategory` weights (sum = 100)
3. Teacher assignments for the period
4. Active student enrollments in courses

## API shortcuts

| Task | Endpoint |
|------|----------|
| Grade entry table | `GET /v1/grades/entry-sheet/:assessmentId` |
| Bulk save | `POST /v1/grades/bulk` |
| Student list | `GET /v1/grades?academicPeriodId=&academicTermId=&subjectId=` |

## Phase 2: averages and performance (implemented)

The **Academic Performance** module computes:

- Category averages (weighted by `assessment.weight` and `AssessmentCategory.weight`)
- Academic term averages (calendar `AcademicTerm`)
- Subject averages (weighted by `EvaluationTerm` mapped to term `order`)

API: `/v1/academic-performance/*` · UI: `/academic-performance/*`

See [grade-calculation-engine.md](./grade-calculation-engine.md).

## Future phases (not implemented)

- Report cards with configuration snapshots
- Promotions and recovery exams
- PDF / ministry exports

## Demo data and E2E

```bash
npm run prisma:seed:grades-demo -w backend-zerocademy
npm run test:e2e:grades   # from repository root
```

Demo credentials are documented in [seeds.md](./seeds.md) (`demo-grades` institution).

## Related documentation

- [grades.md](./grades.md)
- [assessments.md](./assessments.md)
- [academic-evaluation.md](./academic-evaluation.md)
- [seeds.md](./seeds.md)
