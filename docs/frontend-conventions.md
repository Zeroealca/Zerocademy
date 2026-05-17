# Frontend conventions

Summary of standards for `FrontendZerocademy/`. Full detail: [`FrontendZerocademy/agent.md`](../FrontendZerocademy/agent.md).

## Feature layout

```
src/features/<domain>/
├── api/           # *.api.ts, *.keys.ts
├── components/
├── hooks/
├── schemas/       # Zod
└── index.ts       # Public exports only
```

## Rules

- **Thin pages** — `app/**/page.tsx` composes feature entry components
- **Client boundary** — push `"use client"` to leaves
- **No fetch in components** — use hooks + `api-client`
- **No `any`** — strict TypeScript
- **Imports** — `@/` alias; cross-feature via barrel `index.ts` only

## Styling

- Tailwind utilities + `cn()` helper
- Design tokens via CSS variables (`globals.css`)
- shadcn-style primitives in `components/ui/`

## Forms

- react-hook-form + `zodResolver`
- One schema per form in `schemas/`
- Display API errors via `ApiError.details`

## State

| Data | Store |
|------|-------|
| Server | TanStack Query |
| Auth session | Zustand persist |
| Theme | next-themes |
| Form | react-hook-form |

## Commits

`type[Frontend]: message` — lowercase, no co-author lines.
