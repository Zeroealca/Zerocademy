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
├── common/
│   ├── guards/             # JwtAuthGuard, RolesGuard
│   ├── decorators/         # @Public, @Roles, @CurrentUser, @ApiRequireRoles
│   ├── rbac/               # Role constants, utils, profile provisioning
│   └── ...                 # filters, logger, shared DTOs
└── modules/
    ├── auth/
    ├── users/
    ├── rbac/
    ├── academic-periods/
    ├── academic-levels/
    ├── grade-levels/
    ├── courses/
    ├── subjects/
    ├── teacher-assignments/
    ├── students/
    ├── enrollments/
    ├── institutions/
    ├── institution-memberships/
    └── academic-period-transitions/
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
| `RbacModule` (kernel) | Profile provisioning service (global) |
| `LoggerModule` | JSON structured logging (`AppLoggerService`) |
| `HttpExceptionFilter` | Consistent `{ statusCode, message, error, details? }` |
| `ValidationPipe` | DTO whitelist, transform |
| `JwtAuthGuard` | JWT validation (global) |
| `RolesGuard` | Role metadata enforcement via `RoleUtils` (global) |

## Request lifecycle

1. HTTP request hits Nest adapter.
2. Global `ValidationPipe` validates DTOs.
3. `JwtAuthGuard` — skip if `@Public()`, else Passport JWT strategy loads user and profiles from DB.
4. `RolesGuard` — if `@Roles()` / `@ApiRequireRoles()` set, evaluate via `RoleUtils.hasRole()` (`SUPER_ADMIN` bypass).
5. Controller delegates to service.
6. Service applies business rules, Prisma queries, maps to response DTOs.
7. `HttpExceptionFilter` formats errors; 5xx logged as structured JSON.

## RBAC integration

- Roles defined as Prisma `Role` enum — single role per user.
- `@ApiRequireRoles()` on controllers documents required roles in Swagger.
- Academic profiles provisioned on user create for `STUDENT`, `TEACHER`, `REPRESENTATIVE`.
- JWT embeds `profileId`, `profileType`, `institutionId` for ownership-ready domain modules.

See [rbac.md](./rbac.md) for role responsibilities and future permission expansion.

## API versioning

- Global prefix: `/v1` (health excluded: `/health`, `/`).
- Swagger UI: `/api/docs`.

## Scalability notes

- Stateless handlers (JWT + DB refresh store).
- Paginated list endpoints (`PaginationQueryDto`, `buildPaginationMeta`).
- Explicit Prisma `select` on reads.
- Soft-delete ready via `deletedAt`.
- Ownership query types prepared in `common/rbac/ownership.types.ts`.

## Related docs

- [institutions.md](./institutions.md) — educational institutions foundation
- [memberships.md](./memberships.md) — institution memberships
- [academic-transitions.md](./academic-transitions.md) — period transitions
- [tenancy-strategy.md](./tenancy-strategy.md) — multi-institution roadmap
- [academic-periods.md](./academic-periods.md) — calendar foundation
- [rbac.md](./rbac.md) — roles, guards, profiles
- [auth.md](./auth.md) — JWT and session flows
- [database.md](./database.md) — Prisma schema
- [api-flow.md](./api-flow.md) — End-to-end sequences
