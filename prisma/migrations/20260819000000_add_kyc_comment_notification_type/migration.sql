-- Add KYC_COMMENT to the NotificationType enum.
--
-- This lives in its own migration because Postgres refuses
--   ALTER TYPE ... ADD VALUE
-- inside a transaction block. Prisma runs a migration file that
-- contains only ALTER TYPE ADD VALUE statements outside its normal
-- transaction wrapper, so isolating this change is the safe path.

ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'KYC_COMMENT';
