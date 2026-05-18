# Academic Periods — Frontend

## Overview

Feature module at `FrontendZerocademy/src/features/academic-periods/` for managing Ecuadorian academic calendars.

## Routes

| Route | Component | Access |
|-------|-----------|--------|
| `/academic-periods` | List + filters | SUPER_ADMIN, ADMIN, TEACHER |
| `/academic-periods/new` | Create form | SUPER_ADMIN, ADMIN |
| `/academic-periods/[id]` | Detail + terms | SUPER_ADMIN, ADMIN, TEACHER |
| `/academic-periods/[id]/edit` | Edit form | SUPER_ADMIN, ADMIN |

Routes are protected by the dashboard layout `AuthGuard`. Feature components apply additional permission checks via `canViewAcademicPeriods` / `canManageAcademicPeriods`.

## Feature structure

```
src/features/academic-periods/
├── api/
│   ├── academic-periods.api.ts
│   └── academic-periods.keys.ts
├── components/
│   ├── academic-periods-list-page.tsx
│   ├── academic-periods-table.tsx
│   ├── academic-period-form.tsx
│   ├── academic-period-detail-page.tsx
│   ├── academic-terms-panel.tsx
│   ├── create-academic-period-page.tsx
│   └── edit-academic-period-page.tsx
├── hooks/
├── schemas/
├── constants.ts
└── types.ts
```

## Data fetching

- **TanStack Query** for server state (`useAcademicPeriods`, `useAcademicPeriod`, mutations).
- Query keys centralized in `academic-periods.keys.ts`.
- **apiClient** handles JWT and 401 refresh.

## Forms

- **react-hook-form** + **zod** schemas in `schemas/academic-period.schema.ts`.
- Date inputs use native `type="date"` (ISO `YYYY-MM-DD`).

## UI patterns

- List page: filters (regime, status, search) + paginated table.
- Detail page: status badges, activate/deactivate/archive actions, embedded terms panel.
- Terms: inline create form + table; optimistic invalidation via query invalidation on mutation success.

## Permissions (`lib/permissions.ts`)

| Function | Roles |
|----------|-------|
| `canViewAcademicPeriods` | SUPER_ADMIN, ADMIN, TEACHER |
| `canManageAcademicPeriods` | SUPER_ADMIN, ADMIN |

Sidebar shows **Academic periods** when the user can view.

## Related documentation

- [academic-periods.md](./academic-periods.md) — backend API and business rules
- [ui-guidelines.md](./ui-guidelines.md) — design system
- [frontend-architecture.md](./frontend-architecture.md) — app structure
