# Backend conventions

Summary of standards for `BackendZerocademy/`. Full detail: [`BackendZerocademy/agent.md`](../BackendZerocademy/agent.md).

## Module layout

```
src/modules/<domain>/
├── <domain>.module.ts
├── <domain>.controller.ts   # Thin, Swagger-documented
├── <domain>.service.ts      # Business logic + Prisma
├── dto/
└── mappers/                 # When mapping is non-trivial
```

## Naming

| Item | Convention |
|------|------------|
| Folders | kebab-case |
| Files | kebab-case |
| Classes | PascalCase |
| DTOs | `Create*Dto`, `*ResponseDto` |
| Permissions (future) | `resource:action` |

## API

- REST, plural resources under `/v1`
- Paginated lists mandatory
- Map Prisma → response DTOs (never expose `passwordHash`)
- Document every endpoint in Swagger

## Security

- Global `JwtAuthGuard` + `@Public()` for open routes
- `@Roles()` for role checks
- Re-validate user active/not deleted in `JwtStrategy`
- No secrets or tokens in logs

## Database

- Prisma migrations committed with schema
- Soft delete via `deletedAt` where applicable
- `$transaction` for multi-step writes

## Commits

`type[Backend]: message` — lowercase, no co-author lines.
