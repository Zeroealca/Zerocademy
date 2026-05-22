# Academic Management System — Monorepo Agent Guide

Scalable academic management platform for schools and educational institutions.

**Apps:** `BackendZerocademy/` (API) · `FrontendZerocademy/` (UI)  
**Package manager:** `npm` workspaces (root `package.json`). Do not use pnpm or yarn unless the repo is migrated.

---

## Which Guide to Read

| Task | Read |
|------|------|
| Monorepo layout, domains, FE/BE boundary, Docker, agent behavior | **This file** (`agent.md`) |
| NestJS, Prisma, JWT, RBAC, API, DTOs | [`BackendZerocademy/agent.md`](BackendZerocademy/agent.md) |
| Next.js, UI, TanStack Query, forms, RSC | [`FrontendZerocademy/agent.md`](FrontendZerocademy/agent.md) |

**Implementation workflows** (scaffolding, CRUD, docs sync, commits) → [`.cursor/skills/`](.cursor/skills/README.md) and [`docs/cursor-skills.md`](docs/cursor-skills.md).

**Do not duplicate** stack-specific rules in this file. Child guides are authoritative for their layer.

---

## AI Guidance Architecture

| Layer | Location | Contains |
|-------|----------|----------|
| Architecture & global rules | `agent.md` (root + per app) | Principles, boundaries, naming, security |
| Reusable workflows | `.cursor/skills/<name>/SKILL.md` | Module/feature generation, CRUD, RBAC, docs, commits |
| Human docs | `docs/` | Architecture, features, conventions |

See [`docs/ai-workflow.md`](docs/ai-workflow.md).

---

## Canonical Domain Registry

One bounded context per row. Implement in the mapped folders only.

| Domain | Responsibility | Backend `modules/` | Frontend `features/` |
|--------|----------------|--------------------|-----------------------|
| Auth | Login, JWT, session context | `auth` | `auth` |
| Users | Accounts, profiles, role assignment | `users` | `users` |
| Students | Permanent student profiles and CSV import | `students` | `students` |
| Enrollments | Student ↔ course ↔ period relationships | `enrollments` | `enrollments` |
| Teachers | Profiles, qualifications | `teachers` | `teachers` |
| Courses | Classroom / parallel groups per period | `courses` | `courses` |
| Subjects | Subject catalog, curricula links | `subjects` | `subjects` |
| Teacher assignments | Staffing: teacher + subject + course + period | `teacher-assignments` | `teacher-assignments` |
| Planning | Schedules, class groups, academic structure | `planning` | `planning` |
| Grades | Assessments, entry, transcripts | `grades` | `grades` |
| Attendance | Records, absences, justifications | `attendance` | `attendance` |
| Reports | Exports, period summaries | `reports` | `reports` |
| Notifications | In-app and async delivery | `notifications` | `notifications` |
| Academic periods | Terms, calendars, active period | `academic-periods` | `academic-periods` |
| Academic levels | Reusable education stages (EGB, Bachillerato, custom) | `academic-levels` | `academic-levels` |
| Grade levels | Reusable grades within a level | `grade-levels` | `grade-levels` |
| Academic structure | Hierarchy visualization (reads levels API) | `academic-levels` *(hierarchy)* | `academic-structure` |
| Institutions | Educational institutions, settings, branding | `institutions` | `institutions`, `institution-settings` |
| Institution memberships | Admins/teachers assigned to institutions | `institution-memberships` | `institution-memberships` |
| Academic period transitions | School-year transitions, active period per institution | `academic-period-transitions` | `academic-period-transitions` |
| Dashboard | Aggregated KPIs and analytics UI | — *(reads other modules)* | `dashboard` |

Cross-cutting: **RBAC** (`auth` + `users` + `common/rbac`), **audit logging**, **institution scope**, **academic period context** (`selectedAcademicPeriodId`).

**RBAC (2025):** Platform config = `SUPER_ADMIN`; institution ops = `ADMIN` (strict routes); period activation = one ACTIVE per regime globally. See [`docs/rbac.md`](docs/rbac.md) and [`docs/ownership-strategy.md`](docs/ownership-strategy.md).

**Naming rule:** Use the **Canonical domain** column for new folders. Update this table when adding a domain.

---

## Monorepo Principles

1. **Modular monolith per app** — feature modules with explicit boundaries; no circular dependencies.
2. **Backend owns business rules** — grades, eligibility, attendance policy, authorization decisions.
3. **Frontend owns presentation** — UX, client validation, server-state caching; never the source of truth for rules.
4. **Strong typing** — `strict` TypeScript; **`any` forbidden** in both apps.
5. **Security by default** — validate on server; client validation is supplementary only.
6. **Scalable lists** — paginated API responses; frontend must not load unbounded datasets.
7. **Minimal shared folders** — grow `common/` and `components/` only with proven reuse.

---

## Repository Layout

```
Zerocademy/
├── agent.md
├── .cursor/skills/          # Reusable AI workflows
├── BackendZerocademy/
│   ├── agent.md
│   ├── prisma/
│   └── src/modules/ | common/ | prisma/
├── FrontendZerocademy/
│   ├── agent.md
│   └── src/app/ | features/ | components/ | lib/
└── docs/
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

**Shared API contract:**

- **Pagination:** `page`, `limit`; response `meta: { page, limit, total, totalPages }`.
- **List body:** `{ data: T[], meta }`.
- **Errors:** `{ statusCode, message, error, details? }`.
- **Routes:** plural kebab-case (`/students`, `/academic-periods`); prefix `/v1/` when versioning.
- **OpenAPI:** `/api/docs` is the API contract reference; align frontend Zod manually until codegen exists.

---

## Shared Conventions (Both Apps)

| Item | Convention |
|------|------------|
| Domain / feature folders | kebab-case (`academic-periods`) |
| TypeScript source files | kebab-case |
| Classes / components | PascalCase |
| Types / interfaces | PascalCase, no `I` prefix |
| Constants / env vars | SCREAMING_SNAKE |
| API path segments | kebab-case, plural |

App-specific naming → child `agent.md` files.

---

## Git Commits

- **Only commit when the user explicitly asks.**
- Never commit `.env`, secrets, or `node_modules`.
- **Never** add `Co-authored-by`, AI attribution, or tool footers to commit messages.
- Format and examples → skill [`commit-message-skill`](.cursor/skills/commit-message-skill/SKILL.md) and [Git commits in user rules].

**Scopes:** `feat[Backend]:`, `feat[Frontend]:`, or root `type:` for repo-only changes.

---

## Agent Behavior

1. Route to the correct `agent.md` (backend vs frontend).
2. Check the **domain registry** before creating folders.
3. For scaffolding or repetitive tasks, **read the matching skill** under `.cursor/skills/`.
4. Implement inside the mapped module/feature — minimal diffs, no drive-by refactors.
5. Add validation and authorization with every new endpoint or sensitive form.
6. Use `npm` from repo root or `npm run <script> -w <workspace>`.
7. Run [`architecture-review-skill`](.cursor/skills/architecture-review-skill/SKILL.md) before considering a feature complete.

---

## Docker & Commands

**Operational guide:** [`README.md`](README.md)

```bash
npm install
npm run dev:backend
npm run dev:frontend
cp .env.example .env && npm run docker:up   # full stack
```

---

## Out of Scope (All Agents)

- Changing auth strategy or stack without explicit approval.
- Committing secrets or disabling strict mode / guards to pass builds.
- Duplicating layer-specific rules here instead of child guides.
- Creating markdown docs unless requested or required by [`documentation-sync-skill`](.cursor/skills/documentation-sync-skill/SKILL.md) as part of feature delivery.
