-- Data migration (DEMY-146): insert canonical Ecuador SubLevels and backfill
-- GradeLevel.subLevelId / Course.subLevelId using stable grade codes.
-- Preserves legacy AcademicLevel BACH and non-canonical grades (no deletes).

-- ---------------------------------------------------------------------------
-- 1) Safety: required platform AcademicLevels must exist exactly once
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  inicial_count INTEGER;
  egb_count INTEGER;
  bgu_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO inicial_count
  FROM "academic_levels"
  WHERE "code" = 'INICIAL' AND "institutionId" IS NULL;

  SELECT COUNT(*) INTO egb_count
  FROM "academic_levels"
  WHERE "code" = 'EGB' AND "institutionId" IS NULL;

  SELECT COUNT(*) INTO bgu_count
  FROM "academic_levels"
  WHERE "code" = 'BGU' AND "institutionId" IS NULL;

  IF inicial_count <> 1 THEN
    RAISE EXCEPTION
      'backfill_academic_sublevels: expected exactly 1 platform AcademicLevel INICIAL, found %',
      inicial_count;
  END IF;

  IF egb_count <> 1 THEN
    RAISE EXCEPTION
      'backfill_academic_sublevels: expected exactly 1 platform AcademicLevel EGB, found %',
      egb_count;
  END IF;

  IF bgu_count <> 1 THEN
    RAISE EXCEPTION
      'backfill_academic_sublevels: expected exactly 1 platform AcademicLevel BGU, found %',
      bgu_count;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 2) Safety: canonical grade codes must be unique within their AcademicLevel
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  ambiguous_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO ambiguous_count
  FROM (
    SELECT al."code" AS level_code, gl."code" AS grade_code, COUNT(*) AS row_count
    FROM "grade_levels" gl
    INNER JOIN "academic_levels" al ON al."id" = gl."academicLevelId"
    WHERE al."institutionId" IS NULL
      AND (
        (al."code" = 'INICIAL' AND gl."code" IN ('INI-1', 'INI-2'))
        OR (
          al."code" = 'EGB'
          AND gl."code" IN (
            'EGB-1', 'EGB-2', 'EGB-3', 'EGB-4', 'EGB-5',
            'EGB-6', 'EGB-7', 'EGB-8', 'EGB-9', 'EGB-10'
          )
        )
        OR (al."code" = 'BGU' AND gl."code" IN ('BGU-1', 'BGU-2', 'BGU-3'))
      )
    GROUP BY al."code", gl."code"
    HAVING COUNT(*) <> 1
  ) ambiguous;

  IF ambiguous_count > 0 THEN
    RAISE EXCEPTION
      'backfill_academic_sublevels: ambiguous canonical GradeLevel codes detected (% groups)',
      ambiguous_count;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 3) Align BGU display name with canonical catalog (code BGU retained)
-- ---------------------------------------------------------------------------
UPDATE "academic_levels"
SET
  "name" = 'Bachillerato',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "code" = 'BGU'
  AND "institutionId" IS NULL
  AND "name" IS DISTINCT FROM 'Bachillerato';

UPDATE "grade_levels" gl
SET
  "name" = mapped."name",
  "updatedAt" = CURRENT_TIMESTAMP
FROM (
  VALUES
    ('BGU-1', 'Primero de Bachillerato'),
    ('BGU-2', 'Segundo de Bachillerato'),
    ('BGU-3', 'Tercero de Bachillerato')
) AS mapped("code", "name")
INNER JOIN "academic_levels" al
  ON al."code" = 'BGU'
 AND al."institutionId" IS NULL
WHERE gl."academicLevelId" = al."id"
  AND gl."code" = mapped."code"
  AND gl."name" IS DISTINCT FROM mapped."name";

