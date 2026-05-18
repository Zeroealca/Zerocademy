# Development Workflow

Day-to-day flow for Zerocademy contributors and AI agents.

## Environment setup

```bash
git clone <repo>
cd Zerocademy
npm install
cp .env.example .env
npm run docker:up          # optional: full stack
# or
npm run dev:backend
npm run dev:frontend
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| API | http://localhost:3001 |
| Swagger | http://localhost:3001/api/docs |
| pgAdmin | http://localhost:5050 |

## Branch and change flow

1. Pick or create a task aligned with a **domain** in [`agent.md`](../agent.md).
2. If the domain is new, update the registry first.
3. Follow the skill chain in [cursor-skills.md](./cursor-skills.md).
4. Run builds:
   ```bash
   npm run build -w backend-zerocademy
   npm run build -w frontend-zerocademy
   ```
5. Run [`architecture-review-skill`](../.cursor/skills/architecture-review-skill/SKILL.md).
6. Commit only when requested — [`commit-message-skill`](../.cursor/skills/commit-message-skill/SKILL.md).

## Backend change checklist (summary)

- Module under `src/modules/<domain>/`
- DTOs + Swagger on every route
- RBAC on protected routes; service re-checks
- Migration committed with schema changes
- [`docs/database.md`](./database.md) updated if schema changed

## Frontend change checklist (summary)

- Feature under `src/features/<domain>/`
- Thin `app/` routes
- Spanish UI strings
- TanStack Query for server state
- Types aligned with API — [`api-frontend-sync-skill`](../.cursor/skills/api-frontend-sync-skill/SKILL.md)

## Database

```bash
npx prisma migrate dev --name <description> -w backend-zerocademy
npx prisma generate -w backend-zerocademy
```

Details: [`database.md`](./database.md) · skill [`prisma-schema-architect`](../.cursor/skills/prisma-schema-architect/SKILL.md)

## Documentation

After substantive features, run [`documentation-sync-skill`](../.cursor/skills/documentation-sync-skill/SKILL.md).

## AI-specific workflow

See [ai-workflow.md](./ai-workflow.md) for how agents combine `agent.md` and skills.

## Related docs

- [architecture.md](./architecture.md)
- [backend-conventions.md](./backend-conventions.md)
- [frontend-conventions.md](./frontend-conventions.md)
- [api-flow.md](./api-flow.md)
