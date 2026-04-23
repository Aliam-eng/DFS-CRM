-- Add new NotificationType values for the reversed review flow
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'KYC_OPERATIONS_APPROVED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'KYC_OPERATIONS_REJECTED';
