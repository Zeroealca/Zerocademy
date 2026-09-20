# Academic report cards

## Purpose

The `reports` domain exposes a read-only academic report card for a student's selected academic period. It presents calculated academic performance; it does not define or persist a second grading algorithm.

**Tracking:** [DEMY-79 — Academic Report Cards (Phase 1)](https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-79).

Phase 2 tracking: [DEMY-80 — Printable Report Cards and PDF Export](https://emilioandresalcivarcarrera.atlassian.net/browse/DEMY-80).

User guide: [19 — Libretas académicas](https://emilioandresalcivarcarrera.atlassian.net/wiki/spaces/DDS/pages/9142273/19+Libretas+acad+micas).

## Data flow

`Grade` records are loaded in bulk by the Academic Performance calculation engine. The engine normalizes scores, calculates category, calendar-term, and subject averages, and applies the configured rounding strategy. The report-card service adds student, enrollment, institution, and course context, then maps qualifying grades to `GradeScale` bands.

Assigned course subjects are included even when they have no grades. Their term and subject averages remain `null`; missing data is never interpreted as zero.

## API

| Endpoint | Role | Description |
| --- | --- | --- |
| `GET /v1/report-cards/me?academicPeriodId=<uuid>` | STUDENT | Authenticated student's report card. |
| `GET /v1/report-cards/:studentId?academicPeriodId=<uuid>` | SUPER_ADMIN, ADMIN, TEACHER | Scoped report card lookup. |

`academicPeriodId` is required, so historical academic periods are explicitly supported. The response includes configured calendar terms, subject/term averages, qualitative results, and an overall average when at least one subject has a calculated average.

## Authorization and isolation

- Students use only `/me`; the lookup endpoint excludes the STUDENT role.
- Teachers must have an assignment in the student's course and period.
- ADMIN access is checked against the enrollment course institution; cross-institution resources are hidden with `404` by the shared academic-scope policy.
- SUPER_ADMIN follows the existing platform-wide monitoring rule.

## Qualitative scales and history

Qualitative results are resolved from `GradeScale` rather than hardcoded ranges. When all graded records in an enrollment/period reference one `Grade.gradingSchemeId` snapshot, that historical scheme is used. Otherwise the institution's configured scheme is used. Mixed historical grade snapshots have no period-level configuration snapshot in the current data model, so their numeric averages remain engine-calculated using the current resolved configuration; a future period-closure snapshot can make that case immutable without changing the API shape.

## Frontend workflow

`/report-cards` is available to students, teachers, administrators, and super administrators. Students retrieve their own record. Staff choose an accessible period and student; the API remains the authorization boundary. The table derives its columns from response terms, so it supports any configured term count. Its horizontal scroll container preserves usability on small screens and both light and dark modes use existing design tokens.

## Printable view and PDF export

The page provides **Print** and **Download PDF** actions. Print CSS uses A4 margins, hides dashboard controls, uses a stable white document surface, and repeats table headers where browser support permits.

PDF downloads are generated server-side in memory with PDFKit. This was selected because the existing NestJS deployment has no document generator and PDFKit avoids a Chromium runtime while providing deterministic A4 layout, branding colors, page breaks, and repeated table headers. The renderer receives the existing `ReportCardResponseDto`; it never queries grades or recalculates averages.

| Endpoint | Role | Description |
| --- | --- | --- |
| `GET /v1/report-cards/me/pdf?academicPeriodId=<uuid>` | STUDENT | Download the authenticated student's report card. |
| `GET /v1/report-cards/:studentId/pdf?academicPeriodId=<uuid>` | SUPER_ADMIN, ADMIN, TEACHER | Download a report card within the existing scoped authorization. |

The endpoints reuse the Phase 1 report-card authorization methods, return `application/pdf`, and stream the document from memory. Files are never persisted or publicly exposed. A safe filename uses only the student name and academic-period name.

Branding uses the institution name, configured primary color, and local uploaded logo when available. Missing logos are intentionally omitted. Missing averages and qualitative results render as an em dash rather than a number, `null`, or `undefined`.

## Future PDF integration

The current PDF renderer consumes the typed response without altering grade calculations. A future certificate or closure-time snapshot module can use the same presentation boundary.
