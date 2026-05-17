# Backend Agent Guide — Academic Management System

> **Authoritative for:** NestJS, Prisma, JWT, RBAC, DTOs, API responses, and persistence.  
> **Monorepo:** domain registry, FE/BE boundary, shared API contract → [`../agent.md`](../agent.md)

**App:** `BackendZerocademy/` · **Package manager:** `npm` workspaces (from repo root)  
**Role:** Business rules, authorization, persistence, and API contracts. The frontend never enforces domain logic.

**Stack:** NestJS · Prisma · PostgreSQL · JWT · RBAC · `@nestjs/swagger` · class-validator · class-transformer

---

## 1. Backend Architecture Principles

| Principle | Rule |
|-----------|------|
| Modular monolith | One deployable app; bounded feature modules with explicit imports |
| Feature-based | Code organized by academic domain under `src/modules/<domain>/` |
| Domain-oriented | Module names match business capabilities, not technical layers |
| Clean architecture | Dependencies point inward: Controller → Service → Prisma (data) |
| Separation of concerns | Each class has one reason to change |
| API as contract | DTOs + **Swagger/OpenAPI** define public shapes; entities/schema stay internal |
| Backend owns truth | Grades, eligibility, attendance rules, permissions — all enforced here |
| Stateless API | No in-memory session state; JWT + DB for persistence |

**Dependency rule:** `modules/*` may use `common/`, `prisma/`, `auth/` — never the reverse. Modules do not import sibling module internals; use exported services or shared kernel types only.

---

## 2. Modular Architecture Rules

- Register each domain in `app.module.ts` via its `*Module` only.
- **Public surface:** export services other modules need from `*.module.ts` `exports` array.
- **Private by default:** controllers, DTOs, helpers stay module-internal unless shared deliberately.
- **No circular imports** between modules — extract shared contracts to `common/` or a thin `shared-kernel/` if unavoidable.
- **Cross-domain orchestration:** dedicated application service or facade in the consuming module — not controller-to-controller calls.
- **Global modules sparingly:** `PrismaModule`, `AuthModule`, `ConfigModule` only.

---

## 3. Feature-Based Module Organization

### Standard module

```
src/modules/students/
├── students.module.ts
├── students.controller.ts
├── students.service.ts
├── dto/
│   ├── create-student.dto.ts
│   ├── update-student.dto.ts
│   ├── student-response.dto.ts
│   └── list-students-query.dto.ts
├── mappers/
│   └── student.mapper.ts          # Prisma model → response DTO (when non-trivial)
└── constants.ts                   # Module-scoped constants only
```

### Complex module (optional layers)

```
src/modules/grades/
├── grades.module.ts
├── grades.controller.ts
├── grades.service.ts
├── grade-calculation.service.ts   # Pure domain logic, no Prisma when testable
├── dto/
├── mappers/
└── __tests__/
```

### Large module (sub-resources)

```
src/modules/planning/
├── planning.module.ts
├── schedules/
│   ├── schedules.controller.ts
│   ├── schedules.service.ts
│   └── dto/
└── curricula/
    ├── curricula.controller.ts
    └── curricula.service.ts
```

**Domain modules:** folder names must match the **Backend `modules/`** column in [`../agent.md`](../agent.md). Do not add modules not listed there without updating the registry.

---

## 4. Controller Responsibilities

**Allowed:** HTTP mapping, `@UseGuards`, param/query/body binding, status codes, delegating to services, returning DTOs, **Swagger decorators** (see §15).

**Forbidden:** Prisma calls, business rules, transactions, permission logic beyond guard declaration, `any`, manual JSON parsing, **undocumented endpoints**.

```ts
// ✅ Thin, documented controller
@ApiTags('students')
@Controller('students')
export class StudentsController {
  @Post()
  @RequirePermissions('students:create')
  @ApiOperation({ summary: 'Create a student' })
  @ApiCreatedResponse({ type: StudentResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorResponseDto })
  @ApiUnauthorizedResponse({ type: ApiErrorResponseDto })
  @ApiForbiddenResponse({ type: ApiErrorResponseDto })
  create(@Body() dto: CreateStudentDto) {
    return this.studentsService.create(dto);
  }
}

// ❌ Fat controller
@Post()
async create(@Body() body: any) {
  const avg = body.grades.reduce(...); // business logic
  return this.prisma.student.create({ data: body });
}
```

