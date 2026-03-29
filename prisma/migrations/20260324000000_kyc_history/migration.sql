-- CreateTable
CREATE TABLE "kyc_history" (
    "id" TEXT NOT NULL,
    "kycSubmissionId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "changes" JSONB,
    "performedBy" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kyc_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "kyc_history_kycSubmissionId_idx" ON "kyc_history"("kycSubmissionId");

-- CreateIndex
CREATE INDEX "kyc_history_createdAt_idx" ON "kyc_history"("createdAt");

-- AddForeignKey
ALTER TABLE "kyc_history" ADD CONSTRAINT "kyc_history_kycSubmissionId_fkey" FOREIGN KEY ("kycSubmissionId") REFERENCES "kyc_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kyc_history" ADD CONSTRAINT "kyc_history_performedBy_fkey" FOREIGN KEY ("performedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
