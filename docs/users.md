# Users module

## Overview

The **users** module manages account records, roles, and active/inactive state. It is separate from **auth**, which handles credentials and tokens.

## Roles

| Role | Purpose |
|------|---------|
| `SUPER_ADMIN` | Full platform administration |
| `ADMIN` | Institution-level administration |
| `TEACHER` | Teaching staff |
| `STUDENT` | Student accounts |

Roles are stored on the `User` model as a Prisma enum. Future RBAC may add permission matrices; guards currently use role checks.

## Endpoints

All routes require JWT and `@Roles(SUPER_ADMIN, ADMIN)`.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/users` | Paginated list (`page`, `limit`, `role`, `isActive`, `search`, `sortBy`, `sortOrder`) |
| GET | `/v1/users/:id` | Single user |
| POST | `/v1/users` | Create user |
| PATCH | `/v1/users/:id` | Update user |
| DELETE | `/v1/users/:id` | Soft-delete (`deletedAt`, `isActive: false`) |

## User lifecycle

- **Active** — `isActive: true`, `deletedAt: null` — can sign in.
- **Inactive** — `isActive: false` — cannot sign in; record retained.
- **Soft-deleted** — `deletedAt` set — excluded from lists and auth; refresh tokens revoked.

## Response shape

List responses follow the monorepo contract:

```json
{
  "data": [ /* UserResponseDto[] */ ],
  "meta": { "page": 1, "limit": 20, "total": 0, "totalPages": 0 }
}
```

## Module layout

```
BackendZerocademy/src/modules/users/
├── users.module.ts
├── users.controller.ts
├── users.service.ts
├── dto/
└── mappers/user.mapper.ts
```

Business logic stays in `UsersService`; controllers remain thin and Swagger-documented.

## Frontend

Route `/users` (`SUPER_ADMIN`, `ADMIN`). Create form and directory share the page.

The directory toolbar maps to `GET /v1/users` query params:

| Control | Query | Behavior |
|---------|-------|----------|
| Buscar | `search` | Case-insensitive match on email, first name, or last name. The input is debounced (500 ms) before querying |
| Rol | `role` | Exact role. ADMIN cannot select or list `SUPER_ADMIN` |
| Estado | `isActive` | Active, inactive, or all |
| Orden | `sortBy`, `sortOrder` | Column headers **Rol** and **Estado**. `sortBy`: `role` \| `isActive` \| `createdAt`. `sortOrder`: `asc` \| `desc`. Default is `createdAt desc`. Role order follows the Prisma enum (`SUPER_ADMIN` → `REPRESENTATIVE`). Status `desc` lists active first |
| Paginación | `page`, `limit` | Default 10 per page; **Anterior** / **Siguiente** when `totalPages > 1` |

Empty results show «No se encontraron usuarios.» Changing a filter or sort resets to page 1. Duplicate email on create shows «Este correo ya está registrado.»
