-- CreateTable
CREATE TABLE "permissions" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_allowed_permissions" (
    "role" "Role" NOT NULL,
    "permissionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_allowed_permissions_pkey" PRIMARY KEY ("role", "permissionId")
);

-- CreateIndex
CREATE UNIQUE INDEX "permissions_key_key" ON "permissions"("key");

-- CreateIndex
CREATE INDEX "role_allowed_permissions_role_idx" ON "role_allowed_permissions"("role");

-- CreateIndex
CREATE INDEX "role_allowed_permissions_permissionId_idx" ON "role_allowed_permissions"("permissionId");

-- AddForeignKey
ALTER TABLE "role_allowed_permissions" ADD CONSTRAINT "role_allowed_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
