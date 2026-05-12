-- PEP can now be a combination (Option 2 and/or Option 3)
ALTER TABLE "kyc_submissions" ADD COLUMN IF NOT EXISTS "pepIsSelf"   BOOLEAN DEFAULT false;
ALTER TABLE "kyc_submissions" ADD COLUMN IF NOT EXISTS "pepIsFamily" BOOLEAN DEFAULT false;

-- Backfill from existing pepStatus enum
UPDATE "kyc_submissions" SET "pepIsSelf"   = true WHERE "pepStatus" = 'IS_PEP';
UPDATE "kyc_submissions" SET "pepIsFamily" = true WHERE "pepStatus" = 'PEP_FAMILY_ASSOCIATE';

-- Trading partner + commission tier chosen at agreement time
ALTER TABLE "kyc_submissions" ADD COLUMN IF NOT EXISTS "tradingCompany"    TEXT;
ALTER TABLE "kyc_submissions" ADD COLUMN IF NOT EXISTS "tradingCommission" TEXT;
