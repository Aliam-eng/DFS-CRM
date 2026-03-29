-- KYC V2 Update (March 2026)
-- Remove Part K (Third-Party Authorization), simplified address/financial fields

-- AlterTable
ALTER TABLE "kyc_submissions" DROP COLUMN IF EXISTS "authAccessStatements",
DROP COLUMN IF EXISTS "authReceiveCredentials",
DROP COLUMN IF EXISTS "authorizedPerson",
DROP COLUMN IF EXISTS "currencyPreference",
DROP COLUMN IF EXISTS "hasThirdPartyAuth",
DROP COLUMN IF EXISTS "initialInvestedAmount",
DROP COLUMN IF EXISTS "initialInvestedCurrency",
DROP COLUMN IF EXISTS "otherBankAccounts",
DROP COLUMN IF EXISTS "primaryLandmark",
DROP COLUMN IF EXISTS "primaryPoBox",
DROP COLUMN IF EXISTS "primaryPostalCode",
DROP COLUMN IF EXISTS "secondaryLandmark",
DROP COLUMN IF EXISTS "secondaryPoBox",
DROP COLUMN IF EXISTS "secondaryPostalCode",
DROP COLUMN IF EXISTS "sourceOfTransferredFunds",
DROP COLUMN IF EXISTS "sourceOfTransferredOther",
DROP COLUMN IF EXISTS "taxResidences",
DROP COLUMN IF EXISTS "spouseIdNumber",
DROP COLUMN IF EXISTS "spouseIdIssueDate",
DROP COLUMN IF EXISTS "primaryAddress",
DROP COLUMN IF EXISTS "secondaryAddress";

-- Add new columns
ALTER TABLE "kyc_submissions"
ADD COLUMN IF NOT EXISTS "hasOtherBankAccounts" BOOLEAN,
ADD COLUMN IF NOT EXISTS "otherBankCountry" TEXT,
ADD COLUMN IF NOT EXISTS "personalInstitutionEmail" TEXT;

-- Convert sourceOfFunds from enum to JSON array
ALTER TABLE "kyc_submissions" DROP COLUMN IF EXISTS "sourceOfFunds";
ALTER TABLE "kyc_submissions" ADD COLUMN "sourceOfFunds" JSONB;

-- Convert sourceOfWealth from enum to JSON array
ALTER TABLE "kyc_submissions" DROP COLUMN IF EXISTS "sourceOfWealth";
ALTER TABLE "kyc_submissions" ADD COLUMN "sourceOfWealth" JSONB;

-- Drop unused enum
DROP TYPE IF EXISTS "SourceOfTransferredFunds";
