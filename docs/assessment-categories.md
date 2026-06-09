# Assessment categories

## Model: `AssessmentCategory`

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| institutionId | UUID | FK → Institution |
| name | String | Unique per institution |
| weight | Decimal | Share of term/annual grade (0–100) |
| description | String? | Optional label for UI |
| isActive | Boolean | Only active categories count in weight sum |

## API (`/v1/assessment-categories`)

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/` | SUPER_ADMIN, ADMIN, TEACHER | Paginated (requires institutionId) |
| GET | `/:id` | SUPER_ADMIN, ADMIN, TEACHER | Detail |
| POST | `/` | ADMIN | Create |
| PATCH | `/:id` | ADMIN | Update |
| POST | `/:id/deactivate` | ADMIN | Deactivate |
| DELETE | `/:id` | ADMIN | Delete |

## Examples (institution-defined)

| Category | Typical weight |
|----------|----------------|
| Exams | 40% |
| Classwork | 30% |
| Projects | 30% |

Weights are **not** hardcoded — institutions configure their own categories.

## Validation

- Name unique per institution
- Each weight > 0 and ≤ 100
- Sum of active category weights = 100 (±0.01)