**Limits:** &lt;80 lines per controller file; split by sub-resource if larger.

---

## 5. Service Responsibilities

**Allowed:** Business logic, orchestration, authorization checks (defense in depth), Prisma access, transactions, mapping to response DTOs, emitting domain events.

**Forbidden:** `Request`/`Response`, HTTP status selection, route decorators, raw SQL strings (use Prisma or `$queryRaw` with parameters only when justified).

- One service per aggregate root when possible; split when file exceeds ~250 lines.
- **Pure functions** for calculations (GPA, weighted averages) in dedicated helpers/services — unit-test without DB.
- Inject `PrismaService` (or module repository), never instantiate `PrismaClient` manually.

---

## 6. Repository / Data Access Rules

**Default:** Services use injected `PrismaService` directly — no redundant repository wrapper for CRUD.

**Introduce a repository class when:**
- Query logic is reused in multiple services within the same module
- Complex reads need isolation for testing
- Module has 5+ non-trivial queries for one entity

```
src/modules/students/
└── students.repository.ts   # Optional; Prisma queries only — no HTTP, no business rules
```

| Rule | Requirement |
|------|-------------|
| Single gateway | All DB access via Prisma — no alternate ORMs or ad-hoc `pg` pools in features |
| Location | Prisma calls only in services or `*.repository.ts` inside the owning module |
| Select fields | Always `select` or `include` explicitly — no unbounded `findMany()` without `take` |
| Soft delete | Use `deletedAt` + middleware/filter consistently per domain |
| Tenant scope | Every query filters by `institutionId` / active period when multi-tenant |

**Forbidden:** Controllers or guards calling Prisma; raw string-concatenated SQL; `any` on query results.

---

## 7. DTO Validation Standards

- **class-validator** + **class-transformer** on all inputs; global `ValidationPipe` with `whitelist: true`, `forbidNonWhitelisted: true`.
- **@nestjs/swagger** on all public DTO properties — `@ApiProperty` / `@ApiPropertyOptional` (see §15).
- Separate DTOs: `Create*`, `Update*`, `*Query`, `*Response` — never reuse entity models as API bodies.
- Use `@IsUUID()`, `@IsEnum()`, `@Min()`, `@Max()`, `@ValidateNested()` — no untyped bodies.
- Query DTOs for pagination: `page`, `limit` with `@Type(() => Number)` and max cap (e.g. 100).
- Response DTOs: expose only client-safe fields; map from Prisma in service/mapper.
- Partial updates: `PartialType(CreateStudentDto)` from `@nestjs/swagger` (preserves OpenAPI metadata).

```ts
export class CreateStudentDto {
  @ApiProperty({ example: 'Ana', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  institutionId: string;
}
```

---

## 8. Authentication Standards

- **JWT access tokens** (short-lived); refresh tokens when implemented — separate strategy/service.
- `AuthModule` global: `JwtStrategy`, `AuthGuard`, token issuance, password hashing (bcrypt/argon2).
- Login/register/logout in `modules/auth/` only.
- Store password hashes only — never log or return passwords.
- Validate `sub`, `exp`, issuer; reject expired/malformed tokens with `401`.
- Attach user context via `@CurrentUser()` custom decorator — typed payload, not raw `request.user` casts.
- Rate-limit auth endpoints; lockout policy for repeated failures.

---

## 9. Authorization Standards

