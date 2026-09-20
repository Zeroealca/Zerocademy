# Database

## Stack

- **PostgreSQL** 16 (Docker service `postgres`)
- **Prisma** ORM — schema at `BackendZerocademy/prisma/schema.prisma`

## Models

### User (authentication account)

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| email | String | Unique |
| passwordHash | String | bcrypt |
| firstName, lastName | String | Display name |
| role | Enum | `SUPER_ADMIN`, `ADMIN`, `TEACHER`, `STUDENT`, `REPRESENTATIVE` |
| isActive | Boolean | Login gate |
| selectedAcademicPeriodId | UUID? | UI/query context (ADMIN, TEACHER, STUDENT) |
| deletedAt | DateTime? | Soft delete |
| createdAt, updatedAt | DateTime | Timestamps |

Relations: optional 1:1 `StudentProfile`, `TeacherProfile`, `RepresentativeProfile`.

Indexes: `role`, `isActive`, `deletedAt`.

### Academic profiles

Separated from `User` so authentication stays lean and domain models can evolve independently.

| Model | Linked role | Notes |
|-------|-------------|-------|
| `StudentProfile` | `STUDENT` | 1:1 with `User`; `nationalId` (unique), demographics, `isActive`, optional `institutionId` |
| `Enrollment` | — | Links `StudentProfile` + `Course` + `AcademicPeriod`; `EnrollmentStatus` |
| `TeacherProfile` | `TEACHER` | 1:1 with `User`, optional `institutionId` |
| `RepresentativeProfile` | `REPRESENTATIVE` | 1:1 with `User`, optional `institutionId` |

`RepresentativeStudent` is the historical, explicit M:N authorization link between a representative `User` and `StudentProfile`. It has a unique representative/student pair, active-state indexes in both directions, relationship type, and a database partial unique index for one active primary representative per student. See [representatives.md](./representatives.md).

Profiles are auto-provisioned when an admin creates a user with an academic role.

### Institution

Root owner of the academic domain. See [institutions.md](./institutions.md) and [tenancy-strategy.md](./tenancy-strategy.md).

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| name | String | Display name |
| code | String | Unique identifier (formerly `slug`) |
| email, phone, address | String? | Contact |
| region | Enum? | `COSTA`, `SIERRA`, `AMAZONIA`, `GALAPAGOS` |
| regime | Enum? | `COSTA_GALAPAGOS`, `SIERRA_AMAZONIA` |
| logoUrl | String? | Branding |
| primaryColor, secondaryColor | String? | Hex theme colors |
| isActive | Boolean | Academic operations gate |
| activeAcademicPeriodId | UUID? | FK → current operational `AcademicPeriod` |

Relations: profiles, academic levels/grades, academic periods, courses, subjects, teacher assignments, **memberships**, **period transitions**.

### InstitutionMembership

| Column | Type | Notes |
|--------|------|-------|
| institutionId, userId | UUID | FKs; `@@unique([institutionId, userId])` |
| role | Enum | `ADMIN`, `TEACHER` |
| isActive | Boolean | Membership gate |

See [memberships.md](./memberships.md).

### AcademicPeriodTransition

Audit row per executed school-year transition. See [academic-transitions.md](./academic-transitions.md).

### RefreshToken

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Embedded in refresh JWT as `tokenId` |
| userId | UUID | FK → User (CASCADE delete) |
| tokenHash | String | SHA-256 of refresh JWT |
| expiresAt | DateTime | Server-side expiry |
| revokedAt | DateTime? | Logout / rotation |
| createdAt | DateTime | Audit |

### AcademicPeriod

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| name | String | e.g. `2025-2026` |
| institutionId | UUID? | FK → Institution |
| regime | Enum | `COSTA_GALAPAGOS`, `SIERRA_AMAZONIA` |
| startDate, endDate | Date | Inclusive school-year range |
| isActive | Boolean | Operational flag per regime |
| status | Enum | `PLANNED`, `ACTIVE`, `CLOSED`, `ARCHIVED` |
| createdAt, updatedAt | DateTime | Audit |

Relations: one-to-many `AcademicTerm`.

### AcademicTerm

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| name | String | e.g. `First Quimester` |
| order | Int | Unique per period |
| startDate, endDate | Date | Within parent period |
| academicPeriodId | UUID | FK → AcademicPeriod (CASCADE) |

