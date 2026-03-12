-- AlterTable
ALTER TABLE "risk_assessments" ADD COLUMN     "hasSso" BOOLEAN,
ADD COLUMN     "hasSsoUnknown" BOOLEAN NOT NULL DEFAULT false;
