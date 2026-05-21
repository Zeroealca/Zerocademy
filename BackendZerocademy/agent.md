# Backend Agent Guide — Academic Management System

> **Authoritative for:** NestJS, Prisma, JWT, RBAC, DTOs, API responses, persistence.  
> **Monorepo:** domain registry, FE/BE boundary → [`../agent.md`](../agent.md)  
> **Workflows:** [`.cursor/skills/`](../.cursor/skills/README.md) — module generation, CRUD, Prisma, RBAC, logging, docs

**App:** `BackendZerocademy/` · **npm** workspaces from repo root  
**Stack:** NestJS · Prisma · PostgreSQL · JWT · RBAC · Swagger · class-validator

---

## 1. Architecture Principles

| Principle | Rule |
|-----------|------|
| Modular monolith | Bounded feature modules under `src/modules/<domain>/` |
| Clean architecture | Controller → Service → Prisma (no reverse imports from `common/`) |
| API as contract | DTOs + OpenAPI define public shapes; never expose Prisma models |
| Backend owns truth | Grades, eligibility, attendance, permissions enforced here |
| Stateless API | JWT + DB; no in-memory session state |

**Dependency rule:** `modules/*` may use `common/`, `prisma/`, `auth/` — never the reverse. No circular module imports. Cross-domain orchestration via exported services or facades, not controller-to-controller calls.

---

## 2. Layer Responsibilities

| Layer | Allowed | Forbidden |
|-------|---------|-----------|
| **Controller** | HTTP mapping, guards, binding, status codes, Swagger, delegate to service | Prisma, business rules, transactions, `any` |
| **Service** | Business logic, Prisma, transactions, RBAC re-checks, mapping to DTOs | `Request`/`Response`, route decorators |
| **Repository** *(optional)* | Reused Prisma queries only | HTTP, business rules |

**Limits:** Controllers &lt;80 lines per file; split services before ~250–300 lines.

**Scaffolding a new module:** [`backend-module-generator`](../.cursor/skills/backend-module-generator/SKILL.md)

---

## 3. Module Organization

```
src/modules/<domain>/
├── <domain>.module.ts
├── <domain>.controller.ts
├── <domain>.service.ts
├── dto/                    # create-, update-, *-response, list-*-query
├── mappers/                # when mapping is non-trivial
└── constants.ts            # module log context
```

Folder names must match the domain registry in [`../agent.md`](../agent.md).

---

## 4. DTO & Validation

- Global `ValidationPipe`: `whitelist: true`, `forbidNonWhitelisted: true`.
- Separate DTOs: `Create*`, `Update*`, `*Query`, `*Response` — never reuse Prisma models as API bodies.
- `@ApiProperty` / `@ApiPropertyOptional` on every public field (paired with `class-validator`).
- List queries: `page`, `limit` with max cap (e.g. 100).
- Partial updates: `PartialType(CreateDto)` from `@nestjs/swagger`.

---

## 5. Authentication

- JWT access tokens; `AuthModule` owns login, hashing, strategies.
- `@CurrentUser()` typed payload — no raw `request.user` casts.
- Never log or return passwords; rate-limit auth endpoints.

---

## 6. Authorization (RBAC)

- `JwtAuthGuard` + `RolesGuard` on protected routes.
- **Services must re-check** scope before mutations (guards alone are insufficient).
- `RoleUtils.hasRole()` — `SUPER_ADMIN` bypasses role lists unless `@ApiRequireRolesStrict` / `StrictRoles` is set.
- Platform routes: periods, catalog — `SUPER_ADMIN` write. Institution ops: courses, assignments — `ADMIN` strict only.
- Academic period context: `User.selectedAcademicPeriodId`; `GET/PUT /v1/academic-periods/context`.
- One **ACTIVE** period per `AcademicRegime` globally on activation.
- Scope by `institutionId` / effective period; see [`docs/ownership-strategy.md`](../docs/ownership-strategy.md).
- Use `404` instead of `403` when hiding resource existence is required (e.g. super-admin visibility for admins).

### `@ApiRequireRoles` — critical

| Scope | Use |
|-------|-----|
| Same roles for all routes | `@Roles(...)` + `@ApiBearerAuth('access-token')` + 401/403 on **class** |
| Per-route roles | `@ApiRequireRoles(...)` on **method** + `@ApiOperation` |

**Never** `@ApiRequireRoles()` on the controller class — Swagger crashes at bootstrap (`descriptor.value` undefined).

