# Database

## Stack

- **PostgreSQL** 16 (Docker service `postgres`)
- **Prisma** ORM — schema at `BackendZerocademy/prisma/schema.prisma`

## Models (foundation)

### User

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| email | String | Unique |
| passwordHash | String | bcrypt |
| firstName, lastName | String | Profile |
| role | Enum | SUPER_ADMIN, ADMIN, TEACHER, STUDENT |
| isActive | Boolean | Login gate |
| deletedAt | DateTime? | Soft delete |
| createdAt, updatedAt | DateTime | Timestamps |

Indexes: `role`, `isActive`, `deletedAt`.

### RefreshToken

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Embedded in refresh JWT as `tokenId` |
| userId | UUID | FK → User (CASCADE delete) |
| tokenHash | String | SHA-256 of refresh JWT |
| expiresAt | DateTime | Server-side expiry |
| revokedAt | DateTime? | Logout / rotation |
| createdAt | DateTime | Audit |

### HealthCheck

Bootstrap table for infrastructure health probes.

## Migrations

```bash
# Development
npx prisma migrate dev -w backend-zerocademy

# Docker / production-style
npm run docker:prisma:migrate
```

Migrations live in `BackendZerocademy/prisma/migrations/`. Never edit applied migration SQL retroactively.

## Seeding

```bash
npm run prisma:seed -w backend-zerocademy
```

Creates a `SUPER_ADMIN` if none exists (see `prisma/seed.ts`).

## Design decisions

- **Single role per user** — simple foundation; extend with join table when multi-role is required.
- **Soft delete** — `deletedAt` on users; queries filter `deletedAt: null`.
- **Refresh token persistence** — enables logout and rotation without server sessions.

## Connection

`DATABASE_URL` in `.env` (root for Docker, `BackendZerocademy/.env` for local API-only dev).
