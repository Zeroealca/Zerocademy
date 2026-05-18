---
name: logging-error-handling-skill
description: Applies structured logging and NestJS exception patterns in BackendZerocademy. Use when adding logs, error handling, filters, or debugging API failures.
---

# Logging & Error Handling Skill

## Prerequisites (read first)

1. [`BackendZerocademy/agent.md`](../../../BackendZerocademy/agent.md) — logging section
2. `src/common/logger/app-logger.service.ts`
3. `src/common/filters/http-exception.filter.ts`

## Logging

Use `AppLoggerService` with module context:

```typescript
this.logger.log('Resource created', {
  context: MODULE_CONTEXT,
  userId: actor.id,
  metadata: { resourceId: created.id },
});
```

- `metadata` for arbitrary ids (not top-level unknown fields)
- Levels: `log`, `warn`, `error`, `debug`
- Never log passwords, tokens, or full PII

## Exceptions

| Case | Exception |
|------|-----------|
| Not found | `NotFoundException` |
| Validation | `BadRequestException` |
| Forbidden policy | `ForbiddenException` |
| Conflict | `ConflictException` |
| Auth | `UnauthorizedException` |

- Messages safe for clients; details in logs
- Use domain-specific messages in Spanish only if product requires API messages in Spanish (default: English API messages, Spanish UI)

## Workflow

1. Inject `AppLoggerService` in service
2. Log at create/update/delete and security-sensitive denials
3. Throw Nest HTTP exceptions from service layer
4. Let global filter shape response — do not catch-and-swallow

## Anti-patterns

- `console.log` in production code
- Logging entire request bodies with secrets
- Generic `Error` without HTTP mapping
- Catching errors in controller without rethrow