Full RBAC workflow: [`rbac-security-skill`](../.cursor/skills/rbac-security-skill/SKILL.md) · [`docs/rbac.md`](../docs/rbac.md)

---

## 7. Prisma

- Schema: `prisma/schema.prisma` — migrations via `prisma migrate dev`; never edit applied migrations.
- PascalCase models, camelCase fields; explicit `onDelete`; indexes on FKs and filters.
- Paginate lists; explicit `select`/`include`; `$transaction` for multi-table writes.
- Auth on `User` only — academic data on profile tables.

Schema changes: [`prisma-schema-architect`](../.cursor/skills/prisma-schema-architect/SKILL.md)

---

## 8. API Responses

| Operation | Status | Body |
|-----------|--------|------|
| Create | `201` | Resource DTO |
| Read / list | `200` | DTO or `{ data, meta }` |
| Update | `200` | Resource DTO |
| Delete | `204` or `{ deleted: true }` — project-consistent |
| Validation | `400` | `{ statusCode, message, error, details? }` |

- Plural kebab-case routes; ISO 8601 UTC timestamps.
- **Every list endpoint paginated.**
- Map Prisma → response DTO in service/mapper.

CRUD patterns: [`crud-foundation-skill`](../.cursor/skills/crud-foundation-skill/SKILL.md)

---

## 9. Swagger / OpenAPI (mandatory)

- Setup: `src/config/swagger.config.ts` — UI at `/api/docs`.
- Every handler: `@ApiTags`, `@ApiOperation`, success + error responses, bearer auth when protected.
- Document DTOs only — not Prisma models.
- Update Swagger in the **same change** as API changes.

Detailed decorator checklist lives in skills; verify at `/api/docs` before marking done.

---

## 10. Logging & Errors

- Use `AppLoggerService` with `context` + `metadata` for ids.
- Nest HTTP exceptions: `NotFoundException`, `BadRequestException`, `ForbiddenException`, `ConflictException`.
- Map Prisma `P2002` → `409`, `P2025` → `404`.
- Never log passwords, tokens, or full PII.

Details: [`logging-error-handling-skill`](../.cursor/skills/logging-error-handling-skill/SKILL.md)

---

## 11. Naming Conventions

| Item | Convention | Example |
|------|------------|---------|
| Module folders | kebab-case | `academic-periods/` |
| Files | kebab-case | `students.service.ts` |
| Classes / DTOs | PascalCase | `StudentsService`, `CreateStudentDto` |
| Methods | camelCase | `findByInstitution` |
| Prisma models | PascalCase | `Student` |
| Env vars | SCREAMING_SNAKE | `DATABASE_URL` |

---

## 12. Security

- Validate all inputs; RBAC on mutations and sensitive reads.
- Secrets in environment variables only.
- CORS allowlist, Helmet, body size limits.
- Audit trail for grade changes, role assignments, bulk exports, period closures.

---

## 13. Code Quality

- `strict` TypeScript; **`any` forbidden**.
- Dependency injection only; explicit return types on public service methods.
- Unit-test pure domain logic; integration-test critical flows.
- Minimal diffs — no drive-by refactors.

**Commits:** [`commit-message-skill`](../.cursor/skills/commit-message-skill/SKILL.md) — use `type[Backend]: message`.

**Pre-submit review:** [`architecture-review-skill`](../.cursor/skills/architecture-review-skill/SKILL.md)

---

## 14. Anti-Patterns

| Avoid | Do instead |
|-------|------------|
| `@ApiRequireRoles` on controller class | `@Roles` on class or `@ApiRequireRoles` per method |
| Undocumented endpoints | Full Swagger per handler |
| Fat controllers / Prisma in controllers | Thin controller → service |
| Returning Prisma models | Response DTOs |
| Unbounded `findMany` | Pagination + `take` |
| `404` when policy denies (unless hiding existence) | `403` or `404` per policy |
| `console.log` in production | `AppLoggerService` |
| Sibling module deep imports | Exported services or `common/` kernel |

---

## Commands

See monorepo [`README.md`](../README.md). Swagger: `http://localhost:3001/api/docs` when server is running.

```bash
npm run dev:backend
npx prisma migrate dev -w backend-zerocademy
npm run build -w backend-zerocademy
```

---

## Out of Scope

- Frontend implementation → `FrontendZerocademy/agent.md`
- Docker / domain registry → `../agent.md`
- Replacing Prisma or auth strategy without approval
- Committing `.env` or secrets
