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
| Representatives | Guardian/student relationships and read-only linked-student access | `representatives` | `representatives` |
| Enrollments | Student ↔ course ↔ period relationships | `enrollments` | `enrollments` |
| Teachers | Profiles, qualifications | `teachers` | `teachers` |
| Courses | Classroom / parallel groups per period | `courses` | `courses` |
| Subjects | Subject catalog, curricula links | `subjects` | `subjects` |
| Teacher assignments | Staffing: teacher + subject + course + period | `teacher-assignments` | `teacher-assignments` |
| Timetables | Weekly schedule structure, teaching loads, generation, published timetable views | `timetables` | `timetables` |
| Study plans | Versioned official MINEDUC reference catalog and institution-period adoption | `study-plans` | — *(foundation only)* |
| Planning | Pedagogical academic plans (units/lessons); not weekly timetables | `planning` | `planning` |
| Academic execution | Actual teaching occurrences and their operational lifecycle | `academic-execution` | `academic-execution` |
| Grades | Assessments, entry, transcripts | `grades` | `grades` |
| Academic performance | Grade calculation engine, averages, performance queries | `academic-performance` | `academic-performance` |
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
| Academic evaluation | Grading schemes, evaluation terms, assessment categories, institution config | `academic-evaluation` | `academic-evaluation` |
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
- **Mandatory commit identity check:** before every agent-created commit, run `git config --get user.name` and `git config --get user.email`. The effective email must be exactly `emilioandresalcivarcarrera@gmail.com`; if missing or different, set it repository-locally with `git config --local user.email "emilioandresalcivarcarrera@gmail.com"`, then verify it again. Never modify global Git configuration or use another email. If the name is missing, stop and request it rather than inventing one. After committing, run `git log -1 --format="%an <%ae>"`; report an incorrect email without rewriting history.
- Format and examples → skill [`commit-message-skill`](.cursor/skills/commit-message-skill/SKILL.md) and [Git commits in user rules].

**Scopes:** `feat[Backend]:`, `feat[Frontend]:`, or root `type:` for repo-only changes.

---

## Jira & Confluence (feature delivery)

Every **new feature** (new bounded context, substantial module, or user-facing capability spanning backend and/or frontend) must be tracked in **Jira** and documented in **Confluence** — not only in repo `docs/`.

| Phase | Jira | Confluence |
|-------|------|------------|
| **Before implementation** | Create a task (Story or Task) with scope, acceptance criteria, and mapped domain from the registry | Optional draft page or link from the Jira issue |
| **After implementation** | Move to Done / Resolved; add PR or commit links in comments if applicable | Publish or update a page: purpose, flows, API endpoints, roles, frontend routes, known limits |
| **Cross-link** | Jira issue ↔ Confluence page URL in both directions | Same |

**In scope for Jira + Confluence:** new domains, major CRUD modules, RBAC changes, API contract changes, academic workflows, institution-scoped features.

**Out of scope:** typo fixes, refactors without behavior change, dependency bumps, config-only tweaks — unless the user explicitly asks.

Use the **Atlassian** MCP and skills when available (`spec-to-backlog`, `search-company-knowledge`, etc.). Repo docs ([`documentation-sync-skill`](.cursor/skills/documentation-sync-skill/SKILL.md), `docs/`) remain required for technical reference; Confluence is the **product / team** source of truth.

---

## Agent Behavior

1. Route to the correct `agent.md` (backend vs frontend).
2. Check the **domain registry** before creating folders.
3. For a **new feature**, ensure a **Jira task** exists (create one if missing) before substantial implementation.
4. For scaffolding or repetitive tasks, **read the matching skill** under `.cursor/skills/`.
5. Implement inside the mapped module/feature — minimal diffs, no drive-by refactors.
6. Add validation and authorization with every new endpoint or sensitive form.
7. Use `npm` from repo root or `npm run <script> -w <workspace>`.
8. Run [`architecture-review-skill`](.cursor/skills/architecture-review-skill/SKILL.md) before considering a feature complete.
9. **Document the feature in Confluence** when delivery is done (create or update the page linked from Jira).

