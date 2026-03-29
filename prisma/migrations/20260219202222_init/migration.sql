-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CLIENT', 'COMPLIANCE', 'OPERATIONS', 'ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('PENDING_VERIFICATION', 'ACTIVE', 'SUSPENDED', 'DEACTIVATED');

-- CreateEnum
CREATE TYPE "KycStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'COMPLIANCE_APPROVED', 'COMPLIANCE_REJECTED', 'OPERATIONS_APPROVED', 'OPERATIONS_REJECTED');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('PASSPORT', 'NATIONAL_ID', 'DRIVING_LICENCE', 'UTILITY_BILL', 'BANK_STATEMENT', 'AML_REPORT');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('KYC_SUBMITTED', 'KYC_COMPLIANCE_APPROVED', 'KYC_COMPLIANCE_REJECTED', 'KYC_APPROVED', 'KYC_REJECTED', 'GENERAL');

-- CreateEnum
CREATE TYPE "SourceOfFunds" AS ENUM ('EMPLOYMENT_INCOME', 'BUSINESS_INCOME', 'INVESTMENTS', 'INHERITANCE', 'SAVINGS', 'PENSION', 'OTHER');

-- CreateEnum
CREATE TYPE "RiskTolerance" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "ExperienceLevel" AS ENUM ('NONE', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'CLIENT',
    "status" "UserStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otps" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "purpose" TEXT NOT NULL DEFAULT 'EMAIL_VERIFICATION',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kyc_submissions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "KycStatus" NOT NULL DEFAULT 'DRAFT',
    "fullLegalName" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "nationality" TEXT,
    "countryOfBirth" TEXT,
    "taxResidency" TEXT,
    "taxIdNumber" TEXT,
    "residentialAddress" TEXT,
    "city" TEXT,
    "stateProvince" TEXT,
    "postalCode" TEXT,
    "country" TEXT,
    "employmentStatus" TEXT,
    "occupation" TEXT,
    "employerName" TEXT,
    "sourceOfFunds" "SourceOfFunds",
    "sourceOfFundsOther" TEXT,
    "annualIncome" TEXT,
    "estimatedNetWorth" TEXT,
    "expectedTradingVolume" TEXT,
    "experienceLevel" "ExperienceLevel",
    "yearsTrading" INTEGER,
    "instrumentsTraded" TEXT[],
    "riskTolerance" "RiskTolerance",
    "investmentObjective" TEXT,
    "isPep" BOOLEAN,
    "pepDetails" TEXT,
    "hasUsCitizenship" BOOLEAN,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kyc_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kyc_documents" (
    "id" TEXT NOT NULL,
    "kycSubmissionId" TEXT NOT NULL,
    "documentType" "DocumentType" NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "side" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kyc_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kyc_reviews" (
    "id" TEXT NOT NULL,
    "kycSubmissionId" TEXT NOT NULL,
    "reviewerUserId" TEXT NOT NULL,
    "reviewType" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "notes" TEXT,
    "amlReportPath" TEXT,
    "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kyc_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_status_idx" ON "users"("role", "status");

-- CreateIndex
CREATE INDEX "otps_userId_purpose_idx" ON "otps"("userId", "purpose");

-- CreateIndex
CREATE UNIQUE INDEX "kyc_submissions_userId_key" ON "kyc_submissions"("userId");

-- CreateIndex
CREATE INDEX "kyc_submissions_status_idx" ON "kyc_submissions"("status");

-- CreateIndex
CREATE INDEX "kyc_submissions_submittedAt_idx" ON "kyc_submissions"("submittedAt");

-- CreateIndex
CREATE INDEX "kyc_documents_kycSubmissionId_documentType_idx" ON "kyc_documents"("kycSubmissionId", "documentType");

-- CreateIndex
CREATE INDEX "kyc_reviews_kycSubmissionId_idx" ON "kyc_reviews"("kycSubmissionId");

-- CreateIndex
CREATE INDEX "kyc_reviews_reviewerUserId_idx" ON "kyc_reviews"("reviewerUserId");

-- CreateIndex
CREATE INDEX "notifications_userId_read_idx" ON "notifications"("userId", "read");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

-- CreateIndex
CREATE INDEX "activity_logs_userId_idx" ON "activity_logs"("userId");

-- CreateIndex
CREATE INDEX "activity_logs_action_idx" ON "activity_logs"("action");

-- AddForeignKey
ALTER TABLE "otps" ADD CONSTRAINT "otps_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kyc_submissions" ADD CONSTRAINT "kyc_submissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kyc_documents" ADD CONSTRAINT "kyc_documents_kycSubmissionId_fkey" FOREIGN KEY ("kycSubmissionId") REFERENCES "kyc_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kyc_reviews" ADD CONSTRAINT "kyc_reviews_kycSubmissionId_fkey" FOREIGN KEY ("kycSubmissionId") REFERENCES "kyc_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kyc_reviews" ADD CONSTRAINT "kyc_reviews_reviewerUserId_fkey" FOREIGN KEY ("reviewerUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
