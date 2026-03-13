-- AlterTable
ALTER TABLE "risk_assessments" ADD COLUMN "dataPrivacyNA" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "risk_assessments" ADD COLUMN "riskScoringNA" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "risk_assessments" ADD COLUMN "controlsNA" BOOLEAN NOT NULL DEFAULT false;