-- ---------------------------------------------------------------------------
-- 4) Insert canonical SubLevels (idempotent by academicLevelId + code)
-- ---------------------------------------------------------------------------
INSERT INTO "sub_levels" (
  "id",
  "name",
  "code",
  "order",
  "description",
  "academicLevelId",
  "institutionId",
  "isSystem",
  "isActive",
  "createdAt",
  "updatedAt"
)
SELECT
  gen_random_uuid()::text,
  seed."name",
  seed."code",
  seed."order",
  NULL,
  al."id",
  NULL,
  TRUE,
  TRUE,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM (
  VALUES
    ('INICIAL', 'INICIAL_1', 'Inicial 1', 1),
    ('INICIAL', 'INICIAL_2', 'Inicial 2', 2),
    ('EGB', 'EGB_PREPARATORIA', 'Preparatoria', 1),
    ('EGB', 'EGB_ELEMENTAL', 'Básica Elemental', 2),
    ('EGB', 'EGB_MEDIA', 'Básica Media', 3),
    ('EGB', 'EGB_SUPERIOR', 'Básica Superior', 4),
    ('BGU', 'BACHILLERATO', 'Bachillerato', 1)
) AS seed("academicLevelCode", "code", "name", "order")
INNER JOIN "academic_levels" al
  ON al."code" = seed."academicLevelCode"
 AND al."institutionId" IS NULL
WHERE NOT EXISTS (
  SELECT 1
  FROM "sub_levels" existing
  WHERE existing."academicLevelId" = al."id"
    AND existing."code" = seed."code"
);

-- ---------------------------------------------------------------------------
-- 5) Safety: each inserted canonical SubLevel belongs to the expected level
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  mismatch_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO mismatch_count
  FROM (
    VALUES
      ('INICIAL', 'INICIAL_1'),
      ('INICIAL', 'INICIAL_2'),
      ('EGB', 'EGB_PREPARATORIA'),
      ('EGB', 'EGB_ELEMENTAL'),
      ('EGB', 'EGB_MEDIA'),
      ('EGB', 'EGB_SUPERIOR'),
      ('BGU', 'BACHILLERATO')
  ) AS expected("academicLevelCode", "subLevelCode")
  LEFT JOIN "academic_levels" al
    ON al."code" = expected."academicLevelCode"
   AND al."institutionId" IS NULL
  LEFT JOIN "sub_levels" sl
    ON sl."academicLevelId" = al."id"
   AND sl."code" = expected."subLevelCode"
  WHERE sl."id" IS NULL
     OR sl."academicLevelId" IS DISTINCT FROM al."id";

  IF mismatch_count > 0 THEN
    RAISE EXCEPTION
      'backfill_academic_sublevels: canonical SubLevel/AcademicLevel mismatch (% rows)',
      mismatch_count;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 6) Backfill GradeLevel.subLevelId using explicit stable codes
--     Legacy BACH-* and non-canonical grades (e.g. NOVENO QA) stay NULL.
-- ---------------------------------------------------------------------------
UPDATE "grade_levels" gl
SET
  "subLevelId" = sl."id",
  "updatedAt" = CURRENT_TIMESTAMP
FROM (
  VALUES
    ('INICIAL', 'INI-1', 'INICIAL_1'),
    ('INICIAL', 'INI-2', 'INICIAL_2'),
    ('EGB', 'EGB-1', 'EGB_PREPARATORIA'),
    ('EGB', 'EGB-2', 'EGB_ELEMENTAL'),
    ('EGB', 'EGB-3', 'EGB_ELEMENTAL'),
    ('EGB', 'EGB-4', 'EGB_ELEMENTAL'),
    ('EGB', 'EGB-5', 'EGB_MEDIA'),
    ('EGB', 'EGB-6', 'EGB_MEDIA'),
    ('EGB', 'EGB-7', 'EGB_MEDIA'),
    ('EGB', 'EGB-8', 'EGB_SUPERIOR'),
    ('EGB', 'EGB-9', 'EGB_SUPERIOR'),
    ('EGB', 'EGB-10', 'EGB_SUPERIOR'),
    ('BGU', 'BGU-1', 'BACHILLERATO'),
    ('BGU', 'BGU-2', 'BACHILLERATO'),
    ('BGU', 'BGU-3', 'BACHILLERATO')
) AS map("academicLevelCode", "gradeCode", "subLevelCode")
INNER JOIN "academic_levels" al
  ON al."code" = map."academicLevelCode"
 AND al."institutionId" IS NULL
