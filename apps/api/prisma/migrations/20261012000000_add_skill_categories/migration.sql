CREATE TABLE "SkillCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SkillCategory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SkillCategory_name_key" ON "SkillCategory"("name");

ALTER TABLE "Skill" ADD COLUMN "skillCategoryId" TEXT;

CREATE INDEX "Skill_skillCategoryId_idx" ON "Skill"("skillCategoryId");

ALTER TABLE "Skill"
ADD CONSTRAINT "Skill_skillCategoryId_fkey"
FOREIGN KEY ("skillCategoryId") REFERENCES "SkillCategory"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
