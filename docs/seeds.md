# Database seeds

## Overview

Seeds bootstrap development and reference data for Zerocademy. They are **idempotent**: safe to rerun; existing system catalog rows are updated or skipped, not duplicated.

Entry point: `BackendZerocademy/prisma/seed.ts`

The default run fills **every current Prisma table** so QA can validate Jira work against realistic rows (catalog + demo institution).

## Structure

```
prisma/
├── seed.ts
└── seeds/
    ├── index.ts                    # runCatalogSeeds()
    ├── run-curriculum.ts           # curriculum-only CLI
    ├── run-grades-demo.ts          # catalog + demo institution CLI
    ├── types.ts
    ├── seed-logger.ts              # structured JSON logs
    ├── seed-summary.ts
    ├── academic-levels.seed.ts
    ├── grade-levels.seed.ts
    ├── subjects.seed.ts
    ├── subject-assignments.seed.ts
    ├── ecuador-evaluation.seed.ts  # platform grading defaults
    ├── grades-demo.seed.ts         # demo institution (all operational tables)
    ├── grades-demo.data.ts
    └── curriculum/
        ├── ecuador.data.ts         # Spanish catalog data
        └── ecuador-curriculum.seed.ts
```

## What gets seeded

| Step | Content |
|------|---------|
| Admin user | `SUPER_ADMIN` (if missing) |
| HealthCheck | Probe row `id = 1` |
| Ecuador catalog | Levels, grades, subjects, `SubjectGradeLevel` links |
| Platform evaluation | Grading scheme, grade scales, category/term templates, platform config |
| Demo institution | Users of every role, memberships, periods, courses, enrollments, evaluation, assessments, grades, transition audit, revoked refresh token |

Curriculum display names remain **Spanish**; logs and code comments are **English**.

## Commands

From repository root:

```bash
npm run prisma:seed -w backend-zerocademy
npm run prisma:seed:curriculum -w backend-zerocademy
npm run prisma:seed:grades-demo -w backend-zerocademy
npm run prisma:seed:dry-run -w backend-zerocademy
```

From `BackendZerocademy/`:

```bash
npx prisma db seed
npm run prisma:seed:curriculum
SEED_DRY_RUN=true npm run prisma:seed
SEED_SKIP_DEMO=true npm run prisma:seed
```

Docker (stack running):

```bash
docker compose exec backend npm run prisma:seed
```

