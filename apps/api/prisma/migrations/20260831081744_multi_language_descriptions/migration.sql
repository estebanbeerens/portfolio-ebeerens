/*
  Warnings:

  - Existing single-language columns are renamed to `*En` (data preserved) and
    new nullable `*Nl` columns are added for Dutch translations.

*/
-- RenameColumn
ALTER TABLE "Profile" RENAME COLUMN "bio" TO "bioEn";
-- AlterTable
ALTER TABLE "Profile" ADD COLUMN "bioNl" TEXT;

-- RenameColumn
ALTER TABLE "Project" RENAME COLUMN "shortDescription" TO "shortDescriptionEn";
ALTER TABLE "Project" RENAME COLUMN "description" TO "descriptionEn";
-- AlterTable
ALTER TABLE "Project" ADD COLUMN "shortDescriptionNl" VARCHAR(255),
ADD COLUMN "descriptionNl" TEXT;

-- RenameColumn
ALTER TABLE "Role" RENAME COLUMN "description" TO "descriptionEn";
-- AlterTable
ALTER TABLE "Role" ADD COLUMN "descriptionNl" TEXT;
