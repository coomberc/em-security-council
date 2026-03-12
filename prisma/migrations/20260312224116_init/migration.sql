-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('APPROVER', 'COUNCIL_MEMBER', 'STAFF_MEMBER');

-- CreateEnum
CREATE TYPE "SignOffStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'HAS_COMMENTS', 'APPROVED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "SignOffCategory" AS ENUM ('NEW_SUPPLIER_SOFTWARE', 'THIRD_PARTY_TOOL', 'SCOPE_CHANGE', 'NEW_PRODUCT_PLATFORM', 'SIGNIFICANT_CHANGE', 'TECHNICAL_INTEGRATION', 'AI_FUNCTIONALITY', 'DATA_SECURITY_IMPACT', 'OTHER');

-- CreateEnum
CREATE TYPE "ApprovalDecision" AS ENUM ('APPROVED', 'REJECTED', 'HAS_COMMENTS');

-- CreateEnum
CREATE TYPE "RiskLikelihood" AS ENUM ('VERY_LOW', 'LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH');

-- CreateEnum
CREATE TYPE "RiskImpact" AS ENUM ('NEGLIGIBLE', 'MINOR', 'MODERATE', 'MAJOR', 'SEVERE');

-- CreateEnum
CREATE TYPE "DataClassification" AS ENUM ('PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED');

-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'STAFF_MEMBER',
    "isFixedApprover" BOOLEAN NOT NULL DEFAULT false,
    "slackId" TEXT,
    "departmentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sign_offs" (
    "id" TEXT NOT NULL,
    "sequenceNumber" SERIAL NOT NULL,
    "status" "SignOffStatus" NOT NULL DEFAULT 'DRAFT',
    "title" TEXT NOT NULL,
    "categories" "SignOffCategory"[],
    "vendorName" TEXT,
    "vendorWebsite" TEXT,
    "description" TEXT NOT NULL DEFAULT '',
    "dueDiligence" TEXT NOT NULL DEFAULT '',
    "rollOutPlan" TEXT NOT NULL DEFAULT '',
    "cost" TEXT NOT NULL DEFAULT '',
    "isTrial" BOOLEAN NOT NULL DEFAULT false,
    "trialDuration" TEXT,
    "trialDataAccessScope" TEXT,
    "trialSuccessCriteria" TEXT,
    "trialGoLiveRolloutPlan" TEXT,
    "trialEndDate" TIMESTAMP(3),
    "parentSignOffId" TEXT,
    "contentVersion" INTEGER NOT NULL DEFAULT 1,
    "submittedById" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sign_offs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sign_off_custom_sections" (
    "id" TEXT NOT NULL,
    "signOffId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "sign_off_custom_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sign_off_supporting_docs" (
    "id" TEXT NOT NULL,
    "signOffId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "addedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sign_off_supporting_docs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sign_off_approvers" (
    "signOffId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isFixed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "sign_off_approvers_pkey" PRIMARY KEY ("signOffId","userId")
);

