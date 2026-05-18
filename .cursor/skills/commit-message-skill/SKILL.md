---
name: commit-message-skill
description: Generates conventional git commit messages for Zerocademy monorepo changes. Use when the user asks to commit, or when preparing a commit message after completing work.
---

# Commit Message Skill

## Prerequisites

- Run `git status`, `git diff`, `git log -1` before committing
- Only commit when the user explicitly requests it
- Never commit `.env` or secrets

## Format

```
<type>(<scope>): <imperative summary>

<optional body — why, not what>
```

**Types:** `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `perf`, `build`

**Scopes:** `backend`, `frontend`, `prisma`, `docs`, `rbac`, `docker`, or domain name (`academic-periods`)

## Examples

```
feat(backend): add academic periods CRUD and term management

feat(frontend): add academic periods dashboard feature

fix(backend): avoid ApiRequireRoles on controller class for Swagger

docs: document RBAC super-admin visibility rules
```

## Workflow

1. Review staged + unstaged changes
2. One logical change per commit when possible
3. Use HEREDOC for multi-line messages
4. Verify `git status` clean after commit

## Anti-patterns

- Vague messages (`fix stuff`, `wip`)
- Committing unrelated changes together
- Amending pushed commits without user request