### AcademicLevel / GradeLevel / Course

Reusable structure catalog plus period-scoped classroom groups. See [academic-structure.md](./academic-structure.md).

| Model | Reused across periods | Key relations |
|-------|----------------------|---------------|
| `AcademicLevel` | Yes | optional `institutionId` |
| `GradeLevel` | Yes | `academicLevelId` |
| `Course` | No (per period) | `institutionId`, `academicPeriodId`, `gradeLevelId` |

### Subject / TeacherAssignment

Reusable subject catalog and period-scoped teacher staffing. See [subjects.md](./subjects.md) and [teacher-assignments.md](./teacher-assignments.md).

| Model | Scope | Key relations |
|-------|-------|---------------|
| `Subject` | Global or institution catalog | `institutionId`, `SubjectGradeLevel`, `TeacherAssignment` |
| `SubjectGradeLevel` | Curriculum link | `Subject`, `GradeLevel` |
| `TeacherAssignment` | Per period + course | `institutionId`, `TeacherProfile`, `Subject`, `Course`, `AcademicPeriod` |

Unique: `Subject.code` (global partial index); `Subject(institutionId, code)` when scoped; `TeacherAssignment(teacherId, subjectId, courseId, academicPeriodId)`.

### Academic planning (Phases 1A and 2A)

`AcademicPlan` is a teacher-assignment-scoped planning record associated with one `AcademicTerm`, creator user, and optional publication user. The `DRAFT` → `PUBLISHED` lifecycle is implemented by the backend API; its migration creates `academic_plans` with restrictive foreign keys and assignment/status plus term indexes. The frontend workspace remains Phase 1B.

`AcademicUnit` belongs to an `AcademicPlan` and records ordered instructional content. Its unique `(academicPlanId, position)` constraint and supporting index preserve a deterministic per-plan order; `academic_units` is created by the Phase 2A migration. See [academic-planning.md](./academic-planning.md).

### Academic evaluation configuration

Configurable grading engine foundation. See [academic-evaluation.md](./academic-evaluation.md).

| Model | Scope | Key relations |
|-------|-------|---------------|
| `GradingScheme` | Institution or global template | `GradeScale`, `InstitutionAcademicConfiguration` |
| `GradeScale` | Per grading scheme | Qualitative bands (DAR, AAR, …) |
| `EvaluationTerm` | Per institution + academic period | Weighted grading periods (not calendar quimesters) |
| `AssessmentCategory` | Per institution | Exam/project/task weights |
| `InstitutionAcademicConfiguration` | 1:1 per institution | Active scheme, rounding, period |

Enum: `RoundingStrategy` — `ROUND_HALF_UP`, `ROUND_DOWN`, `ROUND_UP`, `TRUNCATE`.

> Calendar quimesters remain on `AcademicTerm` (FK → `AcademicPeriod`). `EvaluationTerm` is a separate model for grade weighting.

### Grades (phase 1)

| Model | Scope | Key relations |
|-------|-------|---------------|
| `Assessment` | Institution + period + term | `TeacherAssignment`, `Subject`, `AssessmentCategory`, `AcademicTerm` |
| `Grade` | Per assessment + enrollment | `Assessment`, `Enrollment`, optional `GradingScheme` snapshot |

Unique: `Grade(assessmentId, enrollmentId)`.

See [grades.md](./grades.md) and [assessments.md](./assessments.md).

### Academic performance (phase 2)

Calculated averages are **not persisted**. The `academic-performance` module reads `Grade`, `Assessment`, and evaluation configuration at query time. See [grade-calculation-engine.md](./grade-calculation-engine.md).

### Attendance (phase 1)

`AttendanceRecord` stores one typed daily status per `Enrollment` and school calendar date. It retains institution, course, period and recorder audit keys and enforces `unique(enrollmentId, date)`. See [attendance.md](./attendance.md).

`AttendanceJustification` belongs to one attendance record and records the authenticated submitter, review audit metadata, a typed `PENDING`/`APPROVED`/`REJECTED` state, and a reason. Its partial unique index permits only one pending justification for an attendance record, independent of whether the submitter is the student or an authorized representative.

**Design decision:** Dynamic calculation is used by the first read-only report-card phase. Closure-time snapshot tables remain deferred for future official/PDF report cards.

### HealthCheck

Bootstrap table for infrastructure health probes.

## Migrations

