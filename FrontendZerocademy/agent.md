# Frontend Agent Guide — Academic Management System

> **Authoritative for:** Next.js UI, TanStack Query, Zustand, forms, RSC.  
> **Monorepo:** domain registry, FE/BE boundary → [`../agent.md`](../agent.md)  
> **Workflows:** [`.cursor/skills/`](../.cursor/skills/README.md) — feature generation, CRUD UI, API sync

**App:** `FrontendZerocademy/` · **npm** workspaces from repo root  
**Stack:** Next.js App Router · TypeScript · Tailwind · shadcn/ui · TanStack Query · Zustand · RHF · Zod

---

## Idioma de la interfaz (obligatorio)

**Regla global:** toda la UI visible al usuario debe estar en **español**. No enviar cadenas en inglés en componentes, formularios ni mensajes de error.

| Incluir en español | Ejemplos |
|--------------------|----------|
| Etiquetas y títulos | «Nombre», «Fecha de inicio», «Trimestres / quimestres» |
| Botones y acciones | «Guardar cambios», «Añadir trimestre», «Editar», «Eliminar» |
| Estados vacíos / carga / error | «Cargando períodos…», «No se pudieron cargar los trimestres» |
| Confirmaciones | `window.confirm` y diálogos destructivos |
| Validación Zod | `schemas/*.schema.ts` — mensajes en español |
| Constantes de UI | `ROLE_LABELS`, `STATUS_LABELS`, `REGIME_LABELS`, etc. |
| Accesibilidad | `aria-label`, `sr-only`, `placeholder` orientados al usuario |

- `lang="es"` en `app/layout.tsx` (ya configurado).
- Los mensajes que devuelve la API pueden llegar en inglés; mostrarlos tal cual salvo que el producto exija traducción explícita.

**Excepciones (inglés permitido):** nombres de variables, rutas, claves de API, tipos TypeScript, comentarios de código, documentación técnica en `docs/`.

**Anti-patrón:** mezclar inglés y español en la misma pantalla (p. ej. «Add term» junto a «Períodos académicos»).

---

## 1. Architecture Principles

| Rule | Requirement |
|------|-------------|
| Feature slices | One domain per `src/features/<domain>/` |
| Thin routing | `src/app/` composes features only |
| Dependency direction | `app` → `features` → `components/ui` · `lib` — never features → app |
| Backend boundary | No grade formulas, permission **enforcement**, or persistence |
| Colocation | API, hooks, schemas, UI live in the feature |
| Minimal shared | Promote to `components/` or `lib/` only after second justified reuse |

**New feature:** [`frontend-feature-generator`](../.cursor/skills/frontend-feature-generator/SKILL.md)

---

## 2. Folder Structure

```
src/
├── app/                    # Thin routes, layouts
├── features/<domain>/      # api/, hooks/, schemas/, components/, types.ts, index.ts
├── components/ui/          # shadcn primitives
├── components/layout/      # Shell: sidebar, header
├── lib/                    # api-client, query-client, utils (no domain logic)
└── stores/                 # Zustand — global UI only
```

**Do not create:** global `src/services/`, `src/hooks/`, or `src/pages/`.

Domain folder names → registry in [`../agent.md`](../agent.md).

---

## 3. Components & RSC

- **Default:** Server Components; `"use client"` only for interactivity, forms, Query, Zustand.
- Push client boundary **leaf-low**.
- One concern per file; target &lt;150 lines, split at 200.
- Presentational components receive props; data fetching in feature hooks.
- **shadcn first** — extend via `className` / composition.

| Server Component | Client (`"use client"`) |
|------------------|-------------------------|
| Static layout, metadata | Events, RHF, TanStack Query |
| Read-only markup | Dialog, Select, charts |

---

## 4. Data & Forms

**Layering:** `Component → hook → api/*.api.ts → lib/api-client.ts`

- **TanStack Query** for all server state; query keys in `*.keys.ts`.
- **No `fetch` in components.**
- **react-hook-form** + **zodResolver**; schemas in `features/<domain>/schemas/`.
- Mutations invalidate the smallest correct key subtree.
- Lists: server-side pagination always; loading, error, and empty states required.

API alignment: [`api-frontend-sync-skill`](../.cursor/skills/api-frontend-sync-skill/SKILL.md)  
CRUD UI: [`crud-foundation-skill`](../.cursor/skills/crud-foundation-skill/SKILL.md)

---

## 5. State Management

| State | Tool |
|-------|------|
| Server data | TanStack Query |
| Forms | react-hook-form |
| URL (filters, tabs) | `searchParams` / nuqs |
| Global UI (sidebar, theme) | Zustand in `stores/` |
| Local UI (modal open) | `useState` |

**Forbidden in Zustand:** API entity lists, grades, attendance — use Query cache.

---

## 6. Styling & Theme

- Tailwind utility-first; `cn()` from `lib/utils.ts`.
- **Design tokens** via CSS variables in `globals.css` — support **dark and light** modes; no hardcoded hex in features.
- Mobile-first responsive layouts for dashboard.
- No CSS Modules / styled-components unless approved.

---

## 7. Validation & Errors

- Zod in feature schemas — **Spanish messages**; server is authoritative.
- Prefer `z.infer<typeof schema>` for form types.
- Normalize API errors in `api-client`; toast + `setError` on mutations.
- 401/403 → auth feature handling; never silent fail.

---

## 8. Shared Components

| Allowed in `components/` | Not allowed |
|--------------------------|-------------|
| shadcn/ui, layout shell | Domain tables/forms |
| Generic `EmptyState`, `PageHeader` | API calls inside shared components |

Promotion requires: ≥2 unrelated features, zero domain API, props-only data.

---

## 9. Naming & Imports

| Item | Convention |
|------|------------|
| Feature folders | kebab-case |
| Files | kebab-case |
| Components | PascalCase |
| Hooks | `use` + camelCase |
| Path alias | `@/` → `src/` |

Import via feature `index.ts` barrels — no deep cross-feature paths. Named exports preferred.

---

## 10. Code Quality

- `strict` TypeScript; no `any`.
- ESLint clean; minimal diffs.
- Permission UI gating is cosmetic — API enforces. Use `lib/permissions.ts` (mirrors backend role sets).
- **Academic period context:** header selector for ADMIN/TEACHER/STUDENT; defaults to effective period; courses/assignments lists filter by `useEffectiveAcademicPeriodId()`.
- **Period activation:** SUPER_ADMIN only on `/academic-periods` table toggles with confirm + optimistic UI.

**Commits:** [`commit-message-skill`](../.cursor/skills/commit-message-skill/SKILL.md) — use `type[Frontend]: message`.

**Pre-submit review:** [`architecture-review-skill`](../.cursor/skills/architecture-review-skill/SKILL.md)

---

## 11. Anti-Patterns

| Avoid | Do instead |
|-------|------------|
| Business logic in UI | Display API-computed fields |
| `useEffect` + `fetch` | TanStack Query |
| English user-facing copy | Spanish strings |
| Global store for API data | Query cache |
| 400+ line components | Split by concern |
| Hardcoded colors | Theme CSS variables |
| Deep cross-feature imports | Page-level composition or shared primitive |

---

## Commands

```bash
npm run dev:frontend
npm run build -w frontend-zerocademy
```

---

## Out of Scope

- Backend, Prisma, JWT → `BackendZerocademy/agent.md`
- Monorepo Docker / registry → `../agent.md`
- Replacing stack libraries without approval
