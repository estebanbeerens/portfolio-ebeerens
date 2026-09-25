CREATE TABLE "Institution" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logoUrl" TEXT,
    "logoObjectKey" TEXT,
    "website" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Institution_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Education" (
    "id" TEXT NOT NULL,
    "degree" TEXT NOT NULL,
    "fieldOfStudy" TEXT,
    "institutionId" TEXT NOT NULL,
    "descriptionEn" TEXT,
    "descriptionNl" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Education_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Institution_name_key" ON "Institution"("name");
CREATE INDEX "Education_startDate_idx" ON "Education"("startDate");
ALTER TABLE "Education" ADD CONSTRAINT "Education_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TYPE "ActivityEntity" ADD VALUE 'INSTITUTION';
ALTER TYPE "ActivityEntity" ADD VALUE 'EDUCATION';
