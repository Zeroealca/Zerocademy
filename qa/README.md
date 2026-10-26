# Zerocademy local QA

[`qa-users.example.json`](./qa-users.example.json) is the committed, credential-free structure. [`qa-users.local.json`](./qa-users.local.json) is the only credentials source for local QA and is intentionally Git-ignored.

Before setup, populate every account's `firstName`, `lastName`, `email`, and `password`; set `environment.name` to `local`, `frontendUrl` to `http://localhost:3000`, and `backendUrl` to `http://localhost:3001`. Leave generated IDs as `null` or empty arrays.

With the Docker stack running, use `npm run qa:setup` from the repository root. It refuses non-local PostgreSQL URLs, seeds only canonical catalog/permission/evaluation prerequisites, reconciles the configured accounts and minimum QA academic context, then writes generated IDs only to the ignored local file. It does not create plans, sessions, assessments, grades, or other product-workflow records.

Use stable keys such as `teacherPrimary` in QA instructions instead of placing credentials in prompts. Never run QA setup against Neon, Render, staging, or production.

## E2E service restart

Do not use `docker compose restart backend` for acceptance work: restart keeps
the container's original entrypoint, which runs Prisma migration and seed
steps. To reload current mounted source without changing the isolated E2E
database, recreate only the application services with the E2E override:

```powershell
$env:COMPOSE_FILE = "$PWD\docker-compose.yml;$PWD\qa\docker-compose.e2e.yml"
docker compose up -d --force-recreate --no-deps backend frontend
```

The override replaces the backend entrypoint with `npm run start:dev`, fixes
both database URLs to `postgres` / `zerocademy_e2e`, and sets
`RUN_PRISMA_SEED=false`. It does not recreate PostgreSQL or its volume. Always
check `current_database()` and `E2E_TEST_CLOCK_ENABLED=true` after recreation.
