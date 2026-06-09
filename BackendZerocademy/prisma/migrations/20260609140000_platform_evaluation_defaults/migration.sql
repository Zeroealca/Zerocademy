-- CreateTable
CREATE TABLE "platform_academic_evaluation_config" (
    "id" TEXT NOT NULL DEFAULT 'platform-evaluation-defaults',
    "gradingSchemeId" TEXT NOT NULL,
    "roundingStrategy" "RoundingStrategy" NOT NULL DEFAULT 'ROUND_HALF_UP',
    "decimalPlaces" INTEGER NOT NULL DEFAULT 2,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_academic_evaluation_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_category_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "weight" DECIMAL(5,2) NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assessment_category_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluation_term_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "weight" DECIMAL(5,2) NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evaluation_term_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "platform_academic_evaluation_config_gradingSchemeId_key" ON "platform_academic_evaluation_config"("gradingSchemeId");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_category_templates_name_key" ON "assessment_category_templates"("name");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_category_templates_order_key" ON "assessment_category_templates"("order");

-- CreateIndex
CREATE INDEX "assessment_category_templates_isActive_idx" ON "assessment_category_templates"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "evaluation_term_templates_name_key" ON "evaluation_term_templates"("name");

-- CreateIndex
CREATE UNIQUE INDEX "evaluation_term_templates_order_key" ON "evaluation_term_templates"("order");

-- CreateIndex
CREATE INDEX "evaluation_term_templates_isActive_idx" ON "evaluation_term_templates"("isActive");

-- AddForeignKey
ALTER TABLE "platform_academic_evaluation_config" ADD CONSTRAINT "platform_academic_evaluation_config_gradingSchemeId_fkey" FOREIGN KEY ("gradingSchemeId") REFERENCES "grading_schemes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
