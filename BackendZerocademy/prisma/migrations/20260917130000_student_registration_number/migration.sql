ALTER TABLE "student_profiles" ADD COLUMN "registrationNumber" TEXT;
UPDATE "student_profiles" SET "registrationNumber" = 'MAT-' || "id";
ALTER TABLE "student_profiles"
  ALTER COLUMN "registrationNumber" SET NOT NULL,
  ALTER COLUMN "registrationNumber" SET DEFAULT ('MAT-' || gen_random_uuid()::text);
CREATE UNIQUE INDEX "student_profiles_registrationNumber_key"
ON "student_profiles"("registrationNumber");