- **RBAC:** permissions as `resource:action` (e.g. `grades:update`, `reports:export`).
- Roles bundle permissions; users hold roles per institution when multi-tenant.
- **Guards:** `JwtAuthGuard` + `PermissionsGuard` (or `RolesGuard`) on every protected route.
- **Services:** re-check permissions before mutations and sensitive reads — guards are not sufficient alone.
- **Resource-level:** verify ownership/institution/period scope in service (student belongs to school X).
- Deny with `403 Forbidden` — not `404` — when authenticated but unauthorized (unless hiding existence is required).
- Never trust `institutionId` or `role` from client body without verifying against JWT + DB.

```ts
@RequirePermissions('attendance:record')
@Patch(':id')
record(@Param('id') id: string, @CurrentUser() user: AuthUser, @Body() dto: RecordAttendanceDto) {
  return this.attendanceService.record(id, user, dto);
}
```

---

## 10. Prisma Usage Rules

- **Schema** at `prisma/schema.prisma` — single source of truth for persistence.
- **Migrations:** `npx prisma migrate dev` — never edit applied migration SQL retroactively.
- **Generate:** run `prisma generate` after schema changes; commit migration + schema together.
- **Naming:** PascalCase models, camelCase fields; `@@map` / `@map` for DB snake_case when needed.
- **Relations:** explicit `onDelete` behavior; indexes on foreign keys and filter columns.
- **Queries:** `findUnique`/`findFirst` for singles; paginate lists; avoid N+1 — use `include`/`select` deliberately.
- **`$transaction`:** multi-step writes that must succeed or fail together (see §11).
- **`$queryRaw`:** parameterized only — never template literals with user input.
- **No business logic** in schema files beyond constraints and defaults.

---

## 11. Transaction Handling

Use `prisma.$transaction` when an operation:

- Touches multiple tables that must stay consistent (grade entry + audit log)
- Transfers state between aggregates (enrollment + seat count)
- Issues compensating writes on failure

```ts
return this.prisma.$transaction(async (tx) => {
  const grade = await tx.grade.create({ data });
  await tx.auditLog.create({ data: { action: 'GRADE_CREATED', ... } });
  return grade;
});
```

- Keep transactions **short** — no external HTTP calls inside.
- Interactive transactions for read-then-write consistency when row locking matters.
- Idempotency keys for critical creates to survive retries.

---

## 12. Error Handling Conventions

- Throw Nest HTTP exceptions: `NotFoundException`, `BadRequestException`, `ConflictException`, `ForbiddenException`.
- Domain-specific exceptions extend `HttpException` when reuse warrants (e.g. `AcademicPeriodClosedException`).
- Global `ExceptionFilter` maps to consistent JSON (see §14); log 5xx with stack.
- Never return stack traces to clients in production.
- Validate referential integrity before write — translate Prisma `P2002` → `409 Conflict`, `P2025` → `404`.
- Do not catch-and-ignore; wrap only to add context and rethrow.

---

## 13. Logging Expectations

- Use Nest `Logger` or structured logger (pino) — injectable per class context.
- **Log:** auth failures, permission denials, 5xx, slow queries (&gt; threshold), report exports, grade mutations.
- **Never log:** passwords, tokens, full JWT, PII dumps, credit-card-level data.
- Include correlation/request ID when middleware provides it.
- Levels: `error` failures, `warn` denials/retries, `log` significant business events, `debug` dev-only.
- No `console.log` in committed production code.

---

## 14. API Response Standards

**REST:** plural kebab-case resources — `/students`, `/academic-periods`, `/v1/...` when versioning.

| Operation | Status | Body |
|-----------|--------|------|
| Create | `201` | Created resource DTO |
| Read one | `200` | Resource DTO |
| List | `200` | `{ data: T[], meta: { page, limit, total, totalPages } }` |
| Update | `200` | Updated resource DTO |
| Delete | `204` or `200` with `{ deleted: true }` — pick one project-wide |
| Validation error | `400` | `{ statusCode, message, error: 'Bad Request', details: field[] }` |

- Timestamps in ISO 8601 UTC.
- Consistent error envelope via global filter.
- No Prisma internal field names (`studentId` FK) unless part of public contract.
- Pagination mandatory on all list endpoints.
- Document every response status in Swagger (see §15) — OpenAPI must match §14 tables.

