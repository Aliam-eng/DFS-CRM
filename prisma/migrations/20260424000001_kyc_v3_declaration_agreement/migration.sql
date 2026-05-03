-- Regulatory Reservation Clause acceptance
ALTER TABLE "kyc_submissions" ADD COLUMN IF NOT EXISTS "regulatoryClauseAccepted" BOOLEAN DEFAULT false;
ALTER TABLE "kyc_submissions" ADD COLUMN IF NOT EXISTS "regulatoryClauseFullName" TEXT;

-- Client Agreement (electronic signature via OTP)
ALTER TABLE "kyc_submissions" ADD COLUMN IF NOT EXISTS "agreementAccepted" BOOLEAN DEFAULT false;
ALTER TABLE "kyc_submissions" ADD COLUMN IF NOT EXISTS "agreementFullName" TEXT;
ALTER TABLE "kyc_submissions" ADD COLUMN IF NOT EXISTS "agreementSignedAt" TIMESTAMP;
ALTER TABLE "kyc_submissions" ADD COLUMN IF NOT EXISTS "agreementOtpVerifiedAt" TIMESTAMP;
ALTER TABLE "kyc_submissions" ADD COLUMN IF NOT EXISTS "agreementSignatureIp" TEXT;