`RUN_PRISMA_SEED=true` (default) runs the same entry point when the backend container starts.

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SEED_ADMIN_EMAIL` | `admin@zerocademy.edu` | Bootstrap admin |
| `SEED_ADMIN_PASSWORD` | `ChangeMe123!` | Bootstrap password |
| `SEED_CATALOGS` | `ecuador` | Comma-separated catalog keys |
| `SEED_SKIP_CATALOG` | — | `true` skips curriculum seeds |
| `SEED_SKIP_DEMO` | — | `true` skips the demo institution |
| `SEED_DRY_RUN` | — | `true` logs without writes |

## Demo institution (`demo-grades`)

Included in the main seed. Dedicated command:

```bash
npm run prisma:seed:grades-demo -w backend-zerocademy
```

| User | Email | Password | Role |
|------|-------|----------|------|
| Platform admin | `admin@zerocademy.edu` | `ChangeMe123!` | `SUPER_ADMIN` |
| Admin demo | `admin.demo@zerocademy.edu` | `DemoAdmin123!` | `ADMIN` |
| Teacher demo | `teacher.demo@zerocademy.edu` | `DemoTeacher123!` | `TEACHER` |
| Representative | `rep.demo@zerocademy.edu` | `DemoRep123!` | `REPRESENTATIVE` |
| Student 1 (Ana) | `student1.demo@zerocademy.edu` | `DemoStudent123!` | `STUDENT` |
| Student 2 (Luis) | `student2.demo@zerocademy.edu` | `DemoStudent123!` | `STUDENT` |
| Extra students | `student3.demo` … `student8.demo@zerocademy.edu` | `DemoStudent123!` | `STUDENT` |

Operational data:

- Institution contact, Sierra region, Costa/Sierra regime colors
- Closed period `2024-2025 Demo` and active period `2025-2026 Demo` with quimesters
- Courses 8vo A / 8vo B (current) and historical 8vo A
- Teacher assignments: Matemática (8vo A), Lengua y Literatura (8vo B)
- Enrollments covering `ACTIVE`, `WITHDRAWN`, `COMPLETED`, `FAILED`, `TRANSFERRED`
- Institution grading scheme, evaluation terms, assessment categories
- Assessments **Demo Unit 1 Exam** and **Tarea en clase 1** with sample grades
- `AcademicPeriodTransition` audit from 2024-2025 → 2025-2026
- Revoked `RefreshToken` row (hash only; not a usable JWT)
- Representative relationships: the demo representative is actively linked to Student 1 and Student 2

Requires Ecuador catalog and platform evaluation defaults (the grades-demo runner executes catalog seeds first).

E2E tests: `npm run test:e2e:grades` from repository root. Those tests keep two **ACTIVE** enrollments on 8vo A.

## Table coverage

| Table | Source |
|-------|--------|
| `users` | Platform admin + demo users |
| `refresh_tokens` | Revoked demo token |
| `institutions` | `demo-grades` |
| `institution_memberships` | Admin + teacher |
| `student_profiles` / `teacher_profiles` / `representative_profiles` | Demo users |
| `academic_periods` / `academic_terms` | Previous (closed) + current (active) |
| `academic_levels` / `grade_levels` | Ecuador catalog |
| `courses` | 8vo A/B current, 8vo A previous |
| `subjects` / `subject_grade_levels` | Ecuador catalog |
| `teacher_assignments` | Matemática + Lengua |
| `enrollments` | All `EnrollmentStatus` values |
| `academic_period_transitions` | Demo year-change audit |
| `grading_schemes` / `grade_scales` | Platform template + institution copy |
| `evaluation_terms` / `assessment_categories` | Institution copies of Ecuador templates |
| `institution_academic_configurations` | Demo institution |
| `platform_academic_evaluation_config` | Platform singleton |
| `assessment_category_templates` / `evaluation_term_templates` | Ecuador templates |
| `assessments` / `grades` | Demo instruments and scores |
| `HealthCheck` | Probe row |

## Execution flow

1. `seed.ts` loads environment and connects Prisma.
2. `seedAdminUser()` — skip if email exists.
3. `seedHealthCheck()` — upsert probe row.
4. `runCatalogSeeds()` — for each catalog key (default `ecuador`):
   - Curriculum transaction: levels → grades → subjects → subject–grade links
   - Platform evaluation defaults
5. `seedGradesDemo()` — demo institution covering operational tables (unless `SEED_SKIP_DEMO=true`).
6. Structured **summary** log (`SEED_RUN_SUMMARY`).

## Idempotency

| Entity | Key |
|--------|-----|
| Academic level | `code` + `institutionId: null` |
| Grade level | `academicLevelId` + `code` |
| Subject | `code` (global unique) |
| Subject–grade link | `subjectId` + `gradeLevelId` |
| Institution | `code` |
| Demo users | `email` |
| Course | `academicPeriodId` + `gradeLevelId` + `section` |
| Enrollment | `studentId` + `courseId` + `academicPeriodId` |
| Grade | `assessmentId` + `enrollmentId` |

Skipped links are logged as `SUBJECT_ASSIGNMENT_SKIPPED`.

## Logging

JSON lines to stdout, e.g.:

```json
{"context":"PrismaSeed","event":"SUBJECT_INSERTED","message":"Subject catalog row inserted","metadata":{"subjectId":"…","code":"MATEMATICA","catalogKey":"ecuador"}}
```

Events include: `*_INSERTED`, `*_UPDATED`, `*_SKIPPED`, `WARN_*`, `SEED_RUN_FAILED`.

No passwords or tokens are logged.

## Legacy catalog note

Earlier development seeds used abbreviated grade names (e.g. `8vo EGB`) and level code `BACH`. The Ecuador catalog uses official Spanish names and code `BGU`. Rerun seeds to upsert new rows; deactivate obsolete system rows manually if needed.

## Adding a new country

1. Add `prisma/seeds/curriculum/<country>.data.ts` (Spanish or local language names in data only).
2. Add `<country>-curriculum.seed.ts` orchestrator.
3. Register key in `seeds/index.ts` `runCatalogSeeds()`.
4. Document in [curriculum.md](./curriculum.md).

## Related

- [curriculum.md](./curriculum.md)
- [database.md](./database.md)
- [academic-structure.md](./academic-structure.md)
