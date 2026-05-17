# Frontend Agent Guide — Academic Management System

> **Authoritative for:** all UI, Next.js, TanStack Query, Zustand, forms, and client-side patterns.  
> **Monorepo:** domain registry, FE/BE boundary, shared API contract → [`../agent.md`](../agent.md)

**App:** `FrontendZerocademy/` · **Package manager:** `pnpm`  
**Role:** Presentation, UX, client validation, and server-state orchestration. Business rules live in the API.

**Stack:** Next.js App Router · TypeScript · Tailwind CSS · shadcn/ui · TanStack Query · Zustand · react-hook-form · zod

---

## 1. Frontend Architecture Rules

| Rule | Requirement |
|------|-------------|
| Modularity | One feature = one bounded slice under `src/features/<domain>/` |
| Domain orientation | Folder names mirror academic domains (students, grades, attendance, …) |
| Thin routing | `src/app/` composes features; no domain logic in route files |
| Dependency direction | `app` → `features` → `components/ui` · `lib` — never `features` importing from `app` |
| Backend boundary | No grade formulas, permission **enforcement**, or persistence logic in the UI |
| Colocation | Keep hooks, schemas, API calls, and UI for a domain inside its feature |
| Minimal shared | `src/components/` and `src/lib/` grow only with truly cross-feature primitives |

**Default:** Add code to a feature module. Promote to shared only after the second identical, justified use.

---

## 2. Folder Structure Conventions

```
src/
├── app/                          # Routes, layouts, loading/error — thin shells only
│   ├── (auth)/
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── students/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   └── grades/
│   └── api/                      # Route handlers only when BFF pattern is required
├── features/                     # Domain modules — names match ../agent.md registry
│   ├── auth/
│   ├── users/
│   ├── students/
│   ├── teachers/
│   ├── courses/
│   ├── subjects/
│   ├── planning/
│   ├── grades/
│   ├── attendance/
│   ├── reports/
│   ├── notifications/
│   ├── academic-periods/
│   └── dashboard/
├── components/
│   ├── ui/                       # shadcn primitives (generated, lightly customized)
│   └── layout/                   # App shell: sidebar, header, page-header
├── lib/
│   ├── api-client.ts             # Base fetch, auth headers, error normalization
│   ├── query-client.ts           # TanStack Query client factory
│   └── utils.ts                  # cn(), formatters with zero domain knowledge
├── stores/                       # Zustand — global UI/session only
│   └── use-ui-store.ts
└── types/                        # App-wide types only (never feature-specific types)
```

**Do not create:** `src/services/`, `src/hooks/` (global), `src/pages/`, or deep `src/utils/` trees unless promoted from features.

---

## 3. Feature-Based Module Organization

### Standard feature slice

```
features/students/
├── api/
│   ├── students.api.ts           # Raw HTTP functions (no React)
│   └── students.keys.ts          # Query key factory
├── components/
│   ├── student-table.tsx
│   ├── student-form.tsx
│   └── student-filters.tsx
├── hooks/
│   ├── use-students.ts           # useQuery wrappers
│   ├── use-student-mutations.ts  # useMutation wrappers
│   └── use-student-form.ts       # RHF + zod wiring (optional)
├── schemas/
│   └── student.schema.ts         # Zod — forms + inferred types
├── types.ts                      # Feature-local types (prefer z.infer)
├── constants.ts                  # Feature-only constants
└── index.ts                      # Public API of the feature (barrel — selective exports)
```

### Large feature (subdomains)

```
features/grades/
├── api/
├── components/
│   ├── grade-entry/
│   └── grade-report/
├── hooks/
├── schemas/
└── index.ts
```

**Cross-feature imports:** Import only from another feature's `index.ts` public surface — never deep-import internal files.

**Forbidden:** Feature A importing Feature B's components to avoid duplication — extract to shared only when generic, or compose at page level.

---

## 4. Rules for Shared Components

| Allowed in `components/` | Not allowed |
|----------------------------|-------------|
| shadcn/ui primitives (`Button`, `Dialog`, `Table`, …) | Domain-specific tables (e.g. `StudentGradeMatrix`) |
| Layout shell (sidebar, nav, breadcrumbs) | Forms tied to a single entity |
| Generic `EmptyState`, `PageHeader`, `DataTable` wrapper | Business copy tied to one workflow |
| Accessible primitives (skip link, visually hidden) | API calls or TanStack Query hooks |