INNER JOIN "sub_levels" sl
  ON sl."academicLevelId" = al."id"
 AND sl."code" = map."subLevelCode"
WHERE gl."academicLevelId" = al."id"
  AND gl."code" = map."gradeCode"
  AND (
    gl."subLevelId" IS NULL
    OR gl."subLevelId" = sl."id"
  );

-- Fail if a mapped canonical grade still lacks the expected sublevel
DO $$
DECLARE
  unmapped_count INTEGER;
  conflicting_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO unmapped_count
  FROM (
    VALUES
      ('INICIAL', 'INI-1', 'INICIAL_1'),
      ('INICIAL', 'INI-2', 'INICIAL_2'),
      ('EGB', 'EGB-1', 'EGB_PREPARATORIA'),
      ('EGB', 'EGB-2', 'EGB_ELEMENTAL'),
      ('EGB', 'EGB-3', 'EGB_ELEMENTAL'),
      ('EGB', 'EGB-4', 'EGB_ELEMENTAL'),
      ('EGB', 'EGB-5', 'EGB_MEDIA'),
      ('EGB', 'EGB-6', 'EGB_MEDIA'),
      ('EGB', 'EGB-7', 'EGB_MEDIA'),
      ('EGB', 'EGB-8', 'EGB_SUPERIOR'),
      ('EGB', 'EGB-9', 'EGB_SUPERIOR'),
      ('EGB', 'EGB-10', 'EGB_SUPERIOR'),
      ('BGU', 'BGU-1', 'BACHILLERATO'),
      ('BGU', 'BGU-2', 'BACHILLERATO'),
      ('BGU', 'BGU-3', 'BACHILLERATO')
  ) AS map("academicLevelCode", "gradeCode", "subLevelCode")
  INNER JOIN "academic_levels" al
    ON al."code" = map."academicLevelCode"
   AND al."institutionId" IS NULL
  INNER JOIN "grade_levels" gl
    ON gl."academicLevelId" = al."id"
   AND gl."code" = map."gradeCode"
  INNER JOIN "sub_levels" sl
    ON sl."academicLevelId" = al."id"
   AND sl."code" = map."subLevelCode"
  WHERE gl."subLevelId" IS DISTINCT FROM sl."id";

  IF unmapped_count > 0 THEN
    RAISE EXCEPTION
      'backfill_academic_sublevels: canonical GradeLevel mapping incomplete or conflicting (% rows)',
      unmapped_count;
  END IF;

  SELECT COUNT(*) INTO conflicting_count
  FROM "grade_levels" gl
  INNER JOIN "sub_levels" sl ON sl."id" = gl."subLevelId"
  WHERE gl."subLevelId" IS NOT NULL
    AND gl."academicLevelId" IS DISTINCT FROM sl."academicLevelId";

  IF conflicting_count > 0 THEN
    RAISE EXCEPTION
      'backfill_academic_sublevels: GradeLevel.subLevelId points to SubLevel of another AcademicLevel (% rows)',
      conflicting_count;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 7) Course.subLevelId backfill from GradeLevel when deterministic / non-conflicting
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  conflict_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO conflict_count
  FROM "courses" c
  INNER JOIN "grade_levels" gl ON gl."id" = c."gradeLevelId"
  WHERE c."subLevelId" IS NOT NULL
    AND gl."subLevelId" IS NOT NULL
    AND c."subLevelId" IS DISTINCT FROM gl."subLevelId";

  IF conflict_count > 0 THEN
    RAISE EXCEPTION
      'backfill_academic_sublevels: Course.subLevelId conflicts with GradeLevel.subLevelId (% rows)',
      conflict_count;
  END IF;
END $$;

UPDATE "courses" c
SET
  "subLevelId" = gl."subLevelId",
  "updatedAt" = CURRENT_TIMESTAMP
FROM "grade_levels" gl
WHERE c."gradeLevelId" = gl."id"
  AND gl."subLevelId" IS NOT NULL
  AND c."subLevelId" IS NULL;