```bash
# Development (from repo root)
npm run prisma:migrate:dev -w backend-zerocademy

# Or from BackendZerocademy/
cd BackendZerocademy && npx prisma migrate dev

# Docker / production-style
npm run docker:prisma:migrate
```

Migrations live in `BackendZerocademy/prisma/migrations/`:

| Migration | Purpose |
|-----------|---------|
| `20250516120000_init` | Health check bootstrap |
| `20250517120000_auth_users` | Users, refresh tokens, initial roles |
| `20250517140000_rbac_profiles` | `REPRESENTATIVE` role, institutions, academic profiles |
| `20250517160000_academic_periods` | Academic periods and terms (Ecuador regimes) |
| `20250518120000_academic_structure` | Academic levels, grade levels, classroom courses |
| `20250519120000_subjects_teacher_assignments` | Subjects, subject–grade links, teacher assignments |
| `20250520120000_institutions_foundation` | Institution fields, ownership FKs on academic domain |
| `20250521120000_memberships_transitions` | Memberships, transition audit, `activeAcademicPeriodId` |
| `20250521140000_user_selected_academic_period` | `User.selectedAcademicPeriodId` |
| `20250521180000_students_enrollments` | Student profiles and period-scoped enrollments |
| `20260519172008` | Historical database alignment migration |
| `20260609120000_academic_evaluation` | Grading schemes, evaluation terms, assessment categories, institution config |
| `20260609140000_platform_evaluation_defaults` | Platform-level Ecuador evaluation defaults |
| `20260610120000_grades_assessments_phase1` | Assessments and grade entries |
| `20260917120000_unique_teacher_per_subject_course` | Teacher-assignment uniqueness enforcement |
| `20260917130000_student_registration_number` | Student registration-number support |
| `20260919090000_attendance_daily_phase1` | Daily attendance records and roster integrity |
| `20260919093000_attendance_justifications_phase3` | Attendance justifications and review audit metadata |
| `20260919110000_representative_student_relationships` | Representative–student authorization relationships |
| `20260920100000_academic_planning_phase1` | Academic plans and publish lifecycle |
| `20260920110000_academic_units_phase2` | Ordered academic units per plan |

Never edit applied migration SQL retroactively.

## Seeding

```bash
npm run prisma:seed -w backend-zerocademy
npm run prisma:seed:curriculum -w backend-zerocademy   # catalog only
npm run prisma:seed:grades-demo -w backend-zerocademy  # catalog + demo institution
npm run prisma:seed:dry-run -w backend-zerocademy    # no writes
```

Creates a `SUPER_ADMIN` if none exists, upserts the **Ecuador reference catalog**, platform evaluation defaults, and the **demo institution** (`demo-grades`) so every current table has rows for QA. See [seeds.md](./seeds.md) and [curriculum.md](./curriculum.md).

Super admins do not require an academic profile.

## Design decisions

- **Single role per user** — stored as Prisma enum on `User.role`; extend with join table when multi-role is required.
- **Profile separation** — academic data never mixed into `User` columns.
- **Soft delete** — `deletedAt` on users; queries filter `deletedAt: null`.
- **Refresh token persistence** — enables logout and rotation without server sessions.
- **Institution-aware** — `Institution` as domain root; optional `institutionId` on periods, courses, subjects, assignments, and profiles. See [tenancy-strategy.md](./tenancy-strategy.md).

## Connection

`DATABASE_URL` in `.env` (root for Docker, `BackendZerocademy/.env` for local API-only dev).

## Related documentation

- [institutions.md](./institutions.md) — institutions module
- [memberships.md](./memberships.md) — institution memberships
- [academic-transitions.md](./academic-transitions.md) — period transitions
- [tenancy-strategy.md](./tenancy-strategy.md) — multi-institution roadmap
- [academic-structure.md](./academic-structure.md) — levels, grades, courses
- [subjects.md](./subjects.md) — subject catalog
- [teacher-assignments.md](./teacher-assignments.md) — teacher staffing
- [curriculum.md](./curriculum.md) — curriculum design
- [seeds.md](./seeds.md) — seed execution
- [academic-periods.md](./academic-periods.md) — calendar module
- [rbac.md](./rbac.md) — authorization and profile strategy
- [ownership-strategy.md](./ownership-strategy.md) — scope and period context
- [auth.md](./auth.md) — JWT flows
