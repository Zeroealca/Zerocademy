# Authentication

## Overview

Zerocademy uses **stateless JWT authentication** with short-lived access tokens and long-lived refresh tokens stored server-side (hashed). Passwords are hashed with **bcrypt** before persistence.

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/v1/auth/login` | Public | Email/password login |
| POST | `/v1/auth/refresh` | Public | Rotate refresh token, issue new pair |
| POST | `/v1/auth/logout` | Bearer | Revoke provided refresh token |
| GET | `/v1/auth/me` | Bearer | Current authenticated user |

OpenAPI documentation: `http://localhost:3001/api/docs` (non-production by default).

## Token model

- **Access token** — JWT signed with `JWT_SECRET`, default TTL `15m`. Sent as `Authorization: Bearer <token>`.
- **Refresh token** — JWT signed with `JWT_REFRESH_SECRET`, default TTL `7d`. Stored in DB as SHA-256 hash for revocation and rotation.

## Login flow

1. Client sends `email` and `password` to `/v1/auth/login`.
2. Service loads user (not soft-deleted), checks `isActive`, verifies bcrypt hash.
3. Service creates a `RefreshToken` row, issues JWT pair, stores refresh hash.
4. Client receives `{ accessToken, refreshToken, user, ...expiresIn }`.

Failed attempts log `LOGIN_FAILED` without exposing whether email or password was wrong (`401 Invalid credentials`).

## Refresh flow

1. Client sends `refreshToken` to `/v1/auth/refresh`.
2. Service verifies JWT signature and loads DB record by `tokenId` + hash + expiry.
3. Previous refresh row is **revoked** (rotation).
4. New token pair is issued.

## Logout flow

1. Authenticated client POSTs `refreshToken` to `/v1/auth/logout`.
2. Matching refresh token row is revoked for that user.

## Guards and decorators

- `JwtAuthGuard` — global; skipped when `@Public()` is set.
- `RolesGuard` — global; enforced when `@Roles(...)` is present.
- `@CurrentUser()` — typed `AuthenticatedUser` from JWT strategy validation.

## Security decisions

- Generic error messages on login failure (no user enumeration).
- Refresh tokens hashed at rest; raw tokens never logged.
- Soft-deleted or inactive users cannot authenticate.
- Logout and soft-delete revoke outstanding refresh tokens.

## Environment variables

See `BackendZerocademy/.env.example`: `JWT_SECRET`, `JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_SECRET`, `JWT_REFRESH_EXPIRES_IN`, `BCRYPT_SALT_ROUNDS`.

## Seed admin user

After migrations:

```bash
npm run prisma:seed -w backend-zerocademy
```

Default: `admin@zerocademy.edu` / `ChangeMe123!` (override via `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`).
