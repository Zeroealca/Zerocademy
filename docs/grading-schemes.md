# Grading schemes

## Model: `GradingScheme`

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| institutionId | UUID? | `null` = global template |
| name | String | Display label |
| minScore | Decimal | Inclusive minimum |
| maxScore | Decimal | Inclusive maximum |
| passingScore | Decimal | Must be within [min, max] |
| decimalPlaces | Int | 0–4 |
| isDefault | Boolean | One default per institution scope |
| isActive | Boolean | Operational flag |

## API (`/v1/grading-schemes`)

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/` | SUPER_ADMIN, ADMIN, TEACHER | Paginated list |
| GET | `/:id` | SUPER_ADMIN, ADMIN, TEACHER | Detail with scales |
| POST | `/` | ADMIN | Create institution scheme |
| POST | `/platform/templates` | SUPER_ADMIN | Create global template |
| PATCH | `/:id` | ADMIN | Update scheme |
| POST | `/:id/activate` | ADMIN | Set active |
| POST | `/:id/deactivate` | ADMIN | Deactivate if not linked |
| DELETE | `/:id` | ADMIN | Delete if not referenced |

## Validation

- `minScore < maxScore`
- `passingScore` within range
- `decimalPlaces` between 0 and 4
- Only one `isDefault` per `institutionId` scope

## Historical integrity

Schemes referenced by `InstitutionAcademicConfiguration` cannot be deleted. Deactivation is blocked while referenced. Future grade entries will store a configuration snapshot FK.
