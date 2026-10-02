# Zerocademy local QA

[`qa-users.example.json`](./qa-users.example.json) is the committed, credential-free structure. [`qa-users.local.json`](./qa-users.local.json) is the only credentials source for local QA and is intentionally Git-ignored.

Before setup, populate every account's `firstName`, `lastName`, `email`, and `password`; set `environment.name` to `local`, `frontendUrl` to `http://localhost:3000`, and `backendUrl` to `http://localhost:3001`. Leave generated IDs as `null` or empty arrays.

With the Docker stack running, use `npm run qa:setup` from the repository root. It refuses non-local PostgreSQL URLs, seeds only canonical catalog/permission/evaluation prerequisites, reconciles the configured accounts and minimum QA academic context, then writes generated IDs only to the ignored local file. It does not create plans, sessions, assessments, grades, or other product-workflow records.

Use stable keys such as `teacherPrimary` in QA instructions instead of placing credentials in prompts. Never run QA setup against Neon, Render, staging, or production.
