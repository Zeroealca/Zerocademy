# API flows

## Authenticated request

```mermaid
sequenceDiagram
  participant Client
  participant API as NestJS API
  participant Guard as JwtAuthGuard
  participant Strategy as JwtStrategy
  participant DB as PostgreSQL

  Client->>API: GET /v1/auth/me (Bearer accessToken)
  API->>Guard: canActivate?
  Guard->>Strategy: validate JWT payload
  Strategy->>DB: find active user by sub
  DB-->>Strategy: user row
  Strategy-->>API: AuthenticatedUser on request
  API->>API: AuthService.getCurrentUser
  API-->>Client: 200 AuthUserResponseDto
```

## Login

```mermaid
sequenceDiagram
  participant Client
  participant Auth as AuthController
  participant Svc as AuthService
  participant DB as PostgreSQL

  Client->>Auth: POST /v1/auth/login
  Auth->>Svc: login(dto)
  Svc->>DB: find user by email
  Svc->>Svc: bcrypt.compare
  Svc->>DB: create RefreshToken + update hash
  Svc-->>Auth: tokens + user DTO
  Auth-->>Client: 200 AuthTokensResponseDto
```

## Refresh token rotation

```mermaid
sequenceDiagram
  participant Client
  participant Svc as AuthService
  participant DB as PostgreSQL

  Client->>Svc: POST /v1/auth/refresh
  Svc->>Svc: verify JWT + hash lookup
  Svc->>DB: revoke old refresh row
  Svc->>DB: create new refresh row + tokens
  Svc-->>Client: new access + refresh tokens
```

## Create user (admin)

```mermaid
sequenceDiagram
  participant Admin
  participant API as UsersController
  participant Svc as UsersService
  participant DB as PostgreSQL

  Admin->>API: POST /v1/users (Bearer, ADMIN+)
  API->>Svc: create(dto)
  Svc->>Svc: bcrypt.hash password
  Svc->>DB: user.create
  Svc-->>API: UserResponseDto
  API-->>Admin: 201
```

## Error envelope

All HTTP errors use:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "details": [{ "field": "email", "message": "email must be an email" }]
}
```

Prisma `P2002` → `409 Conflict`; `P2025` → `404 Not Found` (handled in services where applicable).
