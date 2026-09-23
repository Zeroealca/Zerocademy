# Academic evaluation configuration

## Purpose

The academic evaluation module is the **configurable grading engine foundation** for Zerocademy. It stores institution-owned rules for:

- Numeric grading ranges and passing scores
- Qualitative equivalency bands (grade scales)
- Weighted evaluation terms per academic period
- Assessment category composition
- Institution-level active configuration (rounding, decimals, active scheme)

Future modules (**Report cards**, **Promotions**, **Reports**, Ministry exports) must **read** this configuration — they must not hardcode Ecuadorian rules.

The **Grade Calculation Engine** (`academic-performance` module) already consumes this configuration for weighted averages — see [grade-calculation-engine.md](./grade-calculation-engine.md).

Ecuador is provided as an **optional default template** (seed + initialization endpoints), not as application logic.

## Architecture

```
Institution
 ├── GradingScheme (1..n, institution or global template)
 │    └── GradeScale (qualitative bands, non-overlapping)
 ├── EvaluationTerm (per academic period, weighted)
 ├── AssessmentCategory (institution-wide weights)
 └── InstitutionAcademicConfiguration (1:1 active snapshot)
```

### Naming note: calendar vs evaluation terms

| Model | Table | Purpose |
|-------|-------|---------|
| `AcademicTerm` | `academic_terms` | Calendar quimesters inside `AcademicPeriod` |
| `EvaluationTerm` | `evaluation_terms` | Grading periods with **weights** for grade calculation |

Both can coexist; linking calendar terms to evaluation terms is a future enhancement.

## Ecuador default template

| Setting | Value |
|---------|-------|
| Scale | 0 – 10 |
| Passing score | 7 |
| Decimal places | 2 |

| Code | Range | Description |
|------|-------|-------------|
| DAR | 9.00 – 10.00 | Dominates the required learning outcomes |
| AAR | 7.00 – 8.99 | Achieves the required learning outcomes |
| PAAR | 4.01 – 6.99 | Close to achieving the required learning outcomes |
| NAAR | 0.00 – 4.00 | Does not achieve the required learning outcomes |

Initialized via:

- Seed: `npm run prisma:seed -w backend-zerocademy` (catalog `ecuador`)
- API: `POST /v1/academic-evaluation/initialize-ecuador-defaults` (global template)
- API: `POST /v1/institutions/:id/academic-evaluation/initialize-ecuador` (institution copy + config)

## Business rules

1. Institutions may define multiple grading schemes; one may be marked `isDefault`.
2. Grade scale ranges must not overlap, must fit inside the parent scheme range, and a configured set must cover the entire range without gaps at 0.01 precision. The full set is saved atomically via `PUT /v1/grading-schemes/:schemeId/grade-scales`.
3. Active evaluation term weights per period must sum to **100** (±0.01 tolerance).
4. Active assessment category weights per institution must sum to **100** (±0.01 tolerance).
5. Historical configurations are preserved — schemes linked to `InstitutionAcademicConfiguration` cannot be deleted; deactivation is blocked while referenced.
6. Future grade records will snapshot configuration at entry time (grades module).

## RBAC

| Role | Access |
|------|--------|
| `SUPER_ADMIN` | Read all; initialize global Ecuador template |
| `ADMIN` | Full institution CRUD (strict) |
| `TEACHER` | Read-only |
| `STUDENT` | No access |

## API overview

| Tag | Base path |
|-----|-----------|
| `grading-schemes` | `/v1/grading-schemes` |
| `grade-scales` | `/v1/grading-schemes/:schemeId/grade-scales` |
| `evaluation-terms` | `/v1/evaluation-terms` |
| `assessment-categories` | `/v1/assessment-categories` |
| `institution-academic-configuration` | `/v1/institutions/:id/academic-evaluation/*` |
| `academic-evaluation` | `/v1/academic-evaluation/initialize-ecuador-defaults` |

OpenAPI: `http://localhost:3001/api/docs`

## Frontend routes

| Route | Description |
|-------|-------------|
| `/academic-evaluation` | Dashboard + preview |
| `/academic-evaluation/grading-schemes` | Scheme management |
| `/academic-evaluation/evaluation-terms` | Weighted terms + reorder |
| `/academic-evaluation/assessment-categories` | Category weights |
| `/academic-evaluation/configuration` | Institution active config |

UI copy is **Spanish**; API/docs remain **English**.

## Logging

Structured events on `AcademicEvaluationModule`:

- `GRADING_SCHEME_*`, `GRADE_SCALE_*`, `EVALUATION_TERM_*`, `ASSESSMENT_CATEGORY_*`
- `INSTITUTION_CONFIG_UPSERTED`, `ECUADOR_TEMPLATE_*`, `ECUADOR_INSTITUTION_SCHEME_CREATED`
- Validation failures surface as `400` with descriptive messages (also logged at service level when applicable)

## Related documentation

- [grading-schemes.md](./grading-schemes.md)
- [academic-terms.md](./academic-terms.md) — evaluation terms (`EvaluationTerm`)
- [assessment-categories.md](./assessment-categories.md)
- [grade-scales.md](./grade-scales.md)
- [database.md](./database.md)
- [academic-periods.md](./academic-periods.md)