---

## 15. Swagger / OpenAPI Documentation (Mandatory)

API documentation is **required**, not optional. Every controller route shipped to production must appear in OpenAPI with accurate schemas. Treat Swagger updates as part of the same task as the endpoint — same PR, same review.

### Centralized setup

- Configure **once** in `src/main.ts` or `src/config/swagger.config.ts` via `SwaggerModule` + `DocumentBuilder`.
- **Single docs URL** for the whole API (development and staging): `/api/docs` (UI) and `/api/docs-json` (OpenAPI JSON).
- Enable only in non-production or protect with auth in production — never expose undocumented alternate doc sites.
- Register global bearer auth: `.addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')`.
- Set title, description, version (`1.0`), and tag grouping aligned with domain modules.

```ts
// src/config/swagger.config.ts — pattern
export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Zerocademy API')
    .setDescription('Academic management system')
    .setVersion('1.0')
    .addBearerAuth(/* ... */, 'access-token')
    .build();
  const document = SwaggerModule.createDocument(app, config, {
    operationIdFactory: (controllerKey, methodKey) => `${controllerKey}_${methodKey}`,
  });
  SwaggerModule.setup('api/docs', app, document, { jsonDocumentUrl: 'api/docs-json' });
}
```

### Module and controller rules

| Rule | Requirement |
|------|-------------|
| Coverage | **100%** of controllers and HTTP handlers documented — no exceptions |
| Tags | `@ApiTags('<domain>')` on every controller; tag name matches module domain (`students`, `grades`) |
| Operations | `@ApiOperation({ summary, description? })` on every handler — clear, action-oriented summary |
| Params | `@ApiParam`, `@ApiQuery` when not inferred from DTO; document UUIDs with `format: 'uuid'` |
| Bodies | `@ApiBody({ type: XDto })` when implicit typing is insufficient |
| Responses | Document **success + relevant errors** per handler (see below) |
| Deprecation | `@ApiOperation({ deprecated: true })` + description when phasing out |

### Authentication and authorization in docs

- Protected routes: `@ApiBearerAuth('access-token')` at controller or method level.
- Public routes (login, health): `@ApiOperation` only — do **not** attach bearer auth.
- Document permission intent in `@ApiOperation({ description: 'Requires permission: students:create' })` or via a custom decorator that sets OpenAPI metadata.
- Always include **`@ApiUnauthorizedResponse`** (401) on protected routes and **`@ApiForbiddenResponse`** (403) when RBAC applies.

### DTO and schema rules

- Every field in request/response DTOs exposed to clients: `@ApiProperty` or `@ApiPropertyOptional`.
- Provide `example`, `description`, `enum`, `minimum`/`maximum`, `format` where it aids consumers.
- Reuse shared DTOs: `PaginatedResponseDto<T>`, `ApiErrorResponseDto`, `PaginationMetaDto` in `src/common/dto/swagger/`.
- List responses: document wrapper `{ data, meta }` with `@ApiOkResponse({ type: StudentListResponseDto })` — not raw arrays.
- Do not document Prisma models; only **response DTO classes**.
- Keep validation (`class-validator`) and documentation (`@ApiProperty`) on the **same property** — they must stay in sync.

### Standard error responses (document on every mutating route at minimum)

| Status | Decorator | When |
|--------|-----------|------|
| 400 | `@ApiBadRequestResponse({ type: ApiErrorResponseDto })` | Validation / malformed input |
| 401 | `@ApiUnauthorizedResponse({ type: ApiErrorResponseDto })` | Missing or invalid JWT |
| 403 | `@ApiForbiddenResponse({ type: ApiErrorResponseDto })` | RBAC denial |
| 404 | `@ApiNotFoundResponse({ type: ApiErrorResponseDto })` | Resource not found |
| 409 | `@ApiConflictResponse({ type: ApiErrorResponseDto })` | Unique constraint / conflict |

Shared error shape must match §12–§14 (`statusCode`, `message`, `error`, `details?`).

