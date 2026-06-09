# Evaluation terms (grading periods)

> **Not to be confused with** calendar `AcademicTerm` (quimesters under `AcademicPeriod`). This document covers **`EvaluationTerm`** — weighted grading periods.

## Model: `EvaluationTerm`

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| institutionId | UUID | FK → Institution |
| academicPeriodId | UUID | FK → AcademicPeriod |
| name | String | Unique per institution + period |
| order | Int | Unique per institution + period |
| weight | Decimal | Percentage toward annual grade (0–100) |
| startDate | Date? | Optional alignment with calendar |
| endDate | Date? | Optional alignment with calendar |
| isActive | Boolean | Only active terms count toward weight sum |

## API (`/v1/evaluation-terms`)

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/` | SUPER_ADMIN, ADMIN, TEACHER | Paginated (requires institutionId + academicPeriodId) |
| GET | `/:id` | SUPER_ADMIN, ADMIN, TEACHER | Detail |
| POST | `/` | ADMIN | Create term |
| POST | `/reorder` | ADMIN | Reorder terms (query: institutionId, academicPeriodId) |
| PATCH | `/:id` | ADMIN | Update |
| POST | `/:id/deactivate` | ADMIN | Soft deactivate |
| DELETE | `/:id` | ADMIN | Remove |

## Weight validation

Sum of **active** term weights for a given `institutionId` + `academicPeriodId` must equal **100** (±0.01).

Institutions are not required to use three quimesters — any number of terms is valid as long as weights sum correctly.

## Future extensibility

- Optional FK → calendar `AcademicTerm` for automatic date sync
- Snapshot per grade entry when grades module ships
