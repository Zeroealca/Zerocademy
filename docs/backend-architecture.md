# Backend architecture

## Principles

- **Modular monolith** — one NestJS app, bounded feature modules.
- **Clean architecture** — Controller → Service → Prisma (no Prisma in controllers).
- **Domain-oriented** — `src/modules/<domain>/` aligned with the monorepo domain registry.
- **API as contract** — DTOs + Swagger; Prisma models are internal.

## Layer structure

```
BackendZerocademy/src/
├── main.ts                 # Bootstrap, CORS, global prefix, pipes, Swagger
├── app.module.ts           # Root module, global guards/filters
├── config/                 # Env validation (Joi), typed configuration
├── prisma/                 # PrismaModule (global)
├── common/                 # Cross-cutting: guards, filters, logger, shared DTOs
└── modules/
    ├── auth/
    └── users/
```

## Dependency rules

- `modules/*` may import `common/`, `config/`, `prisma/`.
- `common/` must not import feature modules (except typed auth user for decorators).
- No circular imports between sibling modules.

## Global infrastructure

| Component | Responsibility |
|-----------|----------------|
| `AppConfigModule` | Validated environment via Joi |
| `PrismaModule` | Database access |
| `LoggerModule` | JSON structured logging (`AppLoggerService`) |
| `HttpExceptionFilter` | Consistent `{ statusCode, message, error, details? }` |
| `ValidationPipe` | DTO whitelist, transform |
| `JwtAuthGuard` | JWT validation (global) |
| `RolesGuard` | Role metadata enforcement (global) |

## Request lifecycle

1. HTTP request hits Nest adapter.
2. Global `ValidationPipe` validates DTOs.
3. `JwtAuthGuard` — skip if `@Public()`, else Passport JWT strategy loads user from DB.
4. `RolesGuard` — if `@Roles()` set, compare with `request.user.role`.
5. Controller delegates to service.
6. Service applies business rules, Prisma queries, maps to response DTOs.
7. `HttpExceptionFilter` formats errors; 5xx logged as structured JSON.

## API versioning

- Global prefix: `/v1` (health excluded: `/health`, `/`).
- Swagger UI: `/api/docs`.

## Scalability notes

- Stateless handlers (JWT + DB refresh store).
- Paginated list endpoints (`PaginationQueryDto`, `buildPaginationMeta`).
- Explicit Prisma `select` on reads.
- Soft-delete ready via `deletedAt`.

## Related docs

- [auth.md](./auth.md) — JWT and session flows
- [database.md](./database.md) — Prisma schema
- [api-flow.md](./api-flow.md) — End-to-end sequences
