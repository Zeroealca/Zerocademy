# Database

## Stack

- **PostgreSQL** 16 (Docker service `postgres`)
- **Prisma** ORM — schema at `BackendZerocademy/prisma/schema.prisma`

## Models

### User (authentication account)

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| email | String | Unique |
| passwordHash | String | bcrypt |
| firstName, lastName | String | Display name |
| role | Enum | `SUPER_ADMIN`, `ADMIN`, `TEACHER`, `STUDENT`, `REPRESENTATIVE` |
| isActive | Boolean | Login gate |
| deletedAt | DateTime? | Soft delete |
| createdAt, updatedAt | DateTime | Timestamps |

Relations: optional 1:1 `StudentProfile`, `TeacherProfile`, `RepresentativeProfile`.

Indexes: `role`, `isActive`, `deletedAt`.

### Academic profiles

Separated from `User` so authentication stays lean and domain models can evolve independently.

| Model | Linked role | Notes |
|-------|-------------|-------|
| `StudentProfile` | `STUDENT` | 1:1 with `User`, optional `institutionId` |
| `TeacherProfile` | `TEACHER` | 1:1 with `User`, optional `institutionId` |
| `RepresentativeProfile` | `REPRESENTATIVE` | 1:1 with `User`, optional `institutionId` |

Profiles are auto-provisioned when an admin creates a user with an academic role.

### Institution

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| name | String | Display name |
| slug | String | Unique identifier |
| isActive | Boolean | Tenant gate (future) |

Future multi-tenant modules will scope queries by `institutionId` on profiles.

### RefreshToken

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Embedded in refresh JWT as `tokenId` |
| userId | UUID | FK → User (CASCADE delete) |
| tokenHash | String | SHA-256 of refresh JWT |
| expiresAt | DateTime | Server-side expiry |
| revokedAt | DateTime? | Logout / rotation |
| createdAt | DateTime | Audit |

### AcademicPeriod

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| name | String | e.g. `2025-2026` |
| regime | Enum | `COSTA_GALAPAGOS`, `SIERRA_AMAZONIA` |
| startDate, endDate | Date | Inclusive school-year range |
| isActive | Boolean | Operational flag per regime |
| status | Enum | `PLANNED`, `ACTIVE`, `CLOSED`, `ARCHIVED` |
| createdAt, updatedAt | DateTime | Audit |

Relations: one-to-many `AcademicTerm`.

### AcademicTerm

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| name | String | e.g. `First Quimester` |
| order | Int | Unique per period |
| startDate, endDate | Date | Within parent period |
| academicPeriodId | UUID | FK → AcademicPeriod (CASCADE) |

### HealthCheck

Bootstrap table for infrastructure health probes.

## Migrations

```bash
# Development
npx prisma migrate dev -w backend-zerocademy

# Docker / production-style
npm run docker:prisma:migrate
```

Migrations live in `BackendZerocademy/prisma/migrations/`:

| Migration | Purpose |
|-----------|---------|
| `20250516120000_init` | Health check bootstrap |
| `20250517120000_auth_users` | Users, refresh tokens, initial roles |
| `20250517140000_rbac_profiles` | `REPRESENTATIVE` role, institutions, academic profiles |
| `20250517160000_academic_periods` | Academic periods and terms (Ecuador regimes) |

Never edit applied migration SQL retroactively.

## Seeding

```bash
npm run prisma:seed -w backend-zerocademy
```

Creates a `SUPER_ADMIN` if none exists (see `prisma/seed.ts`). Super admins do not require an academic profile.

## Design decisions

- **Single role per user** — stored as Prisma enum on `User.role`; extend with join table when multi-role is required.
- **Profile separation** — academic data never mixed into `User` columns.
- **Soft delete** — `deletedAt` on users; queries filter `deletedAt: null`.
- **Refresh token persistence** — enables logout and rotation without server sessions.
- **Institution-ready** — optional FK on profiles for future multi-tenant filtering.

## Connection

`DATABASE_URL` in `.env` (root for Docker, `BackendZerocademy/.env` for local API-only dev).

## Related documentation

- [academic-periods.md](./academic-periods.md) — calendar module
- [rbac.md](./rbac.md) — authorization and profile strategy
- [auth.md](./auth.md) — JWT flows