**Promotion checklist (all must be true):**
1. Used by ≥2 unrelated features
2. Contains zero domain-specific labels or API endpoints
3. Accepts data via props — no internal fetching
4. Documented props interface with TypeScript

---

## 5. Component Design Principles

- **Single responsibility** — one visual concern per file; split list / filters / actions.
- **Presentational vs container** — data fetching in hooks; components receive props or call feature hooks.
- **Composition over configuration** — prefer children/slots over 20 optional props.
- **Max size** — target &lt;150 lines; split at 200. Never ship 400+ line components.
- **No business logic** — formatting dates OK; computing final grades, eligibility, or permission **decisions** is not (role-based UI gating is allowed).
- **Accessible by default** — semantic HTML, labels, keyboard nav, focus management in modals.
- **shadcn first** — extend via `className` and composition; do not fork `components/ui/` without reason.

```tsx
// ✅ Presentational
export function StudentRow({ student, onSelect }: StudentRowProps) { ... }

// ✅ Container in feature hooks
export function StudentList() {
  const { data, isLoading } = useStudents(filters);
  return <StudentTable rows={data} loading={isLoading} />;
}

// ❌ Business logic in UI
export function StudentRow({ id }) {
  const eligible = average(grades) >= passingThreshold; // belongs in API
}
```

---

## 6. Server vs Client Components

| Use Server Component (default) | Use `"use client"` |
|-------------------------------|---------------------|
| Static layout, metadata, SEO | Event handlers, `onClick`, `onChange` |
| Initial data that does not need interactivity | react-hook-form, controlled inputs |
| Redirects / auth gate at layout (with cookies) | TanStack Query hooks, Zustand |
| Heavy read-only markup without browser APIs | shadcn interactive primitives (Dialog, Select, …) |
| Passing serializable props to client children | Charts, drag-and-drop, virtualized lists |

**Rules:**
- Keep `"use client"` leaf-low — push the boundary down the tree.
- Never import server-only modules (`fs`, DB clients) into client files.
- Do not mark entire `app/(dashboard)/layout.tsx` as client unless unavoidable.
- Prefer Server Component page → single client feature root per route.

```tsx
// app/(dashboard)/students/page.tsx — Server Component
import { StudentListPage } from "@/features/students";

export default function Page() {
  return <StudentListPage />;
}
```

---

## 7. Form Handling Standards

- **react-hook-form** + **zodResolver** + feature `schemas/*.schema.ts`.
- One schema per form; reuse field schemas via `.pick()` / `.extend()`.
- `defaultValues` typed with `z.infer<typeof schema>`.
- Submit via mutation hook — not raw `fetch` in `onSubmit`.
- Disable submit while `isSubmitting`; show field errors from `formState.errors` and server `setError`.
- Multi-step forms: one schema per step or one schema with superRefine — stay in the feature.
- Destructive actions: `AlertDialog` + explicit confirm copy.

```tsx
const form = useForm<CreateStudentInput>({
  resolver: zodResolver(createStudentSchema),
  defaultValues: { ... },
});
```

---

## 8. API Consumption Patterns

**Layering (strict):**

```
Component → feature hook (useQuery/useMutation) → api/*.api.ts → lib/api-client.ts
```

| Layer | Responsibility |
|-------|----------------|
| `lib/api-client.ts` | Base URL, credentials, JSON parse, `ApiError` normalization |
| `features/*/api/*.api.ts` | Endpoint paths, query params, request/response typing |
| `features/*/api/*.keys.ts` | Hierarchical query keys |
| `features/*/hooks/*.ts` | TanStack Query options, enabled flags, invalidation |

**Query keys (factory pattern):**

```ts
export const studentKeys = {
  all: ["students"] as const,
  lists: () => [...studentKeys.all, "list"] as const,
  list: (filters: StudentFilters) => [...studentKeys.lists(), filters] as const,
  detail: (id: string) => [...studentKeys.all, "detail", id] as const,
};
```

**Rules:**
- No `fetch` inside components or UI primitives.
- No duplicate queries for the same key on one screen — lift to layout or pass cached data.
- List endpoints: always paginated; expose `page` / `limit` in filters type.
- Mutations invalidate the smallest key subtree that stays correct.

