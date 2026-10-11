ALTER TABLE "Project" ADD COLUMN "isCvFeatured" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "ResumeDownload" DROP CONSTRAINT "ResumeDownload_resumeId_fkey";
ALTER TABLE "ResumeDownload" ALTER COLUMN "resumeId" DROP NOT NULL;
ALTER TABLE "ResumeDownload" ADD CONSTRAINT "ResumeDownload_resumeId_fkey"
  FOREIGN KEY ("resumeId") REFERENCES "Resume"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "CvRequest" (
  "id" TEXT NOT NULL,
  "fullName" TEXT,
  "email" TEXT,
  "reason" TEXT,
  "consentedAt" TIMESTAMP(3) NOT NULL,
  "consentTextVersion" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CvRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CvRequest_createdAt_idx" ON "CvRequest"("createdAt");
CREATE INDEX "ContactMessage_createdAt_idx" ON "ContactMessage"("createdAt");