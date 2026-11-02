# Jira reconciliation drafts — DEMY-140 and DEMY-145

Prepared on 2026-11-01. These are proposed English comments only. No Jira API was called, no issue comment was added, and no workflow transition was performed.

## Proposed comment — DEMY-140

DEMY-140 acceptance evidence is ready for reconciliation.

The ADMIN weekly timetable workspace is complete: institution-period schedule structure and teaching-load configuration, deterministic proposal generation, explicit DRAFT save/discard and validation, accessible DRAFT slot editing/movement with optimistic-version recovery, structured conflict handling, and publish/unpublish lifecycle controls. The workspace remains server-authoritative for validation and supports responsive desktop/mobile use.

Final browser acceptance is recorded at `qa/demy-144-acceptance/campaign-20261101T202546-f29528cef82b/`. It completed three consecutive passes of the same 46-scenario inventory: 46/46, 46/46, and 46/46 (138/138 total; zero failures, skips, or retries). The DEMY-140 portion contains 16 desktop/mobile scenarios per pass covering structure administration, generation/DRAFT management, stale-version recovery, real conflict handling, lifecycle restrictions, authorization/isolation, weekly-grid behavior, and responsive coverage.

Evidence baseline:
- Git HEAD: `f29528cef82b08c53aa3e2a08bc1390d72b2ab23`
- Frozen source fingerprint: `9ec92e1ae65360bff1d40151ff8ab90a9f2b2c5078094776774f8da92e0b2144`

This is local isolated acceptance evidence only. No production deployment, production database access, migration, seed, reset, or production verification is claimed. Jira status transition remains subject to the authorized reconciliation process.

## Proposed comment — DEMY-145

DEMY-145 final acceptance verification is ready for reconciliation with a documented exception.

Coverage is confirmed for successful deterministic generation; invalid/unready generation inputs; HTTP search-budget exhaustion; deterministic generation regression; teacher/course/duplicate conflict diagnostics; publication visibility; institution isolation; IDOR and restricted ADMIN effective-permission enforcement; stale-version handling; strict ADMIN/SUPER_ADMIN operational boundaries; safe QA fixture cleanup; and documentation closure.

The frozen DEMY-140–144 acceptance campaign at `qa/demy-144-acceptance/campaign-20261101T202546-f29528cef82b/` recorded three consecutive 46-test passes (138/138, zero failures/skips/retries). Its final summary records zero campaign-owned institutions, ClassSessions, and temporary JSON files after cleanup, while preserving the nine historical `BROWSER-FIXTURE-*` records.

Current focused non-mutating verification passed:
- Backend Timetables unit suite: 8 suites, 46/46 tests.
- Frontend Timetables component suite: 1 file, 22/22 tests.
- Frontend TypeScript: `tsc --noEmit`.
- Documentation consistency scan and `git diff --check`.

The `UNSATISFIABLE` exception is deliberate and documented. A valid-capacity UNSAT case is covered by `TimetableGenerationService` unit coverage (`UNSATISFIABLE` / `COURSE_CAPACITY_EXCEEDED`). Invalid configuration is covered separately, and HTTP coverage verifies deterministic `SEARCH_LIMIT_REACHED` without persistence. No HTTP `UNSATISFIABLE` pass is claimed: after teacher/course capacity preflight, the supported valid constraints cannot construct a genuine non-capacity HTTP UNSAT fixture. Production-only hooks or artificial constraints were not introduced.

DEMY-126 is not a Timetables MVP dependency. Existing strict ADMIN boundaries, active institutional membership, authoritative resource scope, and fail-closed effective-permission enforcement protect the implemented operations. The current limitation remains institution timezone persistence for Galápagos or multi-timezone Today correctness; rooms/resources, multi-shift structures, scheduling preferences, historical timetable versions, and bulk ClassSession materialization remain deferred.

Documentation closure is recorded in:
- `docs/timetables-scheduling.md`
- `qa/demy-145-audit/coverage-matrix.md`

Evidence baseline:
- Git HEAD: `f29528cef82b08c53aa3e2a08bc1390d72b2ab23`
- Frozen source fingerprint: `9ec92e1ae65360bff1d40151ff8ab90a9f2b2c5078094776774f8da92e0b2144`

No Jira mutation has been performed. The proposed classification is **ACCEPTED WITH DOCUMENTED EXCEPTION**, pending the authorized Jira reconciliation and final approval workflow.
