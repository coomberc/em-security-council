-- CreateEnum
CREATE TYPE "TrialOutcome" AS ENUM ('PENDING', 'ROLLED_OUT', 'CLOSED');

-- AlterTable
ALTER TABLE "sign_offs" ADD COLUMN "trialOutcome" "TrialOutcome",
ADD COLUMN "trialClosureReason" TEXT,
ADD COLUMN "trialClosedAt" TIMESTAMP(3);

-- Backfill: set existing approved trials with child sign-offs to ROLLED_OUT,
-- and remaining approved trials to PENDING
UPDATE "sign_offs"
SET "trialOutcome" = 'ROLLED_OUT'
WHERE "isTrial" = true
  AND "status" = 'APPROVED'
  AND "id" IN (
    SELECT DISTINCT "parentSignOffId"
    FROM "sign_offs"
    WHERE "parentSignOffId" IS NOT NULL
  );

UPDATE "sign_offs"
SET "trialOutcome" = 'PENDING'
WHERE "isTrial" = true
  AND "status" = 'APPROVED'
  AND "trialOutcome" IS NULL;