### Synchronization and workflow

1. **Implement** route + DTO + guards.
2. **Document** with Swagger decorators before marking task done.
3. **Verify** at `/api/docs` — operation appears, schemas match actual JSON, auth padlock correct.
4. **PR rule:** no merge for new/changed endpoints without OpenAPI updates.
5. When changing DTOs, update decorators in the same commit — drift between code and docs is a defect.
6. Prefer codegen-friendly patterns: explicit `type`/`schema` in `@ApiOkResponse`, avoid anonymous object types.

### `common/` Swagger assets

```
src/common/dto/swagger/
  api-error-response.dto.ts
  pagination-meta.dto.ts
  paginated-response.dto.ts    # factory or base generics pattern
```

Promote reusable decorators to `src/common/decorators/api/` (e.g. `@ApiPaginatedResponse()`, `@ApiProtectedResource()`).

### Anti-patterns (Swagger)

| Do not | Do instead |
|--------|------------|
| Ship endpoints without `@ApiOperation` | Document every handler |
| Use `@ApiProperty` without validation | Pair with `class-validator` decorators |
| Document `any` or `{}` schemas | Use concrete DTO classes |
| Copy-paste wrong response DTO | Match service return type |
| Rely on UI-only auth notes | `@ApiBearerAuth` + 401/403 responses |
| Manual wiki/Postman as source of truth | `/api/docs` is canonical |

---

## 16. Naming Conventions

| Item | Convention | Example |
|------|------------|---------|
| Module folders | kebab-case | `academic-periods/` |
| Files | kebab-case | `students.service.ts` |
| Classes | PascalCase | `StudentsService` |
| DTOs | PascalCase + suffix | `CreateStudentDto` |
| Methods | camelCase | `findByInstitution` |
| Prisma models | PascalCase | `Student`, `AcademicPeriod` |
| DB columns | camelCase in schema; snake in DB via `@map` | `firstName` |
| Permissions | `resource:action` | `grades:publish` |
| Env vars | SCREAMING_SNAKE | `DATABASE_URL`, `JWT_SECRET` |
| Constants | SCREAMING_SNAKE | `MAX_PAGE_SIZE` |

---

## 17. Folder Structure Conventions

```
BackendZerocademy/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── config/                    # ConfigModule, env validation (Joi/Zod)
│   ├── prisma/
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   ├── common/                    # Minimal cross-cutting only
│   │   ├── decorators/
│   │   ├── filters/
│   │   ├── guards/                # Base guards if not auth-specific
│   │   ├── pipes/
│   │   ├── interceptors/
│   │   ├── exceptions/
│   │   └── dto/swagger/          # Shared OpenAPI DTOs (error, pagination)
│   ├── config/
│   │   └── swagger.config.ts      # SwaggerModule bootstrap
│   ├── auth/                      # JWT strategies, auth guards (or modules/auth)
│   └── modules/
│       ├── auth/
│       ├── users/
│       ├── students/
│       ├── teachers/
│       ├── courses/
│       ├── subjects/
│       ├── grades/
│       ├── attendance/
│       ├── planning/
│       ├── reports/
│       ├── notifications/
│       └── academic-periods/
└── test/                          # E2E; unit tests colocated in modules
```

**`common/` promotion checklist (all required):**
1. Used by ≥3 modules
2. Zero domain-specific naming
3. No Prisma queries
4. Stable API unlikely to change per feature

---

## 18. Security Expectations

- Validate all inputs (DTO + `ValidationPipe`).
- Parameterized queries only (Prisma); audit any `$queryRaw`.
- Hash passwords; constant-time comparison where applicable.
- CORS allowlist for known frontend origins.
- Helmet + sensible body size limits.
- RBAC on every mutation and sensitive read.
- Scope by `institutionId` and active `academicPeriodId` in services.
- Secrets in environment variables — never committed.
- Audit trail for: grade changes, role assignments, bulk exports, period closures.
- Disable detailed errors in production (`NODE_ENV=production`).

---

## 19. Clean Code Expectations

