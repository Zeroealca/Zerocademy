# Grade Calculation Engine

## Purpose

The grade calculation engine computes academic performance averages from existing grade entries and institution evaluation configuration. It powers the **Academic Performance** module and is designed for future consumers (report cards, promotions, analytics, ministry exports).

**In scope:** category averages, academic term averages, subject averages, role-scoped performance queries.

**Out of scope:** PDF generation, promotion rules, recovery exams, and ministry reports. The first read-only report-card consumer is documented in [report-cards.md](./report-cards.md).

## Calculation hierarchy

```
Assessment
    ↓  (raw score, normalized to grading scheme scale)
Grade
    ↓  (weighted by assessment.weight within category)
Assessment Category Average
    ↓  (weighted by AssessmentCategory.weight)
Academic Term Average
    ↓  (weighted by EvaluationTerm.weight, mapped by order)
Subject Average
```

## Architecture decision: dynamic calculation

| Approach | Verdict |
|----------|---------|
| **Dynamic (chosen)** | Averages computed on each API request from live grades + configuration |
| Cached | Rejected — requires invalidation on grade/config changes |
| Persisted | Deferred — official/closure-time report cards will introduce snapshot tables when needed |

**Rationale:** Grades and weights change frequently during a period. Dynamic calculation guarantees correctness without migration overhead or cache invalidation complexity. `Grade.gradingSchemeId` already supports future immutable snapshots for transcripts.

## Configuration sources

| Setting | Source |
|---------|--------|
| Score scale (min/max/passing) | `GradingScheme` via `InstitutionAcademicConfiguration` |
| Decimal places | `InstitutionAcademicConfiguration.decimalPlaces` |
| Rounding | `InstitutionAcademicConfiguration.roundingStrategy` |
| Category weights | Active `AssessmentCategory` rows (institution) |
| Term weights | Active `EvaluationTerm` rows matched to `AcademicTerm.order` |

No Ecuador-specific logic is embedded. Ecuador values appear only as optional seed/template data.

### Academic term ↔ evaluation term mapping

`AcademicTerm` (calendar quimesters) has no weight column. Term weights come from `EvaluationTerm` matched by **`order`** within the same `institutionId` + `academicPeriodId`.

If no `EvaluationTerm` exists for an order, the engine falls back to **equal weights** (`100 / termCount`) and logs `WEIGHT_MAPPING_INCONSISTENCY`.

## Weighting strategy

### 1. Score normalization

```
normalizedScore = (grade.score / assessment.maxScore) × gradingScheme.maxScore
```

### 2. Category average

Within `(enrollment, subject, academicTerm, assessmentCategory)`:

- Weighted average of normalized scores using `assessment.weight`
- Categories without grades are excluded; remaining weights are renormalized

### 3. Academic term average

Within `(enrollment, subject, academicTerm)`:

- Weighted average of category averages using `AssessmentCategory.weight`
- Categories without data are excluded

### 4. Subject average

Within `(enrollment, subject, academicPeriod)`:

- Weighted average of academic term averages using mapped `EvaluationTerm.weight`
- Terms without data are excluded
- Final value rounded per institution strategy

## Rounding strategy

Applied at **term**, **category**, and **subject** output boundaries via `RoundingStrategy`:

| Strategy | Behavior |
|----------|----------|
| `ROUND_HALF_UP` | Standard half-up rounding (default) |
| `ROUND_DOWN` | Floor toward −∞ |
| `ROUND_UP` | Ceil toward +∞ |
| `TRUNCATE` | Truncate toward zero |

Decimal precision from `InstitutionAcademicConfiguration.decimalPlaces` (0–4).

## Backend module layout

```
src/modules/academic-performance/
├── academic-performance.module.ts
├── academic-performance.controller.ts
├── academic-performance.service.ts
├── academic-performance.validation.ts
├── grade-calculation/
│   ├── grade-calculation.engine.ts      # Pure calculation functions
│   ├── grade-calculation.config-resolver.ts
│   ├── grade-calculation.data-loader.ts
│   ├── grade-calculation.types.ts
│   └── rounding.util.ts
└── dto/
```

## API (`/v1/academic-performance`)

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/student/subject-averages` | STUDENT | Own subject averages |
| GET | `/student/term-averages` | STUDENT | Own term averages (optional subject/term filters) |
| GET | `/student/summary` | STUDENT | Own performance summary |
| GET | `/teacher/course-averages` | SUPER_ADMIN, ADMIN, TEACHER | Course averages by subject |
| GET | `/teacher/subject-performance` | SUPER_ADMIN, ADMIN, TEACHER | Subject class performance |
| GET | `/teacher/student-performance` | SUPER_ADMIN, ADMIN, TEACHER | Student breakdown (course required for teachers) |
| GET | `/admin/institution-performance` | SUPER_ADMIN, ADMIN | Institution overview |
| GET | `/admin/course-performance` | SUPER_ADMIN, ADMIN | Course overview |
| GET | `/admin/student-performance` | SUPER_ADMIN, ADMIN | Student breakdown |

## RBAC

Services re-check institution, course, assignment, and enrollment scope. Teachers must specify `courseId` for student performance queries. Unauthorized access returns `404` where resource hiding is appropriate.

## Logging

Structured events on `AcademicPerformanceModule`:

| Event | When |
|-------|------|
| `STUDENT_SUBJECT_AVERAGES` | Calculation request (no PII beyond ids) |
| `CALCULATION_CONFIG_INVALID` | Missing/inactive institution config |
| `WEIGHT_MAPPING_INCONSISTENCY` | AcademicTerm order without EvaluationTerm |
| `CALCULATION_CONFIG_INCOMPLETE` | No active assessment categories |

## Performance considerations

- Calculations are per-request; typical class sizes are acceptable without caching
- Grade queries use indexed FK paths (`enrollmentId`, `academicPeriodId`)
- Future optimization: materialized views or snapshot tables for official report cards

## Future extensibility

- **Official report cards:** persist computed averages + config snapshot per period closure
- **Promotions:** consume subject averages + passing rules from configuration
- **Analytics:** aggregate engine output without changing grade schema
- **Ministry exports:** map engine output to external formats via configuration

## Related documentation

- [grades.md](./grades.md)
- [academic-evaluation.md](./academic-evaluation.md)
- [grading-workflow.md](./grading-workflow.md)
- [database.md](./database.md)
