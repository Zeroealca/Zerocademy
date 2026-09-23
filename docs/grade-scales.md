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
| PUT | `/` | ADMIN | Atomically replace the complete band set (preferred) |

## Overlap rules

For a given `gradingSchemeId`:

1. No two scales may overlap on the numeric axis.
2. Every scale must satisfy `minValue <= maxValue`.
3. Scale bounds must fit inside the parent scheme `[minScore, maxScore]`.
4. `code` and `order` are unique per scheme.
5. A saved band set must cover every 0.01 increment from the scheme minimum through its maximum, inclusive. Gaps (including either edge), overlaps, duplicate codes/orders, and bounds with more than two decimal places are rejected with HTTP 400. An empty scheme can be configured via PUT; individual POST/PATCH/DELETE also validate the resulting complete set.

`PUT /v1/grading-schemes/:schemeId/grade-scales` accepts `{ "scales": [{ "code": "NAAR", "description": "...", "minValue": 0, "maxValue": 4, "order": 4 }, ...] }`. It replaces all bands in a database transaction, so a validation or database error leaves the previous set unchanged. Institution ADMIN membership is checked for this route; global templates cannot be edited there.

In the UI, ADMIN opens **Esquemas de calificación → Ver bandas** to add, edit or remove rows, then saves the entire set. TEACHER and SUPER_ADMIN see the bands read-only. A newly created scheme has no bands until its first complete set is saved.

## Ecuador default bands

See [academic-evaluation.md](./academic-evaluation.md#ecuador-default-template).
