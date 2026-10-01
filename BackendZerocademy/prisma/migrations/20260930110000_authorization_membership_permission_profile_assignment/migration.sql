-- Phase 4: optional InstitutionMembership → PermissionProfile assignment.
-- Existing memberships remain valid with a null assignment. Profiles already
-- assigned to memberships cannot be deleted (Restrict) so configuration is not
-- silently lost. Assignment is persistence-only and is not used for enforcement.
ALTER TABLE "institution_memberships" ADD COLUMN "permissionProfileId" TEXT;

CREATE INDEX "institution_memberships_permissionProfileId_idx" ON "institution_memberships"("permissionProfileId");

ALTER TABLE "institution_memberships" ADD CONSTRAINT "institution_memberships_permissionProfileId_fkey" FOREIGN KEY ("permissionProfileId") REFERENCES "permission_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
