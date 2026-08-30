# Educational institutions

## Purpose

The institutions module is the **root owner** of the academic domain. It prepares Zerocademy for multiple schools without implementing full multi-tenant infrastructure (no schema-per-tenant, no separate databases).

Each institution can own:

- Academic periods and terms
- Classroom courses (parallels)
- Subjects (institution catalog or global + custom)
- Teacher assignments
- Academic levels and grades (via existing `institutionId` on structure models)
- User profiles (students, teachers, representatives)

## Data model

| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | Primary key |
| `name` | String | Display name |
| `code` | String | Unique slug-style identifier (lowercase, hyphens) |
| `email`, `phone`, `address` | String? | Contact and location |
| `region` | `InstitutionRegion?` | Geographic zone (Ecuador reference) |
| `regime` | `AcademicRegime?` | Default calendar regime for the institution |
| `logoUrl` | String? | Branding |
| `primaryColor`, `secondaryColor` | String? | Hex colors (`#RRGGBB`) |
| `isActive` | Boolean | Academic operations gate |

### Enums

**InstitutionRegion:** `COSTA`, `SIERRA`, `AMAZONIA`, `GALAPAGOS`

**AcademicRegime** (shared with academic periods): `COSTA_GALAPAGOS`, `SIERRA_AMAZONIA`

Region and regime are validated for consistency when both are set (e.g. Costa/Galápagos regions align with `COSTA_GALAPAGOS`).

## API (`/v1/institutions`)

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/institutions` | SUPER_ADMIN, ADMIN | Paginated list (`ADMIN`: membership-scoped) |
| GET | `/institutions/:id` | SUPER_ADMIN, ADMIN | Detail (`ADMIN`: membership required) |
| POST | `/institutions` | SUPER_ADMIN | Create |
| PATCH | `/institutions/:id` | SUPER_ADMIN | Update core fields |
| PATCH | `/institutions/:id/settings` | SUPER_ADMIN, ADMIN | Contact, region, regime (`ADMIN`: membership) |
| POST | `/institutions/:id/logo` | SUPER_ADMIN, ADMIN | Upload logo (multipart, optimized WebP) |
| PATCH | `/institutions/:id/branding` | SUPER_ADMIN, ADMIN | Theme colors (`ADMIN`: membership) |
| POST | `/institutions/:id/activate` | SUPER_ADMIN | Enable academic use |
| POST | `/institutions/:id/deactivate` | SUPER_ADMIN | Block new academic use |
| DELETE | `/institutions/:id` | SUPER_ADMIN | Delete only if no dependents |

OpenAPI: `http://localhost:3001/api/docs` → tag `institutions`.

## Business rules

1. Only **active** institutions should drive new academic operations (enforced when linking periods/courses).
2. Institution `code` is unique and immutable in normal edit flows (separate create form).
3. Delete is blocked when profiles, periods, structure, courses, subjects, or assignments reference the institution.
4. Academic period activation is scoped by `institutionId` + `regime` (no cross-institution collision).
5. Global catalog rows (`institutionId` null) remain shared; institution-specific rows are owned by that institution.
6. **ADMIN** may list, view, and update settings/branding only for institutions where they have an **active ADMIN membership**. Cross-institution access returns **404**. `SUPER_ADMIN` sees and manages all institutions.

## Logging

Structured events on `InstitutionsService`:

- `INSTITUTION_CREATED`, `INSTITUTION_UPDATED`, `INSTITUTION_DELETED`
- `INSTITUTION_ACTIVATED`, `INSTITUTION_DEACTIVATED`
- `INSTITUTION_SETTINGS_UPDATED`, `INSTITUTION_BRANDING_UPDATED`
- `INSTITUTION_VALIDATION_FAILED`, `INSTITUTION_OWNERSHIP_CONFLICT`

No passwords, tokens, or full PII in logs.

## Logo upload

- **Endpoint:** `POST /v1/institutions/:id/logo` with field `file`
- **Processing:** Sharp resizes (max 512px), auto-rotates, outputs **WebP**
- **Transparency:** lossless WebP when the source has an alpha channel; quality WebP otherwise
- **Storage:** `uploads/institutions/{id}/logo.webp`, served at `/uploads/institutions/{id}/logo.webp`
- **Limit:** 5 MB; PNG, JPEG, WebP, GIF

## Related modules

- [memberships.md](./memberships.md) — assign admins and teachers to an institution
- [academic-transitions.md](./academic-transitions.md) — school-year transitions and active period

## Frontend

| Feature | Routes |
|---------|--------|
| Institutions | `/institutions`, `/institutions/new`, `/institutions/[id]/edit` |
| Institution settings | `/institutions/[id]/settings` |
| Institution members | `/institutions/[id]/members` |
| Academic transitions | `/institutions/[id]/transitions` |

UI copy is Spanish. **Color pickers** (native + hex input) for primary/secondary colors. **Logo file upload** on settings and edit pages. Theme uses CSS variables; branding preview uses institution colors with fallbacks to design tokens (dark/light compatible).

## Related

- [memberships.md](./memberships.md)
- [academic-transitions.md](./academic-transitions.md)
- [tenancy-strategy.md](./tenancy-strategy.md) — future multi-institution approach
- [database.md](./database.md) — Prisma relationships
- [academic-structure.md](./academic-structure.md) — levels, grades, courses
