-- Add missing columns to kyc_submissions
ALTER TABLE "kyc_submissions" ADD COLUMN IF NOT EXISTS "phoneNumber" TEXT;
ALTER TABLE "kyc_submissions" ADD COLUMN IF NOT EXISTS "emailAddress" TEXT;