- `strict` TypeScript; **`any` is forbidden** — use `unknown` + narrowing or proper generics.
- Functions &lt;40 lines when practical; services split before 300 lines.
- Dependency injection only — no `new PrismaClient()` in feature code.
- Explicit return types on public service methods.
- No commented-out code; no drive-by refactors outside task scope.
- DRY within a module; cross-module duplication signals missing shared kernel — extract deliberately.
- Unit-test pure domain logic; integration-test critical flows.

---

## 20. Scalability Expectations

- **Stateless** handlers — horizontal scale behind load balancer.
- **Paginate** all lists; never return unbounded collections.
- **Index** filter/sort columns in Prisma schema.
- **Avoid N+1** — batch loads, `include` with care, `dataloader` pattern if hotspots emerge.
- **Async jobs** for reports/PDF/email (queue module when introduced) — not blocking HTTP.
- **Cache** (Redis) only with explicit invalidation strategy — not default for all reads.
- **Idempotent** writes for enrollment, grade publish, payment-like flows.
- **Read replicas** — route heavy report queries when infra supports (future).

---

## 21. Anti-Patterns to Avoid

| Anti-pattern | Do instead |
|--------------|------------|
| Undocumented endpoints | Full Swagger decorators (§15) |
| Swagger out of sync with code | Update docs in the same PR as API changes |
| Fat controllers | Thin delegate to services |
| Business logic in controllers | Service or domain helper |
| Prisma in controllers/guards | Service/repository layer |
| Massive god services | Split by sub-domain or extract helpers |
| Duplicated business logic | Shared domain service or `common` kernel |
| Deeply coupled modules | Export narrow service interfaces |
| `common/` folder abuse | Keep domain code in modules |
| Unsafe/raw string SQL | Prisma API or parameterized `$queryRaw` |
| Missing validation | DTOs + global `ValidationPipe` |
| Using `any` | Proper types, generics, Prisma generated types |
| Returning Prisma models directly | Map to response DTOs |
| `404` to hide forbidden | `403` when policy denies |
| Logging secrets/PII | Redact structured logs |
| Long transactions with HTTP | Short DB-only transactions |
| Global mutable state | Injectable providers, DB, cache |
| Editing old migrations | New migration forward |

---

## Example: Grades module flow

```
POST /v1/grades  →  GradesController.create(dto)
                 →  GradesService.create(user, dto)     // permission + period check
                 →  prisma.$transaction(...)           // grade + audit
                 →  GradeResponseDto via mapper
```

---

## Agent Checklist (before submitting code)

1. Code is in the correct **`modules/<domain>/`** — not bloating `common/`.
2. Controller is **thin**; service owns logic and Prisma.
3. DTOs validate all inputs; **`@ApiProperty`** on public fields; **no `any`**.
4. Route has **JWT + permission guards**; service re-checks scope.
5. **Swagger complete:** `@ApiTags`, `@ApiOperation`, responses, `@ApiBearerAuth` if protected; verified at `/api/docs`.
6. List endpoints are **paginated**; queries use **explicit select/include**; paginated response documented.
7. Multi-table writes use **`$transaction`**.
8. Errors use **Nest HTTP exceptions** + documented `@Api*Response` types.
9. No secrets, tokens, or passwords in logs.

---

## Commands

**Run/stop/Docker/logs:** see monorepo [`README.md`](../README.md).

```bash
npm install                    # from monorepo root
npm run dev:backend
npx prisma migrate dev -w backend-zerocademy
npx prisma generate -w backend-zerocademy
npm run test -w backend-zerocademy
npm run test:e2e -w backend-zerocademy
# Swagger UI (when server is running): http://localhost:3001/api/docs
```

---

## Out of Scope

- Frontend/UI implementation (→ `FrontendZerocademy/agent.md`)
- Monorepo Docker, domain registry (→ `../agent.md`)
- Replacing Prisma or auth strategy without explicit approval
- Disabling validation, guards, or TypeScript strict mode to pass builds
- Committing `.env` or secrets
