# Authentication

## Overview

Zerocademy uses **stateless JWT authentication** with short-lived access tokens and long-lived refresh tokens stored server-side (hashed). Passwords are hashed with **bcrypt** before persistence.

Authorization is layered on top via **RBAC** — see [rbac.md](./rbac.md).

## Endpoints

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| POST | `/v1/auth/login` | Public | — | Email/password login |
| POST | `/v1/auth/refresh` | Public | — | Rotate refresh token, issue new pair |
| POST | `/v1/auth/logout` | Bearer | Any authenticated | Revoke provided refresh token |
| GET | `/v1/auth/me` | Bearer | Any authenticated | Current user + profile linkage |

OpenAPI documentation: `http://localhost:3001/api/docs` (non-production by default).

## Token model

- **Access token** — JWT signed with `JWT_SECRET`, default TTL `15m`. Sent as `Authorization: Bearer <token>`.
- **Refresh token** — JWT signed with `JWT_REFRESH_SECRET`, default TTL `7d`. Stored in DB as SHA-256 hash for revocation and rotation.

### Access token payload

| Claim | Description |
|-------|-------------|
| `sub` | User UUID |
| `email` | User email |
| `role` | System role (`Role` enum) |
| `profileId` | Academic profile UUID (when applicable) |
| `profileType` | `student` \| `teacher` \| `representative` |
| `institutionId` | Institution scope (optional) |

## Login flow

1. Client sends `email` and `password` to `/v1/auth/login`.
2. Service loads user with profiles (not soft-deleted), checks `isActive`, verifies bcrypt hash.
3. Service resolves profile linkage for JWT claims.
4. Service creates a `RefreshToken` row, issues JWT pair, stores refresh hash.
5. Client receives `{ accessToken, refreshToken, user, ...expiresIn }`.

Failed attempts log `LOGIN_FAILED` without exposing whether email or password was wrong (`401 Invalid credentials`). The login UI shows a generic Spanish message (`Correo o contraseña incorrectos`) and does not echo the English API text.

## Refresh flow

1. Client sends `refreshToken` to `/v1/auth/refresh`.
2. Service verifies JWT signature and loads DB record by `tokenId` + hash + expiry.
3. Previous refresh row is **revoked** (rotation).
4. New token pair is issued with current profile linkage from DB.

## Logout flow

1. Authenticated client POSTs `refreshToken` to `/v1/auth/logout`.
2. Matching refresh token row is revoked for that user.

## Guards and decorators

| Component | Responsibility |
|-----------|----------------|
| `JwtAuthGuard` | Global; skipped when `@Public()` is set |
| `RolesGuard` | Global; enforced when `@Roles()` or `@ApiRequireRoles()` metadata is present |
| `@CurrentUser()` | Typed `AuthenticatedUser` from JWT strategy |
| `@ApiRequireRoles(...)` | Combines `@Roles()`, `@ApiBearerAuth`, and Swagger role documentation |

`RoleUtils.hasRole()` centralizes checks; `SUPER_ADMIN` bypasses role lists on protected routes.

## Security decisions

- Generic error messages on login failure (no user enumeration).
- Refresh tokens hashed at rest; raw tokens never logged.
- Soft-deleted or inactive users cannot authenticate.
- Logout and soft-delete revoke outstanding refresh tokens.
- JWT carries role for convenience; authoritative role is reloaded from DB per request.

## Environment variables

See `BackendZerocademy/.env.example`: `JWT_SECRET`, `JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_SECRET`, `JWT_REFRESH_EXPIRES_IN`, `BCRYPT_SALT_ROUNDS`.

## Seed admin user

After migrations:

```bash
npm run prisma:seed -w backend-zerocademy
```

Default: `admin@zerocademy.edu` / `ChangeMe123!` (override via `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`).

## Related documentation

- [rbac.md](./rbac.md) — roles, profiles, ownership strategy
- [database.md](./database.md) — Prisma schema