---

## 9. State Management Rules

| State type | Tool | Location |
|------------|------|----------|
| Server data | TanStack Query | Feature hooks |
| Form state | react-hook-form | Feature components/hooks |
| URL state (filters, tabs, pagination) | `searchParams` / nuqs | Page or feature hook |
| Global UI (sidebar, theme, active period selector) | Zustand | `src/stores/` — minimal |
| Local UI (open modal, accordion) | `useState` | Component |

**Zustand — allowed:**
- Sidebar collapsed, command palette open, selected academic period (UI context)
- Client-only preferences

**Zustand — forbidden:**
- Student lists, grades, attendance records, or any data returned from API
- Caching API responses (use Query cache)
- Replacing form state

**Anti-pattern:** One mega-store for the entire app.

---

## 10. Styling Conventions

- **Tailwind utility-first**; use `cn()` from `lib/utils.ts` for conditional classes.
- **Design tokens** via CSS variables in `globals.css` — no hardcoded hex in features.
- **shadcn variants** — use `buttonVariants`, component `variant` props; avoid one-off class strings.
- **Responsive:** mobile-first (`sm:`, `md:`, `lg:`); dashboard grids must not break below `md`.
- **No CSS Modules / styled-components** unless explicitly approved for a specific case.
- **No inline `style={{}}`** except dynamic values (e.g. chart coordinates).

---

## 11. Validation Standards

- **Client:** Zod schemas in `features/<domain>/schemas/` — UX and early feedback only.
- **Server is authoritative** — display API validation errors; never assume client pass = valid.
- Infer types: `type CreateStudentInput = z.infer<typeof createStudentSchema>`.
- Reuse API field names in schema keys to map server errors cleanly.
- Coerce carefully (`z.coerce.number()` for numeric inputs); document optional vs required.
- No `any` in schemas; use `.superRefine()` for cross-field rules (e.g. date ranges).

---

## 12. Error Handling Expectations

| Scenario | Pattern |
|----------|---------|
| Query error | Feature error boundary or `ErrorState` component with retry |
| Mutation error | Toast + field-level `setError` when `details` map to fields |
| 401/403 | Redirect or forbidden view via auth feature — not silent fail |
| Network offline | Query `retry` + user-visible message |
| Unexpected throw | `app/error.tsx` / `global-error.tsx` |

- Normalize errors in `api-client` to `{ message, statusCode, details? }`.
- Log to monitoring in production — not `console.log` in committed code.
- Never swallow errors in empty `catch` blocks.

---

## 13. Naming Conventions

| Item | Convention | Example |
|------|------------|---------|
| Feature folders | kebab-case | `academic-periods/` |
| Files | kebab-case | `student-table.tsx` |
| React components | PascalCase export | `StudentTable` |
| Hooks | `use` + camelCase | `useStudents` |
| API modules | `<domain>.api.ts` | `students.api.ts` |
| Query keys | `<domain>.keys.ts` | `students.keys.ts` |
| Zod schemas | camelCase + `Schema` | `createStudentSchema` |
| Types | PascalCase | `StudentFilters` |
| Zustand stores | `use-<name>-store.ts` | `use-ui-store.ts` |
| Constants | SCREAMING_SNAKE | `DEFAULT_PAGE_SIZE` |

---

## 14. Import Conventions

- **Path alias:** `@/` → `src/` only.
- **Order:** React/Next → external libs → `@/lib` → `@/components` → `@/features/<x>` → relative.
- **Feature imports:** `@/features/students` via barrel `index.ts` — not deep paths from other features.
- **No default exports** for components/hooks (named exports ease refactor).
- **No barrel re-export everything** — `index.ts` exports only public feature API.
- **Forbidden:** `import { x } from "../../../.."` — fix structure instead.

```ts
import { useStudents } from "@/features/students";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api-client";
```

---

## 15. Code Quality Expectations

- `strict` TypeScript; no `any`, no `@ts-ignore` without tracked reason.
- ESLint clean before merge; no disabled rules to bypass failures.
- Functions &lt;40 lines when possible; extract helpers to feature `utils.ts`.
- No commented-out code; no drive-by refactors outside the task.
- Tests (when added): colocate `*.test.ts(x)` next to hooks/utils — not required for every UI tweak.
- Public props/interfaces explicit — no implicit `children` abuse for data passing.

