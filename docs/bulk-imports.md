# Student bulk import (CSV)

## Access

**ADMIN only** — `POST /v1/students/bulk-import` with `@ApiRequireRolesStrict(Role.ADMIN)`.

## CSV format

- Fields separated by **commas** (same order as the student creation form).
- Each row ends with **`;`**
- Optional fields may be **empty** but must keep their position (empty commas).
- Avoid **commas inside** optional text fields (`address`, `emergencyContact`).
- An optional **header row** matching the column keys is ignored if present.

### Column order (10 fields)

| # | Field | Required | Notes |
|---|--------|----------|--------|
| 1 | `email` | Yes | Valid email |
| 2 | `password` | Yes | Min. 8 characters |
| 3 | `firstName` | Yes | |
| 4 | `lastName` | Yes | |
| 5 | `nationalId` | Yes | Unique cédula / national ID |
| 6 | `birthDate` | No | `YYYY-MM-DD` |
| 7 | `gender` | No | `MALE`, `FEMALE`, `OTHER`, `UNSPECIFIED` |
| 8 | `phone` | No | |
| 9 | `address` | No | |
| 10 | `emergencyContact` | No | |

Header line (optional):

```csv
email,password,firstName,lastName,nationalId,birthDate,gender,phone,address,emergencyContact;
```

Example row:

```csv
student1@example.com,password123,Juan,Pérez,0912345678,2010-05-15,MALE,0991234567,Av. Principal 123,María Pérez (madre);
```

## Request body

```json
{
  "csvContent": "<full CSV text>",
  "courseId": "<uuid>",
  "academicPeriodId": "<uuid>"
}
```

## Flow

1. Parse and validate rows (email, required fields, dates, gender, in-file duplicates).
2. Validate course belongs to the selected academic period.
3. For each valid row:
   - Create `User` + `StudentProfile` with all provided profile fields if new.
   - Skip if enrollment already exists for the triple.
   - Create `Enrollment` with status `ACTIVE`.
4. Return summary counts and per-row errors.

## Validation

- Malformed rows (not exactly 10 fields before `;`)
- Duplicate email or nationalId within the file
- Email already used by non-student account
- Invalid course / period combination
- Existing enrollment (skipped, not failed)

## Response

```json
{
  "importedCount": 0,
  "skippedCount": 0,
  "failedCount": 0,
  "errors": [{ "row": 1, "email": "", "message": "..." }],
  "duplicateWarnings": []
}
```

## Security

- Passwords are hashed with bcrypt; **never logged**.
- Import events logged as `BULK_IMPORT_COMPLETED` / `BULK_IMPORT_ROW_FAILED`.

## Frontend

Route: `/students/bulk-import` — column spec **outside** the textarea, period/course selectors, data rows only in the text area, result summary card.

## Related

- [students.md](./students.md)
- [enrollments.md](./enrollments.md)
