-- CreateEnum
CREATE TYPE "FeatureFlagKey" AS ENUM ('CONTACT', 'PROJECTS', 'ROLES', 'SKILLS');

-- CreateTable
CREATE TABLE "FeatureFlag" (
    "key" "FeatureFlagKey" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeatureFlag_pkey" PRIMARY KEY ("key")
);
