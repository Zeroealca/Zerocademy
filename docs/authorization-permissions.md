# Authorization & Permissions Architecture Spike

## Status and decision record

This is an analysis and design artifact, not an implementation. It records the target authorization architecture to introduce after Phase 2C without changing current production behavior. The repository does not use Architecture Decision Records (ADRs), so this document follows the existing topic-document convention.

External tracking: [DEMY-121 — Authorization & Permissions Architecture Spike](https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-121) and its concise [Confluence architecture summary](https://emilioandresalcivarcarrera.atlassian.net/wiki/spaces/DDS/pages/10223619/Authorization+Permissions+Architecture+Spike). Phase 4: [DEMY-125](https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-125) / [Confluence Phase 4](https://emilioandresalcivarcarrera.atlassian.net/wiki/spaces/DDS/pages/10747906/Authorization+Phase+4+InstitutionMembership+Permission+Profile+Assignment+Foundation). Phase 5: [DEMY-127](https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-127) / [Confluence Phase 5](https://emilioandresalcivarcarrera.atlassian.net/wiki/spaces/DDS/pages/10747932/Authorization+Phase+5+Profile-Aware+Effective+Permission+Resolution). Phase 6: [DEMY-128](https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-128) / [Confluence Phase 6](https://emilioandresalcivarcarrera.atlassian.net/wiki/spaces/DDS/pages/10715138/Authorization+Phase+6+ClassSession+Read+Dual-Evaluation+Pilot). Phase 7: [DEMY-129](https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-129) / [Confluence Phase 7](https://emilioandresalcivarcarrera.atlassian.net/wiki/spaces/DDS/pages/10682392/Authorization+Phase+7+ClassSession+Read+Permission+Enforcement+Pilot). Phase 8: [DEMY-130](https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-130) / [Confluence Phase 8](https://emilioandresalcivarcarrera.atlassian.net/wiki/spaces/DDS/pages/10682411/Authorization+Phase+8+Neon+Migration+Drift+Reconciliation+Authorization+Schema+Deployment). Architectural debt for multi-institution Role: [DEMY-126](https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-126).

## Implemented authorization foundation

Phase 1 implements the code-defined `Permission` catalog, explicit role allowed and baseline maps, and an in-memory `EffectivePermissionResolver` under `BackendZerocademy/src/common/rbac/`. Effective permissions currently resolve as `Allowed(role) intersect Baseline(role)`. The resolver is a read-only parity foundation: it has no Prisma dependency, does not resolve resource scope, and is not wired to guards, controllers, or production authorization decisions. Existing RBAC remains authoritative.

Implemented verification covers catalog uniqueness, catalog-to-role-map validity, `baseline subset of allowed` for every role, expected capability resolution for every role, and explicit strict operational exclusions for `SUPER_ADMIN`.

Phase 2 adds durable `Permission` rows and `RoleAllowedPermission` role-boundary rows. The seed synchronizes code to database transactionally: it upserts every canonical catalog key and reconciles each role's current allowed relationships. Permission records are additive; removed or renamed code keys require an explicit data migration so historical rows are not blindly deleted. Stale role relationships are removed because they must never broaden a current role boundary. The database remains a mirror, not a source for inventing permissions or broadening roles.

Still not implemented: profiles, membership grants, delegation, permission editing APIs, audit persistence, JWT claims, permission guards/enforcement, or frontend permission UX. Baseline permissions remain code-defined for current compatibility parity.

## Phase 3 system permission profiles

Phase 3 adds code-defined, system-owned live `PermissionProfile` compositions for `ADMIN_BASELINE` and `TEACHER_BASELINE`. Each profile is role-bound and exactly mirrors that role's current baseline permissions. The seed synchronizes profile metadata and profile-permission relationships transactionally, removing stale composition rows but retaining profile rows for safe future retirement. STUDENT, REPRESENTATIVE, and SUPER_ADMIN remain controlled by their existing code baselines. Profiles do not participate in authorization resolution or enforcement.

## Phase 4 membership profile assignment foundation

Phase 4 adds an optional `InstitutionMembership.permissionProfileId` foreign key (at most one profile per membership) and a domain `PermissionProfileAssignmentService`. Compatibility is transitional and uses the current authoritative `User.role`:

```text
User.role
    ↓
validates compatibility
    ↓
InstitutionMembership
    ↓
optional PermissionProfile
```

Runtime authorization still uses:

```text
User.role
    ↓
code-defined baseline
    ↓
EffectivePermissionResolver
```

Assignment validates membership/profile existence, Role compatibility (`membership.user.role === profile.role`), and that the profile is a known system baseline (`ADMIN_BASELINE` / `TEACHER_BASELINE`). Caller authorization (who may assign) is intentionally out of scope. Assigned profiles use `onDelete: Restrict` so configuration cannot silently disappear. Existing memberships may remain null; seed backfill idempotently assigns matching system baselines to null ADMIN/TEACHER memberships after profile sync. Automatic assignment on new membership creation is deferred so production membership flows stay decoupled from pending permission migrations. A missing assignment must not reduce access because profiles are not authoritative yet.

Architectural debt (explicit, not solved here): global `User.role` cannot naturally express ADMIN in Institution A and TEACHER in Institution B. Future multi-institution Role evolution may move Role context onto `InstitutionMembership`; Phase 4 must not cement global Role as the final model. Tracked as [DEMY-126](https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-126).

## Phase 5 profile-aware effective permission resolution

Phase 5 extends `EffectivePermissionResolver` with membership-aware resolution while preserving the legacy Role/baseline API.

Transitional resolution model:

```text
InstitutionMembership
        ↓
authoritative User.role
        ↓
assigned profile?
   ↙             ↘
 yes              no
 ↓                 ↓
live profile     baseline fallback
permissions      Allowed ∩ Baseline
   ↘             ↙
Code Role Allowed Ceiling
        ↓
Effective Permissions
```

Profile-assigned path: `Effective = CodeAllowed(User.role) ∩ live PermissionProfilePermission keys`. Null-profile path uses the Phase 1 baseline fallback so missing assignments do not reduce access during migration. Persisted Role/profile incompatibility fails closed with a domain `BadRequestException` and never grants the incompatible profile. Untrusted or non-system profiles are rejected. Unknown memberships return `NotFoundException` and do not baseline-fallback. Inactive memberships still resolve for configuration inspection; production access helpers already require `isActive` separately. Dual evaluation via `compareMembershipResolution` is internal/test-only.

**This result is not yet used for endpoint authorization.** Existing RBAC (`RolesGuard`, strict routes, ownership, institution isolation, lifecycle rules) remains authoritative. No JWT permission claims, no `@RequirePermission`, no direct grants, no frontend changes. DEMY-126 remains unresolved.

## Phase 6 ClassSession READ dual-evaluation pilot

Phase 6 instruments ClassSession **READ** only (`list` and `one` under `teacher-assignments/:id/class-sessions`) with non-blocking dual evaluation of the canonical permission `class_sessions.read`.

Request flow (historical Phase 6 observation):

1. Load TeacherAssignment (institution context).
2. Observe membership-aware capability for the assignment institution (telemetry only).
3. Apply existing legacy RBAC / ownership / institution isolation (authoritative).
4. Return data or throw according to legacy rules only.

Membership selection uses the active `InstitutionMembership` for `(actor.userId, assignment.institutionId)` — never the first/random membership. SUPER_ADMIN is `NOT_APPLICABLE` (no fake membership). Outcomes: `MATCH`, `MISMATCH`, `NOT_APPLICABLE`, `ERROR`. Capability comparison does not replace resource scope (e.g. another teacher's assignment may still 404 while capability MATCH). Profile-aware errors are isolated and never alter HTTP responses. Structured event: `AUTHORIZATION_DUAL_EVALUATION`. No schema/migration, JWT, frontend, or enforcement decorator. Phase 2–4 Neon authorization schema is applied (see Phase 8).

## Phase 7 ClassSession READ permission enforcement pilot

Phase 7 is the **first production permission enforcement**. It enforces `class_sessions.read` on the same ClassSession READ surface only:

- `GET /v1/teacher-assignments/:teacherAssignmentId/class-sessions`
- `GET /v1/teacher-assignments/:teacherAssignmentId/class-sessions/:classSessionId`

Transitional authorization equation:

```text
Legacy Role/resource authorization
             ↓
          ALLOW?
          /    \
        no      yes
        ↓        ↓
      DENY    class_sessions.read
                    ↓
                 ALLOW?
                 /    \
               no      yes
               ↓        ↓
             DENY     ALLOW
```

Ordering (isolation-preserving):

1. Load TeacherAssignment safely.
2. Apply legacy Role + ownership + institution scope (mandatory security floor).
3. If legacy denies → preserve existing denial (`404` where established); do not evaluate permissions.
4. If legacy allows → resolve active membership for `(actor.id, assignment.institutionId)`.
5. Evaluate profile-aware `class_sessions.read` (null profile → Phase 5 baseline fallback).
6. If permission missing / required membership missing / resolver configuration fails → fail closed with `ForbiddenException('Access denied')`.
7. SUPER_ADMIN remains `NOT_APPLICABLE` (legacy ClassSession read rules only; no synthetic membership).

Critical invariants:

- Permission may **restrict** access previously allowed by legacy.
- Permission must **never broaden** access denied by legacy.
- `class_sessions.read` is capability only; it does not replace TeacherAssignment ownership, institution scope, nesting, or lifecycle rules.
- No global `PermissionsGuard`, no JWT permission claims, no frontend permission UX, no schema/migration in Phase 7.
- Enforcement telemetry event: `AUTHORIZATION_PERMISSION_ENFORCEMENT` with decisions `ALLOWED` / `DENIED` / `NOT_APPLICABLE` / `ERROR`.
- Shared membership capability evaluation is reused by Phase 6 observation and Phase 7 enforcement (`MembershipPermissionEnforcer`).

**Deployment readiness (Phase 8):** Phase 2–4 Neon authorization migrations are applied and authorization seed synchronization completed on the identified Neon database. The earlier “modified historical migration” blocker was checksum-only drift from Windows CRLF checkout of LF migration files; reconciliation preserved data and migration history. Application/runtime deployment remains a separate step; Phase 7 ClassSession READ enforcement can now be validated in-environment.

Still not implemented: ClassSession write enforcement, AcademicPlan/Attendance/Grades permission enforcement, ADMIN delegation, institution-owned profiles, direct membership grants, frontend permission UX, or Role migration onto memberships (DEMY-126).

### Finalized product decisions

- Permission Profiles use **live** semantics when they are introduced.
- STUDENT and REPRESENTATIVE permissions remain system-controlled and are not administratively configurable initially.
- Future ADMIN delegation is limited to eligible TEACHER permission profiles/grants in the same institution; it never includes ADMIN, self, STUDENT, or REPRESENTATIVE targets.
- Permission/security audit events will be retained indefinitely initially; a later archival policy may be added.
- SUPER_ADMIN is not an implicit universal operational role. The baseline explicitly preserves current strict-route exclusions.

### Agreed product direction

`Role -> allowed permission catalog -> permission profile -> effective permissions -> resource scope -> domain/lifecycle rules`

Roles remain a non-negotiable security boundary. This is not unrestricted per-user RBAC replacement.

### Architectural recommendations in this document

- Store catalog permissions and the role-to-catalog boundary in code, seed them into database reference rows, and validate deployments against the code catalog.
- Attach institutional effective permissions and profiles to `InstitutionMembership`, not `User` or academic profiles.
- Use live permission profiles with additive, membership-local direct grants; do not introduce explicit denies in the first version.
- Load effective permissions server-side once per request. Do not put them in JWT access tokens.
- Keep resource scopes and domain/lifecycle validation in domain services and scoped Prisma queries.

### Non-goals

- No Prisma model, migration, seed, guard, decorator, JWT, frontend, or production-RBAC change is made by this spike.
- It does not define a free-form customer-editable permission catalog.
- It does not make the frontend an authorization authority.
- It does not redesign academic lifecycle rules or replace ownership validation.

## Current authorization architecture

The current model is a single global `User.role`: `SUPER_ADMIN`, `ADMIN`, `TEACHER`, `STUDENT`, or `REPRESENTATIVE`. `InstitutionMembership` adds an active, institution-scoped `ADMIN` or `TEACHER` role, with `@@unique([institutionId, userId])`. Academic profiles also carry an optional `institutionId`; this is a legacy/default context, not a sufficient multi-institution permission anchor.

Request flow today is:

```text
JWT access token -> JwtStrategy reloads active user from DB
 -> JwtAuthGuard -> RolesGuard (@Roles / @ApiRequireRoles)
 -> controller -> domain service role, ownership, and institution checks
 -> Prisma scoped query / mutation -> domain lifecycle validation
```

`RolesGuard` uses `RoleUtils.hasRole`. `SUPER_ADMIN` bypasses ordinary role lists; `StrictRoles` prevents that bypass on selected institution-operational routes. The JWT contains `sub`, email, role, profile identity/type, and a profile-derived `institutionId`, but `JwtStrategy` reloads the user every request. It does not contain permissions.

### Current strengths

- The backend is authoritative; frontend helpers are explicitly cosmetic.
- Services frequently re-check resource ownership and institution membership after route-level RBAC.
- `assertActorCanAccessInstitution`, `resolveActorInstitutionIds`, student scope helpers, teacher-assignment ownership, and representative relationship checks already demonstrate the required scopes.
- Several sensitive cross-tenant paths intentionally return `404` to avoid resource enumeration.
- Existing lifecycle controls are already separate from role checks.

### Current pain points

- Capability policy is duplicated between `common/rbac/rbac-role-sets.ts`, controller decorators, service `Role` conditionals, `RoleUtils`, documentation, and `FrontendZerocademy/src/lib/permissions.ts`.
- The `SUPER_ADMIN` implicit bypass is useful today but makes role arrays ambiguous: a reader must know whether a route is strict to understand access.
- A global role plus profile-level institution ID cannot express different permission profiles for one person in multiple institutions.
- Role helpers such as `canManageAttendance` and `canManageUsers` communicate only a broad role result, not operation, scope, or lifecycle eligibility.
- Scope logic is correctly domain-specific but repeated manually, so a capability migration must not try to force all resource checks into a generic guard.

## Target model and terminology

| English code term | Spanish UI term | Meaning |
| --- | --- | --- |
| Role | Rol | Non-configurable security boundary of a user category. |
| Permission | Permiso | Capability: what action is permitted. |
| Permission profile | Perfil de permisos | Reusable compatible collection of permissions. |
| Effective permissions | Permisos efectivos | Resolved capabilities for one membership context. |
| Delegation authority | Autoridad de delegación | Permissions an actor may assign, bounded by policy. |
| Resource scope | Alcance de recursos | Which records a valid capability may affect. |
| Domain/lifecycle rule | Regla de dominio/ciclo de vida | Non-authorization condition that remains mandatory. |

Permission identifiers use lowercase dot namespaces, stable domain nouns, and business actions rather than routes or HTTP verbs: `students.create`, `academic_planning.publish`, `class_sessions.update`. Plural domain names should follow existing module/public vocabulary; `academic_planning` and `academic_execution` intentionally remain underscores because the identifier is not a URL.

Module visibility is derived from effective permissions: a module can be shown if the current context has at least one UX-relevant permission for it. There must be no separately editable `moduleAccess` flag. A route/action may still be hidden after a scope-aware data load, and the backend always decides final access.

## Role boundaries and delegation

The code-defined catalog includes `allowedRoles` for every permission. Permission resolution intersects all grants with the current membership role's catalog; UI filtering is advisory only. A `TEACHER` can never receive `institutions.update` or an administration permission merely because an administrator selected it.

| Actor | May configure | Never may configure |
| --- | --- | --- |
| `SUPER_ADMIN` | Compatible `ADMIN` profiles/effective permissions for an active ADMIN membership; system catalog and system profiles through source-controlled deployment | Any permission outside ADMIN's catalog |
| `ADMIN` with a delegation capability | Compatible lower-role memberships in the same institution, only through its own delegation allow-list | Another ADMIN, itself, a cross-institution recipient, an incompatible profile, or a permission it cannot delegate |
| `TEACHER`, `STUDENT`, `REPRESENTATIVE` | None in v1 | Any permission assignment |

Delegation is **not** inferred from every permission. Catalog metadata declares a finite `delegableToRoles` set only for dedicated capabilities such as `permissions.teachers.manage` and `permissions.students.manage`; it also declares a fixed `delegablePermissionIds` set (or named bounded set). On every assignment the service verifies: actor membership is active in the same institution; recipient is not actor; recipient role is eligible; target is not `ADMIN`; requested profile/grants are within the recipient catalog *and* actor delegation set. The assignment service, not the UI, performs all checks in one transaction.

This is deliberately a directed, acyclic delegation graph: SUPER_ADMIN -> ADMIN -> lower roles. There is no `permissions.admins.manage`, no self-assignment, no role editing through this feature, and no delegation derived from a recipient's effective permissions.

## Permission profiles and effective resolution

### Recommended semantics: live profile + additive direct grants

`PermissionProfile` remains attached to a membership. Updating a profile changes affected active memberships after the next authorization resolution. Membership-local direct grants are optional additions for exceptional cases; they are still constrained by the role catalog and delegation policy. No explicit deny is introduced.

| Model | Result | Assessment |
| --- | --- | --- |
| Live profile | Profile change reaches all assigned memberships | Recommended: reusable, auditable, and practical for institution operations. |
| Copy-on-assignment | Profile is only a template | Safer from surprise changes but creates drift and makes bulk policy changes costly. |
| Hybrid with grants and denies | Live profile plus arbitrary overrides | Denies require precedence, explainability, and audit complexity not justified by current evidence. |

The recommended model is a constrained hybrid only in the sense of **live profile plus additive grants**. Direct grants must be exceptional, displayed distinctly, and never compensate for a missing baseline profile. A profile change preview must list affected memberships and before/after permissions; confirmation and an audit event are mandatory. This handles the primary live-profile safety concern without deny precedence.

### Deterministic permission resolution

For a request with selected/derived institution `I` and active membership `M`:

1. Authenticate the active `User`; resolve the applicable active `InstitutionMembership` for `I`. Platform-only operations may use a documented system context instead.
2. Load role `R` from the membership (and verify it is compatible with the global user role during the migration period).
3. Load the code/seed catalog set `Allowed(R)`.
4. Load the membership's active profile permissions `Profile(M)` and approved direct grants `Direct(M)`.
5. Compute `Effective(M) = Allowed(R) intersect (Profile(M) union Direct(M))`.
6. A route-level capability test asks whether its required permission is in `Effective(M)`.
7. A domain service applies resource scope and lifecycle/domain rules. It may return `404` where the existing anti-enumeration policy requires it.

System/bootstrap profiles seeded for current users preserve current role behavior before any manual assignment. If no profile is assigned during rollout, the resolver uses the seeded role baseline; it must never resolve to an empty set accidentally.

## Permission, scope, and lifecycle separation

Permissions answer **what**; scopes answer **which resources**. Domain rules answer **whether this resource is currently valid for the operation**.

| Example | Capability | Resource scope | Domain/lifecycle rules |
| --- | --- | --- | --- |
| Update an academic plan | `academic_planning.update` | `OWN_TEACHER_ASSIGNMENTS` | teacher owns plan; plan is `DRAFT`; period is not `CLOSED` (and future policy should also treat `ARCHIVED` read-only). |
| Create/update a class session | `class_sessions.create` / `.update` | `OWN_TEACHER_ASSIGNMENTS` | assignment period is not `CLOSED`/`ARCHIVED`; dates are in period; linked LessonPlan is compatible. |
| Read grades | `grades.read` | own student, representative-linked student, own assignments, or own institution according to role | assessment/enrollment relation integrity. |
| Review attendance justification | `attendance_justifications.review` | `OWN_INSTITUTION` | status is `PENDING`; transition is valid; period state permits the change. |

Current lifecycle gates that remain outside permission resolution include AcademicPeriod `CLOSED`/`ARCHIVED`; AcademicPlan `DRAFT` versus `PUBLISHED`; plan/term/date bounds; ClassSession status/date requirements and assignment-compatible LessonPlan linkage; active enrollment and roster/date integrity; AttendanceJustification pending-only review and one-pending constraint; and active catalog/course/teacher prerequisites. These rules remain in their owning services/validators.

## Backend architecture

### Target request flow

```text
Authentication and active-user validation
 -> resolve request institution/membership + effective permissions once
 -> @RequirePermission capability metadata / PermissionsGuard
 -> service loads or scopes the domain resource
 -> domain scope policy
 -> lifecycle/domain validation
 -> operation
```

Future developer API (illustrative; not implemented):

```ts
@RequirePermission('students.create')
createStudent(@CurrentUser() actor, @Body() dto) {
  return this.students.create(actor, dto);
}

// Resource-dependent checks stay close to the resource.
await authorizationService.assertCan(actor, 'academic_planning.update', {
  kind: 'academic-plan', plan,
});
```

Representative mappings:

| Operation | Guard metadata | Service responsibility |
| --- | --- | --- |
| Create student | `students.create` | Resolve target institution/membership; validate tenant and student lifecycle. |
| Read AcademicPlan | `academic_planning.read` | Own teacher assignment / institutional oversight / platform scope. |
| Update AcademicPlan | `academic_planning.update` | Own teacher assignment, DRAFT state, period lifecycle. |
| Create ClassSession | `class_sessions.create` | Own assignment, mutable period, date and LessonPlan compatibility. |
| Update ClassSession | `class_sessions.update` | Same assignment ownership and mutable-period/domain checks. |
| Read grades | `grades.read` | Student self, representative link, teacher assignment, or institution scope. |
| Write grades | `grades.write` | Teacher assignment ownership, assessment/enrollment validation. |

Guards/decorators perform authentication-independent capability checks using already resolved request context. Services own resource loading, scoped Prisma filters, and policies that require domain context. Query methods should accept a scope predicate/context constructed once and use it in Prisma `where` clauses; mutation services load a minimum projection then validate exactly once. Do not duplicate the same ownership query in both a guard and service, and do not put resource-rich policies in guards.

During migration, `@RequirePermission` should coexist with the current roles guard behind per-module parity checks. Do not delete current role sets or `StrictRoles` until the migrated module proves role-equivalent behavior.

### JWT/session decision

Keep the JWT lean: identity and short-lived authentication claims only. Load effective permissions server-side on each authenticated request, resolving the relevant membership once and attaching a typed authorization context to the request. This fits the existing `JwtStrategy` user reload and immediately reflects membership/profile changes without token revocation choreography.

Embedding permissions in a JWT makes navigation fast but risks stale grants, token growth, cross-institution ambiguity, and slow revocation. A future hybrid may return a non-authoritative permission summary in `/auth/me` (or a dedicated session-context endpoint) for frontend UX, versioned with `membershipId`, `institutionId`, and a permission revision. It must never be accepted by the backend as proof of authorization. For current scale, request-scoped joins plus a small process-local cache keyed by membership/revision are sufficient; do not add Redis prematurely.

## Frontend architecture

The frontend should replace role-named helpers gradually with `can('academic_planning.read')`, `can('class_sessions.update')`, and `canAny([...])` backed by the backend-provided non-authoritative session summary. Navigation uses `canAny(modulePermissions)`; buttons/actions use a specific capability; resource-sensitive controls additionally use safe facts returned by the API, such as `isReadOnly`, `isOwner`, or a scoped resource policy summary. The frontend must not attempt to calculate teacher-assignment, relationship, or lifecycle authorization from local state.

`DashboardSidebar` currently derives every entry from `lib/permissions.ts` role predicates. Migrate each entry to a declared permission group while preserving the current route guard and API result handling. A hidden item or disabled action is affordance only; a `403`/`404` or lifecycle error remains a normal backend response that the UI handles clearly.

## Proposed persistence model (conceptual Prisma level)

No model below has been implemented.

| Entity | Purpose and key fields | Constraints, ownership, deletion/indexes |
| --- | --- | --- |
| `Permission` | Seeded catalog row: stable `id`/`code`, `module`, Spanish label/description, active/deprecated metadata. | `@unique(code)`; global/system owned; restrict deletion, deprecate instead; index module/active. |
| `RoleAllowedPermission` | System-controlled role boundary: `role`, `permissionId`. | Unique `(role, permissionId)`; global; cascade from permission only in controlled migration; index role. |
| `PermissionProfile` | Reusable profile: `id`, name, description, compatible `role`, optional `institutionId`, `isSystem`, `isActive`, revision. | System profile has null institution; institution profile requires institution; unique normalized name per `(institutionId, role)`; restrict deletion while assigned, prefer archive; indexes institution/role/active. |
| `PermissionProfilePermission` | Profile-to-permission membership. | Unique `(profileId, permissionId)`; FK cascade from profile; restrict/deprecate permission removal; index permission. |
| `InstitutionMembershipPermissionProfile` | One current profile assignment for an institutional membership, with assignedBy/assignedAt. | Unique `institutionMembershipId`; cascade when membership is removed; index profile. A history/audit event preserves previous state. |
| `InstitutionMembershipPermissionGrant` | Exceptional additive direct effective permission, with grantor and optional reason. | Unique `(institutionMembershipId, permissionId)`; cascade with membership; index permission; service validates role catalog/delegation. |
| `PermissionAuditEvent` | Immutable security event projection: actor/user/membership/institution, action, target, before/after permission codes, profile IDs, correlation/request ID, reason, timestamp. | Append-only; restrict user/profile deletion or retain safe identifiers; indexes institution/time, membership/time, actor/time, event type/time. |

`InstitutionMembership` is the correct attachment point for ADMIN/TEACHER permissions because it already carries the institution, role, active state, and supports multiple institutions. Attachments to `User` would leak access across institutions; attachments to `TeacherProfile`/`StudentProfile` would conflate academic identity with a configurable authorization context. Student and representative access is currently relationship/profile scoped, not membership-backed; the first migration should preserve their baseline role behavior and only create membership-based permissions for them if the product later makes them institutional operators. This is an open modeling boundary, not a reason to force a false universal membership now.

Profiles should support both ownership modes: source-controlled global system defaults and institution-owned profiles for lower roles. SUPER_ADMIN manages system/ADMIN profiles; an institution administrator may create/use only institution-local profiles compatible with delegated lower roles. Institution profiles cannot include global catalog permissions outside their target role boundary.

## Catalog, audit, bulk, and UI management

The catalog recommendation is **code-defined constants seeded into database reference rows**. Code is the source of truth for identifiers, compatibility, delegation metadata, and removal/rename migrations; database rows provide foreign keys, joins, discoverability, and UI labels. Deployment validates that catalog code and seeded rows match. A removed permission is deprecated first, remapped by a controlled migration/release, then removed only after no profiles/grants reference it.

Audited structured events include `PERMISSION_PROFILE_CREATED`, `PERMISSION_PROFILE_UPDATED`, `PERMISSION_PROFILE_ARCHIVED`, `MEMBERSHIP_PROFILE_ASSIGNED`, `MEMBERSHIP_PROFILE_REMOVED`, `MEMBERSHIP_PERMISSION_GRANTED`, `MEMBERSHIP_PERMISSION_REVOKED`, `PERMISSION_BULK_ASSIGNMENT_COMPLETED`, and `PERMISSION_ASSIGNMENT_DENIED`. Record actor/target membership and institution IDs, old/new profiles, old/new effective permission codes, reason, request/correlation ID, and bulk result counts; do not log sensitive unrelated profile data.

The management UI is a grouped module matrix, not an unstructured checkbox wall. SUPER_ADMIN selects an institution, sees ADMIN memberships and their profile/effective summary, and can choose only system-approved ADMIN profiles/capabilities. A delegated ADMIN sees only eligible lower-role memberships in its institution. Incompatible, undelegable, already-present, and scope-ineligible permissions are visible with a Spanish explanation but not selectable. A detail view explains effective permissions as “from profile” versus “additional grant.”

Bulk profile assignment accepts selected users only after server-side validation that every target has the same institution, compatible role, active membership, and is within the actor's delegation authority. Validate the whole selection first; if any target fails authorization or compatibility, return a per-target validation report and apply none. On success, use one transaction for all assignments and append individual audit events plus one bulk correlation event. This all-or-nothing policy avoids silent partial privilege changes; a future explicitly designed partial mode would require separate confirmation and audit semantics.

## Current-role parity matrix

Initial seeds map only discovered current capabilities; they do not grant new powers. “Scoped” means the existing service checks remain required.

| Current role | Discovered current behavior | Initial proposed permissions (representative groups) |
| --- | --- | --- |
| SUPER_ADMIN | Platform institutions, catalog, periods, memberships, users; broad monitoring reads; role bypass except strict operational routes | `institutions.*`, `platform_catalog.*`, `academic_periods.*`, `institution_memberships.*`, `users.*`, platform evaluation permissions, monitored reads, `permissions.admins.manage`; preserve exclusions from strict operational writes. |
| ADMIN | Active-membership institution operations: students/enrollments, courses/assignments, transitions, evaluation config; institution/scoped oversight reads | `students.*`, `enrollments.*`, `courses.*`, `teacher_assignments.*`, `academic_transitions.*`, `academic_evaluation.*`, scoped `academic_planning.read`, `class_sessions.read`, `grades.read`, attendance read/write as currently implemented; optional future `permissions.<lower-role>.manage` only when explicitly assigned. |
| TEACHER | Assigned-course/assignment reads; own planning and class-session writes; assessment/grade writes; attendance entry; selected-period context | `teacher_assignments.read`, `students.read`, `enrollments.read`, `academic_planning.read/create/update/publish/delete`, `class_sessions.read/create/update`, `assessments.*`, `grades.read/write`, `attendance.read/write`, selected-context permission, all constrained to owned assignments. |
| STUDENT | Own profile/enrollment/grades/performance/report/attendance history; selected period; attendance-justification submission | `students.read_own`, `enrollments.read_own`, `grades.read_own`, `academic_performance.read_own`, `report_cards.read_own`, `attendance.read_own`, `attendance_justifications.submit_own`, `academic_period_context.select`. |
| REPRESENTATIVE | Active linked-student academic reads and eligible absence justification submission | `representative_students.read`, `grades.read_linked`, `academic_performance.read_linked`, `report_cards.read_linked`, `attendance.read_linked`, `attendance_justifications.submit_linked`. |

Ambiguities requiring parity tests: current `PLATFORM_READ_ROLES` includes REPRESENTATIVE while several frontend route predicates exclude it; current frontend `canManageAttendance` permits ADMIN/SUPER_ADMIN even though the product narrative emphasizes teacher recording; several ordinary role predicates grant SUPER_ADMIN implicitly while frontend predicates are strict. The migration baseline must be generated from controller/service tests and documented policy, not from frontend helpers alone.

## Module/action inventory

| Module | Current access/scopes | Proposed capability family |
| --- | --- | --- |
| Institutions and settings | SUPER_ADMIN writes; ADMIN active-membership settings/read; 404 cross-tenant | `institutions.read/update`, `institution_settings.update` |
| Users and memberships | SUPER_ADMIN provisions/membership-manages; ADMIN user visibility excludes SUPER_ADMIN and assigns only student/representative today | `users.read/create/update`, `institution_memberships.read/manage` |
| Students and enrollments | ADMIN writes; teacher reads assigned course; student self; representative linked where supported | `students.read/create/update`, `enrollments.read/create/update`, `enrollments.bulk_create` |
| Courses, levels, grades, subjects | Global catalog writes are SUPER_ADMIN; courses/assignments institution operations; active/deactivate/delete rules | `academic_levels.*`, `grade_levels.*`, `subjects.*`, `courses.*` |
| Academic periods/terms/transitions | SUPER_ADMIN calendar lifecycle; staff context/read; institution transition scope | `academic_periods.read/manage`, `academic_terms.manage`, `academic_transitions.manage` |
| Teacher assignments | ADMIN operational mutation; teacher assigned read; period/institution ownership | `teacher_assignments.read/create/update/delete` |
| Academic evaluation | ADMIN institution configuration; TEACHER read; SUPER_ADMIN templates | `academic_evaluation.read/manage`, `academic_evaluation_templates.manage` |
| Academic planning | Teacher owns mutable DRAFT plans; ADMIN/institution and SUPER_ADMIN read; CLOSED is read-only | `academic_planning.read/create/update/publish/delete` |
| Academic execution | Teacher assignment owner writes; ADMIN institution read; SUPER_ADMIN read; CLOSED/ARCHIVED immutable | `class_sessions.read/create/update` |
| Grades/assessments/performance/reports | Teacher owns assessment/grade write; staff/institution monitoring; student self; representative linked where implemented | `assessments.read/create/update/delete`, `grades.read/write`, `academic_performance.read_*`, `report_cards.read_*` |
| Attendance and justifications | Teacher assignment scope; ADMIN institution; SUPER_ADMIN current access; student/representative own/linked history/submit; CLOSED/ARCHIVED immutable | `attendance.read/write`, `attendance_justifications.submit/review`, `attendance_reports.read` |

The catalog should start with these business operations and may split only when the repository has a different authorization requirement. It must not mirror every endpoint or distinguish HTTP `PATCH` from `PUT` without an actual business distinction.

## Incremental migration and compatibility

1. **Catalog and parity specification:** Add no enforcement change. Define code catalog, role boundaries, initial baseline profiles, current-role parity tests, and audit-event contract.
2. **Persistence and resolver foundation:** Add migrations/seeds in a future implementation; resolve membership context/effective permissions alongside existing RBAC, with seeded fallback baseline profiles for all existing users.
3. **Developer API:** Add permission metadata and authorization service behind feature flags/dual evaluation. Compare old role decision and new result in non-blocking telemetry for selected modules.
4. **Backend module migration:** Move one bounded module at a time—recommended first slice is Academic Planning/ClassSession read/write because ownership and lifecycle rules are explicit and well tested. Keep scopes in services.
5. **Frontend affordance migration:** Publish a non-authoritative context summary; migrate sidebar, routes, and action controls per completed backend module.
6. **Profiles/delegation management:** Implement system/institution profiles, SUPER_ADMIN ADMIN configuration, lower-role delegated management, bulk assignment, and audit screens after resolver parity is proven.
7. **Retirement:** Remove duplicated role predicates only after all routes have parity coverage, old/new decisions are reconciled, and strict-route semantics have explicit capability equivalents.

Backwards compatibility is a release gate: migration seeds one locked baseline profile per role representing the existing matrix and attaches it automatically to every eligible active membership. Resolver fallback uses this baseline for temporarily unassigned existing contexts. New UI cannot make a user lose current access merely because no administrator visited a permission screen.

## Security, testing, and performance

| Risk | Mitigation |
| --- | --- |
| Privilege escalation / self-grant | Directed delegation graph, actor != recipient, server-side catalog/delegation checks, immutable audit. |
| ADMIN changes another ADMIN | No ADMIN target in any ADMIN delegation policy; enforce role/membership target restriction in service. |
| Cross-institution grant | Assignment anchored to membership and transaction asserts actor/target same institution. |
| Incompatible profile | Profile compatible role and every profile permission validated against role catalog before save/assign. |
| Stale permission token | Server-side resolution; token holds no permission claim. |
| Deprecated permission reference | Code/seed validation, deprecation lifecycle, FK restrictions, startup/CI catalog check. |
| Live profile broadening | impact preview, confirmation, revision/audit, profile modification delegation policy. |
| Frontend-only enforcement | backend guard/service remains authoritative; negative API tests required. |
| Bulk partial authorization | preflight all targets then all-or-nothing transaction and audit. |
| Direct DB inconsistency | unique/FK constraints, service transactions, catalog validation, reconciliation job/report. |

Testing plan:

- **Unit:** catalog uniqueness/role boundaries, effective-resolution algorithm, profile compatibility, delegation predicate, permission naming/deprecation validation.
- **Service:** membership/institution isolation, direct grants, live profile revision effects, profile impact preview, bulk atomicity, resource-scope policies and lifecycle interaction.
- **Controller/API:** decorator guard behavior, old/new parity for each migrated operation, 401/403/404 policy, ADMIN self/peer denial, cross-institution IDOR attempts.
- **Integration:** Prisma constraints, seeded fallback profiles, transaction/audit persistence, multi-institution memberships, profile change invalidation.
- **Frontend:** `can`/`canAny` navigation and action affordances, disabled explanations, session-summary refresh, while asserting an API denial remains safely handled.

Performance target: resolve a single authorization context per request with a bounded membership/profile/grant join, then reuse it. List queries must push institution/assignment/relationship filters to Prisma rather than loading broad results. Cache only immutable catalog data and optionally a short-lived membership-revision result; invalidate on profile, grant, membership, or role change. Measure query counts before adopting external cache infrastructure.

## Open questions

1. Should high-impact live ADMIN profile changes use an effective-date/scheduled workflow in addition to the required impact preview?
2. What privacy/legal review is required before a future archival policy for indefinitely retained permission audit events?

## Recommended implementation roadmap

Phase 1 has completed the catalog, baseline role mapping, and server-side resolver read path without route enforcement or UI. The next slice is persistence and a dual-evaluation read path, followed by Academic Planning/ClassSession as the first enforcement pilot because their ownership, institution scope, and lifecycle policies are already explicit and tested.
