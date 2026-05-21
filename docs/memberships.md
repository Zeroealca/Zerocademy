# Institution memberships

## Purpose

Links **users** to **institutions** with an institution-scoped role. Admins and teachers must belong to an institution before operating on that school's academic data.

The design supports future **multi-institution** and **multi-role** membership without schema changes beyond the `role` enum.

## Data model

### InstitutionMembership

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | Primary key |
| `institutionId` | UUID | FK → Institution |
| `userId` | UUID | FK → User |
| `role` | `InstitutionMembershipRole` | `ADMIN`, `TEACHER` |
| `isActive` | Boolean | Soft gate for access |
| `createdAt`, `updatedAt` | DateTime | Audit |

**Constraints:** `@@unique([institutionId, userId])` — one membership row per user per institution.

### Enum: InstitutionMembershipRole

- `ADMIN` — institution administrator (must match `User.role = ADMIN` or `SUPER_ADMIN`)
- `TEACHER` — teaching staff (must match `User.role = TEACHER`)

## Relationships

```
Institution ↔ InstitutionMembership ↔ User
```

When a **teacher** membership is assigned or activated, `TeacherProfile.institutionId` is synchronized to the institution for staffing consistency.

## API (`/v1/institutions/:institutionId/memberships`)

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/` | SUPER_ADMIN, ADMIN | Paginated list (filters: role, isActive, search) |
| GET | `/:membershipId` | SUPER_ADMIN, ADMIN | Detail |
| POST | `/` | SUPER_ADMIN, ADMIN | Assign user |
| PATCH | `/:membershipId` | SUPER_ADMIN, ADMIN | Update role / flags |
| POST | `/:membershipId/activate` | SUPER_ADMIN, ADMIN | Activate |
| POST | `/:membershipId/deactivate` | SUPER_ADMIN, ADMIN | Deactivate |
| DELETE | `/:membershipId` | SUPER_ADMIN, ADMIN | Remove membership |

OpenAPI tag: `institution-memberships`.

## Business rules

1. User **global role** must be compatible with membership role (`ADMIN`/`SUPER_ADMIN` for `ADMIN`, `TEACHER` for `TEACHER`).
2. Duplicate `(institutionId, userId)` assignments are rejected.
3. Deactivating a membership does not delete the user account.
4. Removing a membership clears teacher profile institution link when applicable.

## Logging

Structured events on `InstitutionMembershipsService`:

- `INSTITUTION_MEMBERSHIP_ASSIGNED`, `INSTITUTION_MEMBERSHIP_UPDATED`
- `INSTITUTION_MEMBERSHIP_ACTIVATED`, `INSTITUTION_MEMBERSHIP_DEACTIVATED`
- `INSTITUTION_MEMBERSHIP_REMOVED`
- `INSTITUTION_MEMBERSHIP_VALIDATION_FAILED`

No passwords or tokens in logs.

## Frontend

| Route | Feature |
|-------|---------|
| `/institutions/[id]/members` | `institution-memberships` |

UI: member table, assign admin/teacher form, activate/deactivate, filters by role and search.

Permissions: `canViewInstitutionMemberships`, `canManageInstitutionMemberships` in `lib/permissions.ts`.

## Future extensibility

- Additional `InstitutionMembershipRole` values (e.g. `COORDINATOR`) without new tables.
- Multiple active memberships per user across institutions (already supported by unique constraint scope).
- Institution-scoped RBAC guards that check membership in addition to global `User.role`.
