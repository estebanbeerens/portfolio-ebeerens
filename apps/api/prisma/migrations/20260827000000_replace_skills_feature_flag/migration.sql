CREATE TYPE "FeatureFlagKey_new" AS ENUM ('CONTACT', 'PROJECTS', 'ROLES', 'RESUME');

DELETE FROM "FeatureFlag" WHERE "key" = 'SKILLS';

ALTER TABLE "FeatureFlag" ALTER COLUMN "key" TYPE "FeatureFlagKey_new" USING ("key"::text::"FeatureFlagKey_new");

DROP TYPE "FeatureFlagKey";

ALTER TYPE "FeatureFlagKey_new" RENAME TO "FeatureFlagKey";