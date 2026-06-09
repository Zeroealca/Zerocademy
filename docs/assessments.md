# Assessments

## Purpose

An **assessment** is a teacher-owned evaluation instrument tied to a **teacher assignment**, **calendar academic term**, and **assessment category**. It defines the maximum score and weight used when teachers register grades.

## Model: `Assessment`

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| institutionId | UUID | FK → Institution |
| academicPeriodId | UUID | FK → AcademicPeriod |
| academicTermId | UUID | FK → AcademicTerm (calendar quimester) |
| subjectId | UUID | FK → Subject |
| teacherAssignmentId | UUID | FK → TeacherAssignment |
| assessmentCategoryId | UUID | FK → AssessmentCategory |
| title | String | Display label |
| description | String? | Optional |
| maxScore | Decimal | Must fit institution grading scheme |
| weight | Decimal | 0–100 (category composition) |
| assessmentDate | Date | Evaluation date |

## API (`/v1/assessments`)

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/` | SUPER_ADMIN, ADMIN, TEACHER | Paginated list (scoped) |
| GET | `/:id` | SUPER_ADMIN, ADMIN, TEACHER | Detail |
| POST | `/` | TEACHER | Create |
| PATCH | `/:id` | TEACHER | Update |
| DELETE | `/:id` | TEACHER | Delete (blocked if grades exist) |

## Business rules

1. Teacher must own the `teacherAssignmentId`.
2. `subjectId`, `academicPeriodId`, and `institutionId` must match the assignment.
3. `academicTermId` must belong to `academicPeriodId`.
4. `assessmentCategoryId` must be active and belong to the institution.
5. `maxScore` cannot exceed the institution active grading scheme maximum.
6. Deletion is rejected when grade records exist (`onDelete: Restrict` on grades).

## RBAC

| Role | Access |
|------|--------|
| `SUPER_ADMIN` | Read all |
| `ADMIN` | Read institution assessments |
| `TEACHER` | Full CRUD on own assignments |
| `STUDENT` | No direct assessment access |

## Logging

- `ASSESSMENT_CREATED`, `ASSESSMENT_UPDATED`, `ASSESSMENT_DELETED`

## Frontend

- List: `/grades/assessments`
- Create: `/grades/assessments/new`
- Detail / edit: `/grades/assessments/[id]`, `/grades/assessments/[id]/edit`

## Related documentation

- [grades.md](./grades.md)
- [grading-workflow.md](./grading-workflow.md)
- [assessment-categories.md](./assessment-categories.md)
- [academic-periods.md](./academic-periods.md)
