# UI Guidelines

## Design principles

- **Modern SaaS aesthetic** — clean spacing, restrained color, clear hierarchy.
- **Minimal chrome** — cards and tables over heavy decoration.
- **Responsive first** — mobile-friendly grids; sidebar collapses on small screens.
- **Accessible** — semantic HTML, labels on inputs, `aria-label` on navigation.

## Theme (light / dark)

- Theme via `ThemeProvider` + `next-themes`; preference persisted in `localStorage`.
- Use **CSS variables** from `globals.css` — never hardcode light-only colors.
- Semantic tokens: `background`, `foreground`, `card`, `primary`, `muted`, `destructive`, `border`.
- All shadcn components in `components/ui/` are theme-aware.

## Component library

- **shadcn/ui** primitives: `Button`, `Input`, `Label`, `Card`, `Select`, `Badge`.
- Extend via `class-variance-authority` variants — see `components/ui/badge.tsx`.
- Layout: `dashboard-shell`, `dashboard-sidebar`, `dashboard-header`.

## Patterns

| Pattern | Usage |
|---------|--------|
| Page header | `h1` + muted description + primary action button |
| Data table | Bordered table inside `Card`, loading/error states |
| Forms | `Card` wrapper, 2-column grid on `sm+`, inline field errors |
| Status badges | `Badge` with variant by state (`success`, `secondary`, `muted`) |
| Empty states | Centered muted text in table body |
| Access denied | Centered message + link back |

## Spacing and typography

- Page sections: `space-y-8`.
- Card padding: default shadcn `CardContent`.
- Headings: `text-2xl font-semibold tracking-tight` for page titles.
- Body: `text-sm` for descriptions and table content.

## Do not

- Use inline styles for theme colors.
- Skip loading and error states on data views.
- Put business rules in UI (role checks are presentation gates only; API enforces truth).

## Related documentation

- [FrontendZerocademy/agent.md](../FrontendZerocademy/agent.md)
- [frontend-architecture.md](./frontend-architecture.md)
- [academic-periods-frontend.md](./academic-periods-frontend.md)
