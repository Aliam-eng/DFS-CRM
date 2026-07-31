-- Discussion thread between staff (Operations/Compliance/Admin/Super Admin)
-- on each KYC submission. Comments are immutable (audit trail).

CREATE TABLE IF NOT EXISTS "kyc_comments" (
  "id"              TEXT NOT NULL,
  "kycSubmissionId" TEXT NOT NULL,
  "authorUserId"    TEXT NOT NULL,
  "body"            TEXT NOT NULL,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "kyc_comments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "kyc_comments_kycSubmissionId_createdAt_idx"
  ON "kyc_comments" ("kycSubmissionId", "createdAt");

-- FK: cascade delete when the KYC submission is deleted
DO $$ BEGIN
  ALTER TABLE "kyc_comments"
    ADD CONSTRAINT "kyc_comments_kycSubmissionId_fkey"
    FOREIGN KEY ("kycSubmissionId") REFERENCES "kyc_submissions"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- FK: restrict user deletion if they have comments (preserve audit trail)
DO $$ BEGIN
  ALTER TABLE "kyc_comments"
    ADD CONSTRAINT "kyc_comments_authorUserId_fkey"
    FOREIGN KEY ("authorUserId") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Register the KYC_COMMENT notification type
DO $$ BEGIN
  ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'KYC_COMMENT';
EXCEPTION WHEN duplicate_object THEN null; END $$;
