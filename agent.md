# Academic Management System — Monorepo Agent Guide

Scalable academic management platform for schools and educational institutions.

**Apps:** `BackendZerocademy/` (API) · `FrontendZerocademy/` (UI)  
**Package manager:** `npm` workspaces (root `package.json`). Do not use pnpm or yarn unless the repo is migrated.

---

## Which Guide to Read

| Task | Read |
|------|------|
| Monorepo layout, domains, FE/BE boundary, Docker, agent behavior | **This file** (`agent.md`) |
| NestJS, Prisma, JWT, RBAC, API, DTOs, transactions | [`BackendZerocademy/agent.md`](BackendZerocademy/agent.md) |
| Next.js, UI, TanStack Query, Zustand, forms, RSC | [`FrontendZerocademy/agent.md`](FrontendZerocademy/agent.md) |

**Do not duplicate** stack-specific rules in this file. Child guides are the single source of truth for their layer.

---

## Canonical Domain Registry

One bounded context per row. Implement in the mapped folders only.

| Domain | Responsibility | Backend `modules/` | Frontend `features/` |
|--------|----------------|--------------------|-----------------------|
| Auth | Login, JWT, session context | `auth` | `auth` |
| Users | Accounts, profiles, role assignment | `users` | `users` *(when built)* |
| Students | Enrollment, profiles, guardians, class assignment | `students` | `students` |
| Teachers | Profiles, assignments, qualifications | `teachers` | `teachers` |
| Courses | Course offerings, groups, assignments | `courses` | `courses` *(when built)* |
| Subjects | Subject catalog, curricula links | `subjects` | `subjects` *(when built)* |
| Planning | Schedules, class groups, academic structure | `planning` | `planning` |
| Grades | Assessments, entry, transcripts | `grades` | `grades` |
| Attendance | Records, absences, justifications | `attendance` | `attendance` |
| Reports | Exports, period summaries | `reports` | `reports` |
| Notifications | In-app and async delivery | `notifications` | `notifications` |
| Academic periods | Terms, calendars, active period | `academic-periods` | `academic-periods` |
| Dashboard | Aggregated KPIs and analytics UI | — *(reads other modules)* | `dashboard` |

Cross-cutting (not standalone product modules): **RBAC enforcement** (backend `auth` + `users`), **audit logging**, **institution/tenant scope**.

**Naming rule:** Use the **Canonical domain** column for new folders. Do not create parallel names (e.g. `academic-planning` vs `planning`) without updating this table.

---

## Monorepo Principles

1. **Modular monolith per app** — feature modules with explicit boundaries; no circular dependencies.
2. **Backend owns business rules** — grades, eligibility, attendance policy, authorization decisions.
3. **Frontend owns presentation** — UX, client validation, server-state caching; never the source of truth for rules.
4. **Strong typing** — `strict` TypeScript; **`any` forbidden** in both apps (details in child guides).
5. **Security by default** — validate on server; client validation is supplementary only.
6. **Scalable lists** — paginated API responses; frontend must not load unbounded datasets.
7. **Minimal shared folders** — `common/` (backend) and `components/` + `lib/` (frontend) grow only with proven reuse.

---

## Repository Layout

```
Zerocademy/   # repository root
├── agent.md                 # This file
├── BackendZerocademy/
│   ├── agent.md             # Backend rules (authoritative for API)
│   ├── prisma/
│   └── src/
│       ├── modules/         # Domain modules
│       ├── prisma/
│       └── common/          # Cross-cutting only — see BackendZerocademy/agent.md
├── FrontendZerocademy/
│   ├── agent.md             # Frontend rules (authoritative for UI)
│   └── src/
│       ├── app/             # Thin routes
│       ├── features/        # Domain slices
│       ├── components/      # Shared UI only
│       └── lib/
└── docker/                  # Compose, Dockerfiles (when added)
```

---

## Frontend / Backend Boundary

| Concern | Owner |
|---------|--------|
| Business rules, calculations, grade logic | Backend |
| Permission **enforcement** | Backend |
| Permission **UI gating** (hide/disable) | Frontend *(cosmetic; API still enforces)* |
| Data persistence | Backend |
| JWT issuance and validation | Backend |
| Rendering, routing, optimistic UI | Frontend |
| Client-side validation (Zod) | Frontend |
| Server state cache | Frontend (TanStack Query) |

**Forbidden in frontend:** Prisma, raw SQL, service-role secrets, permission matrices as source of truth, grade formulas, attendance rules.

**Forbidden in backend:** JSX, CSS, React, browser APIs.

**Shared API contract** (both sides must align):

- **Pagination:** `page`, `limit`; response `meta: { page, limit, total, totalPages }`.
- **List body:** `{ data: T[], meta }`.
- **Errors:** `{ statusCode, message, error, details? }`.
- **Routes:** plural kebab-case (`/students`, `/academic-periods`); version prefix `/v1/` when breaking.
- **Types:** Backend **Swagger/OpenAPI** at `/api/docs` is the API contract reference; keep Zod schemas (frontend) aligned manually until codegen exists.

---

## Shared Conventions (Both Apps)

| Item | Convention |
|------|------------|
| Domain / feature folders | kebab-case (`academic-periods`) |
| TypeScript source files | kebab-case (`student-table.tsx`, `students.service.ts`) |
| Classes / components | PascalCase |
| Types / interfaces | PascalCase, no `I` prefix |
| Constants / env vars | SCREAMING_SNAKE |
| API path segments | kebab-case, plural |

App-specific naming (DTOs, hooks, Prisma models, Zustand stores) → see the relevant child `agent.md`.

---

## Agent Behavior

1. **Route to the correct guide** — backend work → `BackendZerocademy/agent.md`; frontend work → `FrontendZerocademy/agent.md`.
2. **Check the domain registry** before creating folders; update this table if adding a domain.
3. Implement inside the mapped module/feature — not in global shells without justification.
4. Add validation and authorization with every new endpoint or sensitive form.
5. **Minimal diffs** — no drive-by refactors, formatting sweeps, or dependency upgrades outside scope.
6. Do not add markdown docs unless requested.
7. Use `npm` from the repo root (workspaces) or `npm run <script> -w <workspace>` in the app you are changing.

---

## Docker & Infrastructure

**Operational guide (start/stop/logs/troubleshooting):** [`README.md`](README.md)

- **Development:** from repo root, `cp .env.example .env` then `npm run docker:up`.
- Stack: `postgres`, `pgadmin` (:5050), `backend` (:3001), `frontend` (:3000).
- See `docker-compose.yml` and root `package.json` `docker:*` scripts.
- After adding backend npm dependencies, rebuild the backend image (`docker compose build backend`). Frontend: rebuild and optionally remove `zerocademy_frontend_node_modules` — details in `README.md`.
- Run Prisma migrations at container start (`migrate deploy`) — not ad-hoc in production shells.

---

## Commands

```bash
# Install (from repo root)
npm install

# Local dev (without Docker)
npm run dev:backend
npm run dev:frontend

# Docker (full stack)
cp .env.example .env
npm run docker:up
```

---

## Out of Scope (All Agents)

- Changing auth strategy or replacing stack choices without explicit approval.
- Committing secrets, `.env`, or `node_modules`.
- Disabling ESLint, TypeScript strict mode, or security guards to pass builds.
- Duplicating layer-specific rules in this file instead of the child guide.
