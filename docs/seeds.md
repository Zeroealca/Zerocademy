# Database seeds

## Overview

Seeds bootstrap development and reference data for Zerocademy. They are **idempotent**: safe to rerun; existing system catalog rows are updated or skipped, not duplicated.

Entry point: `BackendZerocademy/prisma/seed.ts`

## Structure

```
prisma/
├── seed.ts
└── seeds/
    ├── index.ts                    # runCatalogSeeds()
    ├── run-curriculum.ts           # curriculum-only CLI
    ├── types.ts
    ├── seed-logger.ts              # structured JSON logs
    ├── seed-summary.ts
    ├── academic-levels.seed.ts
    ├── grade-levels.seed.ts
    ├── subjects.seed.ts
    ├── subject-assignments.seed.ts
    └── curriculum/
        ├── ecuador.data.ts         # Spanish catalog data
        └── ecuador-curriculum.seed.ts
```

## What gets seeded

| Step | Content |
|------|---------|
| Admin user | `SUPER_ADMIN` (if missing) |
| Ecuador catalog | Levels, grades, subjects, `SubjectGradeLevel` links |

Curriculum display names remain **Spanish**; logs and code comments are **English**.

## Commands

From repository root:

```bash
npm run prisma:seed -w backend-zerocademy
npm run prisma:seed:curriculum -w backend-zerocademy
npm run prisma:seed:dry-run -w backend-zerocademy
```

From `BackendZerocademy/`:

```bash
npx prisma db seed
npm run prisma:seed:curriculum
SEED_DRY_RUN=true npm run prisma:seed
```

Docker (stack running):

```bash
docker compose exec backend npm run prisma:seed
```

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SEED_ADMIN_EMAIL` | `admin@zerocademy.edu` | Bootstrap admin |
| `SEED_ADMIN_PASSWORD` | `ChangeMe123!` | Bootstrap password |
| `SEED_CATALOGS` | `ecuador` | Comma-separated catalog keys |
| `SEED_SKIP_CATALOG` | — | `true` skips curriculum seeds |
| `SEED_DRY_RUN` | — | `true` logs without writes |

## Execution flow

1. `seed.ts` loads environment and connects Prisma.
2. `seedAdminUser()` — skip if email exists.
3. `runCatalogSeeds()` — for each catalog key (default `ecuador`):
   - Single **transaction** per catalog
   - Academic levels → grade levels → subjects → subject–grade links
4. Structured **summary** log (`SEED_RUN_SUMMARY`).

## Idempotency

| Entity | Key |
|--------|-----|
| Academic level | `code` + `institutionId: null` |
| Grade level | `academicLevelId` + `code` |
| Subject | `code` (global unique) |
| Subject–grade link | `subjectId` + `gradeLevelId` |

Skipped links are logged as `SUBJECT_ASSIGNMENT_SKIPPED`.

## Logging

JSON lines to stdout, e.g.:

```json
{"context":"PrismaSeed","event":"SUBJECT_INSERTED","message":"Subject catalog row inserted","metadata":{"subjectId":"…","code":"MATEMATICA","catalogKey":"ecuador"}}
```

Events include: `*_INSERTED`, `*_UPDATED`, `*_SKIPPED`, `WARN_*`, `SEED_RUN_FAILED`.

No passwords or tokens are logged.

## Legacy catalog note

Earlier development seeds used abbreviated grade names (e.g. `8vo EGB`) and level code `BACH`. The Ecuador catalog uses official Spanish names and code `BGU`. Rerun seeds to upsert new rows; deactivate obsolete system rows manually if needed.

## Adding a new country

1. Add `prisma/seeds/curriculum/<country>.data.ts` (Spanish or local language names in data only).
2. Add `<country>-curriculum.seed.ts` orchestrator.
3. Register key in `seeds/index.ts` `runCatalogSeeds()`.
4. Document in [curriculum.md](./curriculum.md).

## Related

- [curriculum.md](./curriculum.md)
- [database.md](./database.md)
- [academic-structure.md](./academic-structure.md)
