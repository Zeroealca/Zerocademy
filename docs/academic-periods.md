# Academic Periods

## Overview

The academic periods module is the **calendar foundation** for Zerocademy. It models Ecuador's dual educational regimes and supports multi-year school periods with quimester/term subdivisions.

Grades, attendance, and planning modules will reference `AcademicPeriod` and `AcademicTerm` — they are not implemented in this phase.

## Ecuadorian educational context

Ecuador operates two main academic regimes that coexist nationally:

| Regime | Typical start | Typical end | Example period name |
|--------|---------------|-------------|---------------------|
| `COSTA_GALAPAGOS` | April–May | February–March | 2025-2026 |
| `SIERRA_AMAZONIA` | August–September | June–July | 2025-2026 |

School years span **two calendar years** (e.g. 2025-2026). Institutions in different regions may follow different regimes simultaneously.

## Data model

### AcademicPeriod

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| name | String | Human label (e.g. `2025-2026`) |
| regime | `AcademicRegime` | `COSTA_GALAPAGOS` or `SIERRA_AMAZONIA` |
| startDate | Date | Inclusive period start |
| endDate | Date | Inclusive period end |
| isActive | Boolean | `true` when this is the operational period for its regime |
| status | `AcademicPeriodStatus` | Lifecycle state |
| createdAt, updatedAt | DateTime | Audit |

### AcademicTerm

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| name | String | e.g. `First Quimester` |
| order | Int | Sequence within period (unique per period) |
| startDate, endDate | Date | Must fall within parent period |
| academicPeriodId | UUID | FK → AcademicPeriod (CASCADE delete) |

### Enums

- **AcademicRegime:** `COSTA_GALAPAGOS`, `SIERRA_AMAZONIA`
- **AcademicPeriodStatus:** `PLANNED`, `ACTIVE`, `CLOSED`, `ARCHIVED`

## Business rules

1. **Multiple periods** may exist at once (different regimes or years).
2. **One active period per regime** — activating a period closes other `ACTIVE` periods in the same regime.
3. **No overlapping active periods** — activation fails if date ranges overlap another active period in the same regime.
4. **Date consistency** — `startDate < endDate`; terms must lie within their parent period; terms must not overlap each other.
5. **Active period edits** — core calendar fields cannot be edited while `status = ACTIVE` (deactivate first).
6. **Deletion** — only non-active periods (`PLANNED`, `CLOSED`, `ARCHIVED`) may be deleted.

## API (`/v1/academic-periods`)

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/` | SUPER_ADMIN, ADMIN, TEACHER | Paginated list (filter: regime, status, search) |
| GET | `/active?regime=` | SUPER_ADMIN, ADMIN, TEACHER | Current active period for regime |
| GET | `/:id` | SUPER_ADMIN, ADMIN, TEACHER | Detail with terms |
| POST | `/` | SUPER_ADMIN, ADMIN | Create period (`PLANNED`) |
| PATCH | `/:id` | SUPER_ADMIN, ADMIN | Update period |
| DELETE | `/:id` | SUPER_ADMIN, ADMIN | Delete non-active period |
| POST | `/:id/activate` | SUPER_ADMIN, ADMIN | Activate (closes siblings) |
| POST | `/:id/deactivate` | SUPER_ADMIN, ADMIN | Set `CLOSED` |
| POST | `/:id/archive` | SUPER_ADMIN, ADMIN | Set `ARCHIVED` |

### Terms (`/v1/academic-periods/:periodId/terms`)

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/` | SUPER_ADMIN, ADMIN, TEACHER | List terms |
| POST | `/` | SUPER_ADMIN, ADMIN | Create term |
| PATCH | `/:termId` | SUPER_ADMIN, ADMIN | Update term |
| DELETE | `/:termId` | SUPER_ADMIN, ADMIN | Delete term |

Swagger: `http://localhost:3001/api/docs` → tag `academic-periods`.

## Module structure (backend)

```
BackendZerocademy/src/modules/academic-periods/
├── academic-periods.module.ts
├── academic-periods.controller.ts
├── academic-periods.service.ts
├── academic-terms.controller.ts
├── academic-terms.service.ts
├── academic-period.validation.ts
├── dto/
└── mappers/
```

## Future extensibility

- Link periods to `Institution` for multi-tenant scoping.
- Institution-level regime override (single school, single regime).
- Holiday calendars and non-instructional days.
- Automatic status transitions (cron: close period on `endDate`).
- Grade/attendance FK → `academicPeriodId`, `academicTermId`.

## Related documentation

- [academic-periods-frontend.md](./academic-periods-frontend.md) — UI module
- [database.md](./database.md) — Prisma schema reference
- [backend-architecture.md](./backend-architecture.md) — NestJS layout
