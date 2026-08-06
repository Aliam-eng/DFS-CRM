-- Referral campaigns / marketing links. Each client can be linked to at
-- most one campaign (the one whose ?ref=<code> they signed up through).

CREATE TABLE IF NOT EXISTS "campaigns" (
  "id"              TEXT NOT NULL,
  "code"            TEXT NOT NULL,
  "name"            TEXT NOT NULL,
  "description"     TEXT,
  "active"          BOOLEAN NOT NULL DEFAULT true,
  "createdByUserId" TEXT NOT NULL,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "campaigns_code_key" ON "campaigns" ("code");
CREATE INDEX IF NOT EXISTS "campaigns_code_idx" ON "campaigns" ("code");
CREATE INDEX IF NOT EXISTS "campaigns_active_idx" ON "campaigns" ("active");

DO $$ BEGIN
  ALTER TABLE "campaigns"
    ADD CONSTRAINT "campaigns_createdByUserId_fkey"
    FOREIGN KEY ("createdByUserId") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- User.campaignId — nullable FK. Existing users get NULL (no impact).
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "campaignId" TEXT;

DO $$ BEGIN
  ALTER TABLE "users"
    ADD CONSTRAINT "users_campaignId_fkey"
    FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE INDEX IF NOT EXISTS "users_campaignId_idx" ON "users" ("campaignId");
