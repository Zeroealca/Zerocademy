---
name: frontend-feature-generator
description: Scaffolds a Next.js feature slice in FrontendZerocademy with api, hooks, schemas, and routes. Use when creating a frontend feature, new dashboard section, or domain UI module.
---

# Frontend Feature Generator

## Prerequisites (read first)

1. [`agent.md`](../../../agent.md) — domain registry
2. [`FrontendZerocademy/agent.md`](../../../FrontendZerocademy/agent.md) — UI language (Spanish), RSC rules
3. [`docs/frontend-conventions.md`](../../../docs/frontend-conventions.md)
4. [`docs/ui-guidelines.md`](../../../docs/ui-guidelines.md)

## Inputs

| Input | Required | Example |
|-------|----------|---------|
| `domain` | Yes | `students` |
| `routes` | Yes | list `/students`, detail `/students/[id]` |
| `permissions` | Yes | `canView*`, `canManage*` in `lib/permissions.ts` |
| `needsForms` | No | create/edit pages |

## Workflow

1. Create `src/features/<domain>/`:
   - `api/<domain>.api.ts` + `<domain>.keys.ts`
   - `hooks/` — `use-<domain>s.ts`, `use-*-mutations.ts`
   - `schemas/<domain>.schema.ts` — Zod, **Spanish validation messages**
   - `types.ts`, `constants.ts` (Spanish labels)
   - `components/` — page entry components
   - `index.ts` — selective exports
2. Add thin routes under `src/app/(dashboard)/<domain>/`.
3. Wire sidebar in `dashboard-sidebar.tsx` when appropriate.
4. Sync API types via [`api-frontend-sync-skill`](../api-frontend-sync-skill/SKILL.md).
5. For CRUD UI, use [`crud-foundation-skill`](../crud-foundation-skill/SKILL.md).
6. `npm run build -w frontend-zerocademy`.
7. [`documentation-sync-skill`](../documentation-sync-skill/SKILL.md).

## UI requirements

- All user-visible strings in **Spanish**
- `lang="es"` already on root layout
- Dark/light via existing `ThemeProvider` and CSS variables — no hardcoded colors
- Loading, error, empty states on every data view
- No `fetch` in components — hooks only

## Expected output

- Feature slice + routes
- Permission-gated pages
- TanStack Query for server state

## Anti-patterns

- Business logic in components (grades, eligibility)
- Global Zustand for API data
- Deep cross-feature imports
- English UI copy
- `useEffect` + raw `fetch`
- 400+ line components
