# Zerocademy architecture

## Monorepo

| App | Path | Role |
|-----|------|------|
| API | `BackendZerocademy/` | Business rules, auth, persistence |
| UI | `FrontendZerocademy/` | Presentation, client validation, caching |

Package manager: **npm workspaces** (root `package.json`).

## Domain registry

Canonical domains (from root `agent.md`):

| Domain | Backend module | Frontend feature |
|--------|----------------|------------------|
| Auth | `auth` | `auth` |
| Users | `users` | `users` *(API ready; UI admin screens later)* |
| Students, Teachers, Grades, … | Planned | Planned |

**Implemented in this foundation:** Auth, Users (backend), Auth + Dashboard shell (frontend).

## Boundaries

| Concern | Owner |
|---------|--------|
| JWT issuance / validation | Backend |
| Password hashing | Backend |
| Role enforcement | Backend |
| Permission UI gating | Frontend (cosmetic) |
| Rendering / routing | Frontend |
| Server state cache | Frontend (TanStack Query) |

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

- [backend-architecture.md](./backend-architecture.md)
- [frontend-architecture.md](./frontend-architecture.md)
- [auth.md](./auth.md)
- [users.md](./users.md)
- [database.md](./database.md)
- [api-flow.md](./api-flow.md)
- [backend-conventions.md](./backend-conventions.md)
- [frontend-conventions.md](./frontend-conventions.md)

## Agent guides

Authoritative layer rules:

- Root: `agent.md`
- Backend: `BackendZerocademy/agent.md`
- Frontend: `FrontendZerocademy/agent.md`
