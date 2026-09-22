# Zerocademy architecture

## Monorepo

| App | Path                  | Role                                     |
| --- | --------------------- | ---------------------------------------- |
| API | `BackendZerocademy/`  | Business rules, auth, persistence        |
| UI  | `FrontendZerocademy/` | Presentation, client validation, caching |

Package manager: **npm workspaces** (root `package.json`).

## Domain registry

Canonical domains (from root `agent.md`):

| Domain                            | Backend module         | Frontend feature                       |
| --------------------------------- | ---------------------- | -------------------------------------- |
| Auth                              | `auth`                 | `auth`                                 |
| Users                             | `users`                | `users`                                |
| Academic periods                  | `academic-periods`     | `academic-periods`                     |
| Subjects                          | `subjects`             | `subjects`                             |
| Teacher assignments               | `teacher-assignments`  | `teacher-assignments`                  |
| Institutions                      | `institutions`         | `institutions`, `institution-settings` |
| Academic evaluation               | `academic-evaluation`  | `academic-evaluation`                  |
| Grades                            | `grades`               | `grades`                               |
| Academic performance              | `academic-performance` | `academic-performance`                 |
| Students, Teachers, Attendance, … | Partial / planned      | Partial / planned                      |

**Implemented:** Auth, Users, RBAC, Institutions, Academic periods, Academic structure (levels, grades, courses), Subjects, Teacher assignments, Academic Planning backend (AcademicPlan, AcademicUnit, and LessonPlan), the AcademicPlan/AcademicUnit frontend workspace, Dashboard shell.

## Boundaries

| Concern                   | Owner                     |
| ------------------------- | ------------------------- |
| JWT issuance / validation | Backend                   |
| Password hashing          | Backend                   |
| Role enforcement          | Backend                   |
| Permission UI gating      | Frontend (cosmetic)       |
| Rendering / routing       | Frontend                  |
| Server state cache        | Frontend (TanStack Query) |

## API contract

- Prefix: `/v1`
- Lists: `{ data: T[], meta: { page, limit, total, totalPages } }`
- Errors: `{ statusCode, message, error, details? }`
- OpenAPI: `http://localhost:3001/api/docs`

## Infrastructure (development)

Docker Compose: `postgres`, `pgadmin`, `backend` (:3001), `frontend` (:3000).

```bash
cp .env.example .env
npm run docker:up
```

## Documentation index

- [ai-workflow.md](./ai-workflow.md)
- [cursor-skills.md](./cursor-skills.md)
- [development-workflow.md](./development-workflow.md)
- [backend-architecture.md](./backend-architecture.md)
- [frontend-architecture.md](./frontend-architecture.md)
- [auth.md](./auth.md)
- [users.md](./users.md)
- [database.md](./database.md)
- [api-flow.md](./api-flow.md)
- [institutions.md](./institutions.md)
- [tenancy-strategy.md](./tenancy-strategy.md)
- [academic-structure.md](./academic-structure.md)
- [academic-periods.md](./academic-periods.md)
- [academic-evaluation.md](./academic-evaluation.md)
- [grades.md](./grades.md)
- [assessments.md](./assessments.md)
- [grading-workflow.md](./grading-workflow.md)
- [grade-calculation-engine.md](./grade-calculation-engine.md)
- [report-cards.md](./report-cards.md)
- [attendance.md](./attendance.md)
- [academic-periods-frontend.md](./academic-periods-frontend.md)
- [subjects.md](./subjects.md)
- [teacher-assignments.md](./teacher-assignments.md)
- [academic-planning.md](./academic-planning.md)
- [curriculum.md](./curriculum.md)
- [seeds.md](./seeds.md)
- [ui-guidelines.md](./ui-guidelines.md)
- [backend-conventions.md](./backend-conventions.md)
- [frontend-conventions.md](./frontend-conventions.md)

## AI guidance

| Layer                       | Location                                                                                                                         |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Architecture & global rules | `agent.md`, `BackendZerocademy/agent.md`, `FrontendZerocademy/agent.md`                                                          |
| Implementation workflows    | `.cursor/skills/*/SKILL.md`                                                                                                      |
| Workflow docs               | [ai-workflow.md](./ai-workflow.md), [cursor-skills.md](./cursor-skills.md), [development-workflow.md](./development-workflow.md) |

Agents read **agent files** for principles and **skills** for scaffolding, CRUD, RBAC, docs sync, and reviews.

## Agent guides

Authoritative layer rules (concise — no duplicated workflows):

- Root: `agent.md`
- Backend: `BackendZerocademy/agent.md`
- Frontend: `FrontendZerocademy/agent.md`
