# Tenancy and multi-institution strategy

## Current state (institution-aware, not full multi-tenant)

Zerocademy uses a **single PostgreSQL database** and a **modular monolith**. Institution scope is modeled with optional `institutionId` foreign keys—not separate tenants, schemas, or databases.

```
Institution (root)
 ├── InstitutionMembership → User (ADMIN / TEACHER)
 ├── activeAcademicPeriodId → AcademicPeriod
 ├── User profiles (Student, Teacher, Representative)
 ├── AcademicPeriod → AcademicTerm
 ├── AcademicLevel → GradeLevel
 ├── Course (per period + grade)
 ├── Subject (global or institution catalog)
 └── TeacherAssignment
```

## What we implement now

| Capability | Status |
|------------|--------|
| Multiple institutions in one database | Yes |
| Institution branding and settings | Yes |
| Institution-owned academic periods | Yes (`institutionId` on `AcademicPeriod`) |
| Institution-scoped courses and assignments | Yes (denormalized `institutionId`) |
| Institution-specific subjects | Yes (scoped unique `code`) |
| Institution memberships (admin/teacher) | Yes |
| Academic period transitions | Yes (audit + copy options) |
| One active period per institution | Yes (`activeAcademicPeriodId`) |
| Global system catalog (`institutionId` null) | Yes (seeds, `isSystem`) |
| Row-level security per JWT institution | Planned |
| Separate DB per institution | **Out of scope** |
| Schema-per-tenant | **Out of scope** |

## Authorization evolution

Today:

- **SUPER_ADMIN** — platform-wide institution CRUD and activation
- **ADMIN** — read institutions; update settings and branding
- **TEACHER** — no institution admin UI (academic modules unchanged)

Next steps (without new infrastructure):

1. Bind `ADMIN` mutations to `user.institutionId` from profile.
2. Filter list/detail queries by institution for non–super-admin roles.
3. Return `404` instead of `403` when hiding cross-institution resources (per backend agent guide).

## Data isolation principles

1. **Explicit ownership** — prefer `institutionId` on domain tables over inferring only from joins.
2. **Nullable during migration** — legacy rows may have `institutionId` null until backfilled.
3. **Active institution gate** — creating period-scoped data validates the parent institution is active.
4. **No Ecuador-only enums in application code** — region/regime enums are reference data; institutions in other countries can extend via configuration later.

## Scalability decisions

| Decision | Rationale |
|----------|-----------|
| Shared DB | Simpler ops, joins for reporting, fits modular monolith |
| Optional FKs | Gradual adoption; global catalog unchanged |
| Partial unique indexes on `Subject.code` | Global vs per-institution codes without collision |
| Denormalized `institutionId` on `Course`, `TeacherAssignment` | Faster filters; set from parent period/course on write |
| No tenant middleware yet | Avoid premature complexity; API remains testable |

## Future extensibility

When true multi-institution operations are required:

1. Add request-scoped `InstitutionContext` from JWT + profile.
2. Apply Prisma middleware or service-layer `where` helpers (`forInstitution(institutionId)`).
3. Optional: institution configuration JSON table for feature flags and integrations.
4. Optional: subdomain or header-based institution resolution for white-label UI.

Do **not** fork databases until compliance or scale explicitly requires it.

## Related

- [institutions.md](./institutions.md) — module API and rules
- [architecture.md](./architecture.md) — monorepo overview
- [database.md](./database.md) — schema reference
