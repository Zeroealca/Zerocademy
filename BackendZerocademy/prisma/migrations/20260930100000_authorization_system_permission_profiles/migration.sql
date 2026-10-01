-- System-owned permission profiles; membership assignment is intentionally deferred.
CREATE TABLE "permission_profiles" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "permission_profiles_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "permission_profile_permissions" (
    "permissionProfileId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "permission_profile_permissions_pkey" PRIMARY KEY ("permissionProfileId", "permissionId")
);
CREATE UNIQUE INDEX "permission_profiles_key_key" ON "permission_profiles"("key");
CREATE INDEX "permission_profiles_role_idx" ON "permission_profiles"("role");
CREATE INDEX "permission_profiles_isSystem_idx" ON "permission_profiles"("isSystem");
CREATE INDEX "permission_profile_permissions_permissionProfileId_idx" ON "permission_profile_permissions"("permissionProfileId");
CREATE INDEX "permission_profile_permissions_permissionId_idx" ON "permission_profile_permissions"("permissionId");
ALTER TABLE "permission_profile_permissions" ADD CONSTRAINT "permission_profile_permissions_permissionProfileId_fkey" FOREIGN KEY ("permissionProfileId") REFERENCES "permission_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "permission_profile_permissions" ADD CONSTRAINT "permission_profile_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