---

## Mandatory End-to-End Module Validation

Whenever an agent implements, completes, or significantly changes a frontend or backend module, it **must validate the functionality from an end user's perspective** before declaring the module complete or proceeding to another module. This is a project-wide completion gate for backend-only, frontend-only, full-stack, authorization, database-backed, and API-integration work. Unit tests, type checks, lint, and builds are necessary but never sufficient evidence of functional completion.

### Backend and API validation

- Start the application or use an appropriate isolated test environment, then exercise relevant endpoints through the real HTTP layer with realistic payloads.
- Verify success and expected-failure flows, authentication, relevant roles, institution/resource isolation, lifecycle restrictions, meaningful errors, persistence, and read-after-write consistency.
- When applicable, test complete sequences such as **Create → Read → Update → Validate → Delete**. Do not substitute mocked service tests for HTTP/integration validation.
- Use isolated or disposable data whenever possible. Never use production Neon as a disposable test database, run destructive reset/cleanup/seeding operations against production, or create fake production academic data solely to test.

### Frontend and full-stack validation

- Run the frontend and use the actual UI with the available browser or computer-use automation. Verify navigation, forms, dialogs, validation, loading/empty/error/success states, persistence after navigation or refresh, role visibility, responsive behavior when relevant, browser console errors, and failed network requests.
- For full-stack work, verify the complete journey: **frontend interaction → API request → authorization → business validation → persistence → API response → frontend state update**. Independent frontend and backend checks do not prove the integration.
- Select realistic role scenarios from `SUPER_ADMIN`, `ADMIN`, `TEACHER`, `STUDENT`, and `REPRESENTATIVE` according to the module. Include realistic negative cases: invalid input, missing references, unauthorized roles, cross-institution access, lifecycle restrictions, conflicts, duplicates, empty states, and stale state where applicable.

### Defects, limitations, and safety

- If validation finds an in-scope defect, reproduce it, identify the cause, fix it, add or update regression coverage where practical, rerun the failing scenario and related checks, and do not proceed until it passes. Never weaken assertions, bypass authorization, or redefine expected behavior merely to hide a failure.
- Document unrelated defects with evidence. If one blocks the real user journey, do not claim full E2E completion; otherwise keep its fix outside the ticket unless it is a small, safe, necessary correction.
- Do not fabricate browser sessions, HTTP responses, database writes, or production verification. Production writes require explicit authorization and a safe cleanup strategy; safe production verification is read-only by default.

### Completion gate and reporting

A module is functionally complete only when implementation meets acceptance criteria; relevant automated checks and builds pass; realistic user scenarios, authorization/isolation, and applicable persistence have been verified; no known blocking in-scope defect remains; and required documentation is updated. Deployment status remains a separate fact: local E2E verification does not require production deployment.

If E2E validation cannot be performed because of missing credentials, inaccessible API/database, unavailable automation, missing deployment, or another external dependency, execute all feasible checks, state the exact blocker, provide reproducible manual verification steps, and do not report full completion.

Every module final report must include: module/ticket and scope; implementation; actual automated results; executed end-user scenarios; authorization; persistence; bugs and fixes; remaining limitations with exact reasons; environment; deployment status; and a next-module gate. Use exactly one classification:

- **COMPLETE — E2E VERIFIED**: implementation and applicable end-user scenarios were exercised successfully.
- **IMPLEMENTED — E2E PENDING**: implementation and automated checks are complete, but required end-user validation could not run.
- **BLOCKED**: a functional defect, failed acceptance criterion, or required dependency prevents completion.

This policy complements and does not replace the existing Git identity and commit rules, Prisma migration safeguards, deployment safety, authorization architecture, Jira/Confluence synchronization, and testing conventions.

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
- Shipping a new feature without a Jira task and Confluence documentation (see **Jira & Confluence** above).
- Creating repo markdown docs unless requested or required by [`documentation-sync-skill`](.cursor/skills/documentation-sync-skill/SKILL.md) as part of feature delivery.
