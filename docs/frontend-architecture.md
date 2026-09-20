# Frontend architecture

## Stack

- Next.js 16 App Router
- TypeScript (strict)
- Tailwind CSS v4 + CSS variables (light/dark)
- shadcn-style UI primitives (`components/ui/`)
- TanStack Query — server state
- Zustand — auth session persistence
- react-hook-form + Zod — forms

## Folder structure

```
FrontendZerocademy/src/
├── app/                    # Thin routes only
│   ├── (auth)/login/
│   └── (dashboard)/dashboard/
├── features/               # Domain slices
│   ├── auth/
│   ├── users/
│   ├── academic-periods/
│   ├── academic-levels/
│   ├── grade-levels/
│   ├── courses/
│   ├── subjects/
│   ├── teacher-assignments/
│   ├── students/
│   ├── enrollments/
│   ├── academic-structure/
│   ├── institutions/
│   ├── institution-settings/
│   ├── institution-memberships/
│   ├── academic-period-transitions/
│   ├── academic-evaluation/    # Grading engine configuration UI
│   ├── grades/                 # Assessments, grade entry, student grades
│   ├── academic-performance/   # Averages dashboards and performance views
│   ├── reports/                # Report-card view, print actions, PDF download
│   ├── attendance/             # Daily roster and batch attendance entry
│   └── dashboard/
├── components/
│   ├── ui/                 # Shared primitives
│   ├── layout/             # Dashboard shell
│   ├── providers/
│   └── theme/
├── lib/                    # api-client, query-client, utils
└── stores/                 # use-auth-store
```

## Data flow

```
Page → feature component → hook (useQuery/useMutation) → api/*.api.ts → lib/api-client.ts
```

No `fetch` in presentational components. No business rules in UI (grades, permissions enforcement, etc.).

## Auth flow

1. User submits login form (`features/auth`).
2. `loginRequest` → `POST /v1/auth/login`.
3. `useAuthStore.setTokens` persists access/refresh tokens and user (localStorage via Zustand `persist`).
4. `AuthGuard` in dashboard layout checks hydration + authentication.
5. `useCurrentUser` validates session against `GET /v1/auth/me`.
6. On `401`, `api-client` attempts refresh via `/v1/auth/refresh`; on failure, clears auth and redirects to `/login`.
7. Logout calls `/v1/auth/logout` then clears store.

## State management

| Concern | Tool |
|---------|------|
| API data | TanStack Query |
| Auth session | Zustand (`zerocademy-auth` persist) |
| Theme | next-themes (`class` on `<html>`) |
| Forms | react-hook-form |

## Theme system

- CSS variables in `globals.css` for light and `.dark` themes.
- `ThemeProvider` (next-themes) with `defaultTheme: system`.
- `ThemeToggle` in login and dashboard headers.
- Preference persisted in `localStorage` by next-themes.

## Routing

| Route | Access |
|-------|--------|
| `/` | Redirects to `/dashboard` |
| `/login` | Public |
| `/dashboard` | Protected (`AuthGuard`) |
| `/users` | Protected — ADMIN, SUPER_ADMIN. Directory: search, role, active state, sort by role/status, pagination |
| `/academic-periods` | Protected — view: ADMIN, SUPER_ADMIN, TEACHER |
| `/academic-periods/new`, `…/edit` | Protected — ADMIN, SUPER_ADMIN |
| `/institutions` | Protected — view: ADMIN, SUPER_ADMIN |
| `/institutions/new`, `…/edit` | Protected — SUPER_ADMIN |
| `/institutions/[id]/settings` | Protected — settings/branding: ADMIN, SUPER_ADMIN |
| `/institutions/[id]/members` | Protected — memberships: ADMIN, SUPER_ADMIN |
| `/institutions/[id]/transitions` | Protected — view: ADMIN, SUPER_ADMIN, TEACHER; wizard: ADMIN, SUPER_ADMIN |
| `/academic-performance` | Protected — role-based hub (STUDENT, TEACHER, ADMIN) |
| `/academic-performance/my-averages` | Protected — STUDENT |
| `/academic-performance/course-averages` | Protected — TEACHER, ADMIN |
| `/academic-performance/subject-performance` | Protected — TEACHER, ADMIN |
| `/academic-performance/student-performance` | Protected — TEACHER, ADMIN |
| `/academic-performance/institution` | Protected — ADMIN |
| `/academic-performance/course-performance` | Protected — ADMIN |
| `/report-cards` | Protected — STUDENT (own report), TEACHER, ADMIN, SUPER_ADMIN (scoped reports) |
| `/attendance` | Protected — TEACHER, ADMIN, SUPER_ADMIN |
| `/representative` | Protected — REPRESENTATIVE; linked-student academic portal |

## Environment

`NEXT_PUBLIC_API_URL` — browser-facing API base (default `http://localhost:3001`).

## Related

- Monorepo boundary: root `agent.md`
- Backend auth: [auth.md](./auth.md)
- Institutions: [institutions.md](./institutions.md)
- Memberships: [memberships.md](./memberships.md)
- Transitions: [academic-transitions.md](./academic-transitions.md)
- Academic periods UI: [academic-periods-frontend.md](./academic-periods-frontend.md)
- UI guidelines: [ui-guidelines.md](./ui-guidelines.md)
- Report cards: [report-cards.md](./report-cards.md)
- Attendance: [attendance.md](./attendance.md)