### Git commits

Monorepo-wide rules (no co-author, allowed types, lowercase) → [`../agent.md`](../agent.md#git-commits).

**Every frontend commit** must use:

```
<type>[Frontend]: <message>
```

| Type | Use for |
|------|---------|
| `feat` | New screen, flow, or user-visible behavior |
| `fix` | UI bug, broken form submit, incorrect client handling |
| `chore` | Deps, eslint config, tailwind tokens |
| `refactor` | Component/hook structure without behavior change |
| `docs` | agent.md, inline README in app |
| `test` | Component or hook tests |
| `style` | Visual-only tweaks (spacing, classes) |

**Examples**

```
feat[Frontend]: add login form validation
fix[Frontend]: show api field errors on student form
refactor[Frontend]: split dashboard into feature components
chore[Frontend]: align student schema with api dto fields
```

**Forbidden:** `feat: ...` without `[Frontend]` · title case subjects · generic messages · any `Co-authored-by` or AI attribution · committing without user request.

---

## 16. Performance Expectations

- **Lists:** virtualize at 100+ rows; paginate server-side always.
- **Images:** `next/image` with sizes; no unoptimized large assets.
- **Code split:** dynamic `import()` for heavy feature chunks (charts, rich editors).
- **Query defaults:** `staleTime` per resource; avoid `refetchOnWindowFocus` on stable reference data.
- **Memoization:** only when measured or for expensive pure children — not by default everywhere.
- **RSC:** fetch on server when pattern is established; don't double-fetch server + client without intent.
- **Bundles:** do not import entire libraries (`import _ from 'lodash'`) — use targeted imports.

---

## 17. Anti-Patterns to Avoid

| Anti-pattern | Why | Do instead |
|--------------|-----|------------|
| Massive components | Unmaintainable, untestable | Split table / filters / actions |
| Business logic in UI | Duplicates API, drifts | Display API-computed fields |
| Excessive prop drilling | Fragile trees | Feature hooks, composition, context scoped to feature |
| Duplicated API calls | Wasted bandwidth, inconsistent state | Shared query key + one hook per screen |
| Global state abuse | Stale data, hidden coupling | TanStack Query for server state |
| Shared folder abuse | Junk drawer architecture | Keep domain code in features |
| Monolithic pages | 500-line `page.tsx` | Thin page + feature entry component |
| `useEffect` + `fetch` | Race conditions, no cache | TanStack Query |
| Permission UI gating as only control | Security theater | Hide/disable in UI; API enforces (see `../agent.md`) |
| Copy-paste schemas | Type drift | Shared zod fragments within feature |
| God `lib/utils.ts` | Hidden domain logic | Feature-local utils |
| Client-only data fetching in layouts | Waterfalls | Colocate queries in feature roots |

---

## Domain Modules

Folder names must match the **Frontend `features/`** column in [`../agent.md`](../agent.md) (canonical domain registry).  
`dashboard` composes other features — it does not own domain persistence.

---

## Example: Dashboard route composition

```
app/(dashboard)/grades/page.tsx          # ~10 lines: metadata + <GradeEntryPage />
features/grades/
  components/grade-entry-page.tsx      # Composes subcomponents
  hooks/use-grade-sheet.ts
  api/grades.api.ts
  schemas/grade-entry.schema.ts
```

---

## Agent Checklist (before submitting code)

1. Code lives in the correct **feature** — not bloating `shared/`.
2. Page file is a **thin shell**.
3. Server/client boundary is **as high as possible** (client leaf-low).
4. Data uses **TanStack Query**; forms use **RHF + Zod**.
5. No **business rules** in components.
6. Component under **200 lines**; file has **single responsibility**.
7. Imports use **`@/`** and feature barrels correctly.
8. Accessible labels and keyboard paths on interactive UI.
9. Commits use **`type[Frontend]: message`** — no co-author lines ([`../agent.md`](../agent.md#git-commits)).

---

## Out of Scope

- Backend rules, Prisma, JWT issuance (→ `BackendZerocademy/agent.md`)
- Monorepo Docker, domain registry updates (→ `../agent.md`)
- Replacing stack libraries without explicit approval
- Adding global state for API entities
