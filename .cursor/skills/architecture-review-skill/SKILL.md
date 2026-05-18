---
name: architecture-review-skill
description: Reviews changes against Zerocademy architecture before merge or PR. Use when completing a feature, reviewing a PR, or validating modular boundaries and security.
---

# Architecture Review Skill

## Prerequisites (read first)

1. [`agent.md`](../../../agent.md)
2. [`docs/architecture.md`](../../../docs/architecture.md)
3. Layer agent: `BackendZerocademy/agent.md` or `FrontendZerocademy/agent.md`

## Checklist

### Boundaries

- [ ] No frontend business rules (grades, eligibility, period logic)
- [ ] Backend module does not import sibling modules deeply
- [ ] Feature slice does not import other features deeply
- [ ] Domain listed in registry if new

### Backend

- [ ] Controller thin; logic in service
- [ ] DTOs + Swagger on all routes
- [ ] `@ApiRequireRoles` only on methods, not class
- [ ] RBAC in guard + service where needed
- [ ] Prisma only in service/repository layer
- [ ] Structured logging on mutations

### Frontend

- [ ] UI strings in Spanish
- [ ] Server state via TanStack Query
- [ ] Permissions checked before render
- [ ] Theme tokens (no hardcoded colors)
- [ ] Loading/error/empty states

### Data & security

- [ ] Migration applied; schema matches docs
- [ ] No secrets in repo
- [ ] Actor passed for scoped mutations

### Docs

- [ ] [`documentation-sync-skill`](../documentation-sync-skill/SKILL.md) satisfied

## Output format

```markdown
## Architecture review: <feature>

### Pass
- ...

### Issues (must fix)
- ...

### Suggestions (optional)
- ...
```

## Anti-patterns to flag

- God services/controllers
- Cross-layer leaks
- Undocumented API routes
- English UI copy on user-facing screens
