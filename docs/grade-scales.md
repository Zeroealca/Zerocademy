# Grade scales (qualitative equivalencies)

## Model: `GradeScale`

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| gradingSchemeId | UUID | FK → GradingScheme |
| code | String | Short label (e.g. DAR, AAR) |
| description | String | Full outcome description |
| minValue | Decimal | Inclusive lower bound |
| maxValue | Decimal | Inclusive upper bound |
| order | Int | Display order |

## API (`/v1/grading-schemes/:schemeId/grade-scales`)

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/` | SUPER_ADMIN, ADMIN, TEACHER | List scales |
| POST | `/` | ADMIN | Create |
| PATCH | `/:scaleId` | ADMIN | Update |
| DELETE | `/:scaleId` | ADMIN | Delete |

## Overlap rules

For a given `gradingSchemeId`:

1. No two scales may overlap on the numeric axis.
2. Every scale must satisfy `minValue <= maxValue`.
3. Scale bounds must fit inside the parent scheme `[minScore, maxScore]`.
4. `code` and `order` are unique per scheme.

## Ecuador default bands

See [academic-evaluation.md](./academic-evaluation.md#ecuador-default-template).