-- CreateTable
CREATE TABLE "sign_off_approvals" (
    "id" TEXT NOT NULL,
    "signOffId" TEXT NOT NULL,
    "approverId" TEXT NOT NULL,
    "decision" "ApprovalDecision" NOT NULL,
    "comment" TEXT,
    "contentVersion" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "sign_off_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sign_off_comments" (
    "id" TEXT NOT NULL,
    "signOffId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sign_off_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sign_off_status_changes" (
    "id" TEXT NOT NULL,
    "signOffId" TEXT NOT NULL,
    "fromStatus" "SignOffStatus",
    "toStatus" "SignOffStatus" NOT NULL,
    "changedById" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sign_off_status_changes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "risk_assessments" (
    "id" TEXT NOT NULL,
    "signOffId" TEXT NOT NULL,
    "dataClassification" "DataClassification",
    "dataClassificationUnknown" BOOLEAN NOT NULL DEFAULT false,
    "personalDataInvolved" BOOLEAN,
    "personalDataInvolvedUnknown" BOOLEAN NOT NULL DEFAULT false,
    "personalDataDetails" TEXT,
    "dataStorageLocation" TEXT,
    "dataStorageLocationUnknown" BOOLEAN NOT NULL DEFAULT false,
    "thirdPartyDataSharing" BOOLEAN,
    "thirdPartyDataSharingUnknown" BOOLEAN NOT NULL DEFAULT false,
    "thirdPartyDataDetails" TEXT,
    "likelihoodOfBreach" "RiskLikelihood",
    "likelihoodOfBreachUnknown" BOOLEAN NOT NULL DEFAULT false,
    "impactOfBreach" "RiskImpact",
    "impactOfBreachUnknown" BOOLEAN NOT NULL DEFAULT false,
    "overallRiskScore" INTEGER,
    "hasEncryptionAtRest" BOOLEAN,
    "hasEncryptionAtRestUnknown" BOOLEAN NOT NULL DEFAULT false,
    "hasEncryptionInTransit" BOOLEAN,
    "hasEncryptionInTransitUnknown" BOOLEAN NOT NULL DEFAULT false,
    "hasMfa" BOOLEAN,
    "hasMfaUnknown" BOOLEAN NOT NULL DEFAULT false,
    "hasAuditLogging" BOOLEAN,
    "hasAuditLoggingUnknown" BOOLEAN NOT NULL DEFAULT false,
    "hasPenTestReport" BOOLEAN,
    "hasPenTestReportUnknown" BOOLEAN NOT NULL DEFAULT false,
    "hasDisasterRecovery" BOOLEAN,
    "hasDisasterRecoveryUnknown" BOOLEAN NOT NULL DEFAULT false,
    "hasSla" BOOLEAN,
    "hasSlaUnknown" BOOLEAN NOT NULL DEFAULT false,
    "slaDetails" TEXT,
    "complianceCertifications" TEXT[],
    "mitigationPlan" TEXT,
    "residualRiskNotes" TEXT,

    CONSTRAINT "risk_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_audit_logs" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "performedById" TEXT NOT NULL,
    "previousValue" JSONB,
    "newValue" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "departments_slug_key" ON "departments"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sign_offs_sequenceNumber_key" ON "sign_offs"("sequenceNumber");

-- CreateIndex
CREATE INDEX "sign_offs_status_idx" ON "sign_offs"("status");

-- CreateIndex
CREATE INDEX "sign_offs_submittedById_idx" ON "sign_offs"("submittedById");

-- CreateIndex
CREATE INDEX "sign_offs_departmentId_idx" ON "sign_offs"("departmentId");

-- CreateIndex
CREATE INDEX "sign_offs_createdAt_idx" ON "sign_offs"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "sign_off_custom_sections_signOffId_idx" ON "sign_off_custom_sections"("signOffId");

-- CreateIndex
CREATE INDEX "sign_off_supporting_docs_signOffId_idx" ON "sign_off_supporting_docs"("signOffId");

-- CreateIndex
CREATE INDEX "sign_off_approvals_signOffId_idx" ON "sign_off_approvals"("signOffId");

-- CreateIndex
CREATE INDEX "sign_off_comments_signOffId_idx" ON "sign_off_comments"("signOffId");

-- CreateIndex
CREATE INDEX "sign_off_status_changes_signOffId_idx" ON "sign_off_status_changes"("signOffId");

-- CreateIndex
CREATE UNIQUE INDEX "risk_assessments_signOffId_key" ON "risk_assessments"("signOffId");

-- CreateIndex
CREATE INDEX "admin_audit_logs_targetType_targetId_idx" ON "admin_audit_logs"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "admin_audit_logs_performedById_idx" ON "admin_audit_logs"("performedById");

-- CreateIndex
CREATE INDEX "admin_audit_logs_createdAt_idx" ON "admin_audit_logs"("createdAt" DESC);

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sign_offs" ADD CONSTRAINT "sign_offs_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sign_offs" ADD CONSTRAINT "sign_offs_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sign_offs" ADD CONSTRAINT "sign_offs_parentSignOffId_fkey" FOREIGN KEY ("parentSignOffId") REFERENCES "sign_offs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sign_off_custom_sections" ADD CONSTRAINT "sign_off_custom_sections_signOffId_fkey" FOREIGN KEY ("signOffId") REFERENCES "sign_offs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sign_off_supporting_docs" ADD CONSTRAINT "sign_off_supporting_docs_signOffId_fkey" FOREIGN KEY ("signOffId") REFERENCES "sign_offs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sign_off_supporting_docs" ADD CONSTRAINT "sign_off_supporting_docs_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sign_off_approvers" ADD CONSTRAINT "sign_off_approvers_signOffId_fkey" FOREIGN KEY ("signOffId") REFERENCES "sign_offs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sign_off_approvers" ADD CONSTRAINT "sign_off_approvers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sign_off_approvals" ADD CONSTRAINT "sign_off_approvals_signOffId_fkey" FOREIGN KEY ("signOffId") REFERENCES "sign_offs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sign_off_approvals" ADD CONSTRAINT "sign_off_approvals_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sign_off_comments" ADD CONSTRAINT "sign_off_comments_signOffId_fkey" FOREIGN KEY ("signOffId") REFERENCES "sign_offs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sign_off_comments" ADD CONSTRAINT "sign_off_comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sign_off_comments" ADD CONSTRAINT "sign_off_comments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "sign_off_comments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sign_off_status_changes" ADD CONSTRAINT "sign_off_status_changes_signOffId_fkey" FOREIGN KEY ("signOffId") REFERENCES "sign_offs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sign_off_status_changes" ADD CONSTRAINT "sign_off_status_changes_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_assessments" ADD CONSTRAINT "risk_assessments_signOffId_fkey" FOREIGN KEY ("signOffId") REFERENCES "sign_offs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_audit_logs" ADD CONSTRAINT "admin_audit_logs_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
