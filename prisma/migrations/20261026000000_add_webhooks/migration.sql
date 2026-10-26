-- Outbound webhooks: super-admin-configured external URLs that receive a
-- signed JSON payload when a KYC lifecycle event fires. First supported
-- event is KYC_FINAL_APPROVED. Additive migration: new types + tables.

DO $$ BEGIN
  CREATE TYPE "WebhookEvent" AS ENUM ('KYC_FINAL_APPROVED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS "webhooks" (
  "id"              TEXT NOT NULL,
  "name"            TEXT NOT NULL,
  "url"             TEXT NOT NULL,
  "event"           "WebhookEvent" NOT NULL,
  "secret"          TEXT NOT NULL,
  "active"          BOOLEAN NOT NULL DEFAULT true,
  "createdByUserId" TEXT NOT NULL,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "webhooks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "webhooks_event_active_idx" ON "webhooks" ("event", "active");

DO $$ BEGIN
  ALTER TABLE "webhooks"
    ADD CONSTRAINT "webhooks_createdByUserId_fkey"
    FOREIGN KEY ("createdByUserId") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS "webhook_deliveries" (
  "id"             TEXT NOT NULL,
  "webhookId"      TEXT NOT NULL,
  "event"          "WebhookEvent" NOT NULL,
  "payload"        JSONB NOT NULL,
  "responseStatus" INTEGER,
  "responseBody"   TEXT,
  "errorMessage"   TEXT,
  "success"        BOOLEAN NOT NULL DEFAULT false,
  "attemptedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "durationMs"     INTEGER,
  CONSTRAINT "webhook_deliveries_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "webhook_deliveries_webhookId_attemptedAt_idx"
  ON "webhook_deliveries" ("webhookId", "attemptedAt");

DO $$ BEGIN
  ALTER TABLE "webhook_deliveries"
    ADD CONSTRAINT "webhook_deliveries_webhookId_fkey"
    FOREIGN KEY ("webhookId") REFERENCES "webhooks"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
