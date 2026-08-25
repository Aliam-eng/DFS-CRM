-- Back-office internal state on each KYC — visible only to staff
-- (Operations / Compliance / Admin / Super Admin), never to the client.
-- Independent of KycStatus: tracks who is actively working the file,
-- who's waiting on whom, escalated items, etc.

DO $$ BEGIN
  CREATE TYPE "KycInternalState" AS ENUM (
    'NEW',
    'IN_PROGRESS',
    'WAITING_CLIENT',
    'WAITING_TEAM',
    'ON_HOLD',
    'ESCALATED',
    'DONE'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

ALTER TABLE "kyc_submissions"
  ADD COLUMN IF NOT EXISTS "internalState" "KycInternalState" DEFAULT 'NEW';

ALTER TABLE "kyc_submissions"
  ADD COLUMN IF NOT EXISTS "internalStateUpdatedAt" TIMESTAMP(3);

ALTER TABLE "kyc_submissions"
  ADD COLUMN IF NOT EXISTS "internalStateUpdatedBy" TEXT;

CREATE INDEX IF NOT EXISTS "kyc_submissions_internalState_idx"
  ON "kyc_submissions" ("internalState");
