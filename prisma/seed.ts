import pg from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../lib/generated/prisma/client'
import 'dotenv/config'

// ---------------------------------------------------------------------------
// Bootstrap Prisma with the pg adapter (same pattern as lib/db.ts)
// ---------------------------------------------------------------------------

async function getPrisma() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL is not set')
  const pool = new pg.Pool({ connectionString: url })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adapter = new PrismaPg(pool as any)
  return new PrismaClient({ adapter })
}

// ---------------------------------------------------------------------------
// Deterministic IDs
// ---------------------------------------------------------------------------

const deptIds = {
  engineering: 'dept-engineering',
  product: 'dept-product',
  data: 'dept-data',
  finance: 'dept-finance',
  legal: 'dept-legal',
  operations: 'dept-operations',
  marketing: 'dept-marketing',
  customerSuccess: 'dept-customer-success',
} as const

const userIds = {
  andrewPhillips: 'user-andrew-phillips',
  jamesSimcox: 'user-james-simcox',
  garyMason: 'user-gary-mason',
  liamCarter: 'user-liam-carter',
  sophieTaylor: 'user-sophie-taylor',
  danielReeves: 'user-daniel-reeves',
  emmaHarrison: 'user-emma-harrison',
  oliverBennett: 'user-oliver-bennett',
  rachelChen: 'user-rachel-chen',
  samPatel: 'user-sam-patel',
  katieFord: 'user-katie-ford',
  tomNguyen: 'user-tom-nguyen',
  jessicaWood: 'user-jessica-wood',
} as const

// Sign-off IDs
const soIds = {
  slackEnterprise: 'so-slack-enterprise',
  notionWorkspace: 'so-notion-workspace',
  awsBedrock: 'so-aws-bedrock',
  copilotTrial: 'so-copilot-trial',
  snykSecurity: 'so-snyk-security',
  stripeConnect: 'so-stripe-connect',
  datadogApm: 'so-datadog-apm',
  openaiApi: 'so-openai-api',
  hubspotCrm: 'so-hubspot-crm',
  cursorIdeTrial: 'so-cursor-ide-trial',
} as const

// ---------------------------------------------------------------------------
// Seed function
// ---------------------------------------------------------------------------

async function main() {
  const prisma = await getPrisma()

  console.log('Clearing existing data...')
  await prisma.adminAuditLog.deleteMany()
  await prisma.signOffApproval.deleteMany()
  await prisma.signOffComment.deleteMany()
  await prisma.signOffStatusChange.deleteMany()
  await prisma.signOffSupportingDoc.deleteMany()
  await prisma.signOffCustomSection.deleteMany()
  await prisma.signOffApprover.deleteMany()
  await prisma.riskAssessment.deleteMany()
  await prisma.signOff.deleteMany()
  await prisma.user.deleteMany()
  await prisma.department.deleteMany()

  // -----------------------------------------------------------------------
  // Departments
  // -----------------------------------------------------------------------

  console.log('Creating departments...')
  const departments = [
    { id: deptIds.engineering, name: 'Engineering', slug: 'engineering' },
    { id: deptIds.product, name: 'Product', slug: 'product' },
    { id: deptIds.data, name: 'Data', slug: 'data' },
    { id: deptIds.finance, name: 'Finance', slug: 'finance' },
    { id: deptIds.legal, name: 'Legal', slug: 'legal' },
    { id: deptIds.operations, name: 'Operations', slug: 'operations' },
    { id: deptIds.marketing, name: 'Marketing', slug: 'marketing' },
    { id: deptIds.customerSuccess, name: 'Customer Success', slug: 'customer-success' },
  ]
  for (const d of departments) {
    await prisma.department.create({ data: d })
  }

  // -----------------------------------------------------------------------
  // Users
  // -----------------------------------------------------------------------

  console.log('Creating users...')

  // Fixed approvers
  await prisma.user.create({
    data: {
      id: userIds.andrewPhillips,
      name: 'Andrew Phillips',
      email: 'andrew.phillips@equalsmoney.com',
      role: 'APPROVER',
      isFixedApprover: true,
      departmentId: deptIds.engineering,
    },
  })
  await prisma.user.create({
    data: {
      id: userIds.jamesSimcox,
      name: 'James Simcox',
      email: 'james.simcox@equalsmoney.com',
      role: 'APPROVER',
      isFixedApprover: true,
      departmentId: deptIds.operations,
    },
  })
  await prisma.user.create({
    data: {
      id: userIds.garyMason,
      name: 'Gary Mason',
      email: 'gary.mason@equalsmoney.com',
      role: 'APPROVER',
      isFixedApprover: true,
      departmentId: deptIds.finance,
    },
  })

  // Council members
  await prisma.user.create({
    data: {
      id: userIds.liamCarter,
      name: 'Liam Carter',
      email: 'liam.carter@equalsmoney.com',
      role: 'COUNCIL_MEMBER',
      departmentId: deptIds.engineering,
    },
  })
  await prisma.user.create({
    data: {
      id: userIds.sophieTaylor,
      name: 'Sophie Taylor',
      email: 'sophie.taylor@equalsmoney.com',
      role: 'COUNCIL_MEMBER',
      departmentId: deptIds.product,
    },
  })
  await prisma.user.create({
    data: {
      id: userIds.danielReeves,
      name: 'Daniel Reeves',
      email: 'daniel.reeves@equalsmoney.com',
      role: 'COUNCIL_MEMBER',
      departmentId: deptIds.data,
    },
  })
  await prisma.user.create({
    data: {
      id: userIds.emmaHarrison,
      name: 'Emma Harrison',
      email: 'emma.harrison@equalsmoney.com',
      role: 'COUNCIL_MEMBER',
      departmentId: deptIds.legal,
    },
  })

  // Staff members
  await prisma.user.create({
    data: {
      id: userIds.oliverBennett,
      name: 'Oliver Bennett',
      email: 'oliver.bennett@equalsmoney.com',
      role: 'STAFF_MEMBER',
      departmentId: deptIds.engineering,
    },
  })
  await prisma.user.create({
    data: {
      id: userIds.rachelChen,
      name: 'Rachel Chen',
      email: 'rachel.chen@equalsmoney.com',
      role: 'STAFF_MEMBER',
      departmentId: deptIds.product,
    },
  })
  await prisma.user.create({
    data: {
      id: userIds.samPatel,
      name: 'Sam Patel',
      email: 'sam.patel@equalsmoney.com',
      role: 'STAFF_MEMBER',
      departmentId: deptIds.data,
    },
  })
  await prisma.user.create({
    data: {
      id: userIds.katieFord,
      name: 'Katie Ford',
      email: 'katie.ford@equalsmoney.com',
      role: 'STAFF_MEMBER',
      departmentId: deptIds.marketing,
    },
  })
  await prisma.user.create({
    data: {
      id: userIds.tomNguyen,
      name: 'Tom Nguyen',
      email: 'tom.nguyen@equalsmoney.com',
      role: 'STAFF_MEMBER',
      departmentId: deptIds.customerSuccess,
    },
  })
  await prisma.user.create({
    data: {
      id: userIds.jessicaWood,
      name: 'Jessica Wood',
      email: 'jessica.wood@equalsmoney.com',
      role: 'STAFF_MEMBER',
      departmentId: deptIds.finance,
    },
  })

  // -----------------------------------------------------------------------
  // Helper: assign the 3 fixed approvers to a sign-off
  // -----------------------------------------------------------------------

  const fixedApproverIds = [
    userIds.andrewPhillips,
    userIds.jamesSimcox,
    userIds.garyMason,
  ]

  async function assignFixedApprovers(signOffId: string) {
    await prisma.signOffApprover.createMany({
      data: fixedApproverIds.map((userId) => ({
        signOffId,
        userId,
        isFixed: true,
      })),
    })
  }

  // -----------------------------------------------------------------------
  // Sign-offs
  // -----------------------------------------------------------------------

  console.log('Creating sign-offs...')

  const now = new Date()
  const daysAgo = (n: number) => new Date(now.getTime() - n * 86_400_000)

  // --- 1. Slack Enterprise Grid - APPROVED (all 3 approvals) ---
  await prisma.signOff.create({
    data: {
      id: soIds.slackEnterprise,
      title: 'Slack Enterprise Grid - Organisation Upgrade',
      status: 'APPROVED',
      categories: ['THIRD_PARTY_TOOL', 'SIGNIFICANT_CHANGE'],
      vendorName: 'Slack Technologies (Salesforce)',
      vendorWebsite: 'https://slack.com/enterprise',
      description:
        'Upgrade our existing Slack Business+ plan to Enterprise Grid to enable cross-workspace channels, enhanced security controls (EKM), and DLP integration. This affects all 350+ staff members.',
      dueDiligence:
        'Slack Enterprise Grid is SOC 2 Type II, ISO 27001, and FedRAMP certified. Salesforce has a strong track record with enterprise customers in financial services. Reviewed their data processing agreement and sub-processor list.',
      rollOutPlan:
        'Phase 1: Pilot with Engineering and Product (2 weeks). Phase 2: Migrate remaining workspaces with IT support (1 week). Phase 3: Enable advanced security features — EKM, audit logs API, DLP (ongoing).',
      cost: '£42,000 per annum (up from £28,000 on Business+). 3-year commitment with 10% discount.',
      isTrial: false,
      submittedById: userIds.liamCarter,
      departmentId: deptIds.engineering,
      contentVersion: 1,
      createdAt: daysAgo(45),
      updatedAt: daysAgo(30),
    },
  })
  await assignFixedApprovers(soIds.slackEnterprise)

  await prisma.riskAssessment.create({
    data: {
      signOffId: soIds.slackEnterprise,
      dataClassification: 'CONFIDENTIAL',
      personalDataInvolved: true,
      personalDataDetails: 'Employee names, email addresses, and internal communications.',
      dataStorageLocation: 'AWS us-east-1 and eu-west-1 (Slack-managed)',
      thirdPartyDataSharing: false,
      likelihoodOfBreach: 'VERY_LOW',
      impactOfBreach: 'MAJOR',
      overallRiskScore: 4,
      hasEncryptionAtRest: true,
      hasEncryptionInTransit: true,
      hasMfa: true,
      hasAuditLogging: true,
      hasPenTestReport: true,
      hasDisasterRecovery: true,
      hasSla: true,
      slaDetails: '99.99% uptime SLA with financial credits for breaches.',
      complianceCertifications: ['SOC 2 Type II', 'ISO 27001', 'ISO 27018', 'FedRAMP Moderate'],
      mitigationPlan: 'Enable EKM for encryption key management. Configure DLP rules before rollout.',
    },
  })

  await prisma.signOffCustomSection.create({
    data: {
      signOffId: soIds.slackEnterprise,
      title: 'Integration Impact',
      content:
        'Existing integrations (Jira, GitHub, PagerDuty) will carry over. New Enterprise Grid APIs will allow us to build custom compliance bots.',
      sortOrder: 0,
    },
  })

  await prisma.signOffSupportingDoc.create({
    data: {
      signOffId: soIds.slackEnterprise,
      title: 'Slack Enterprise Grid Security Whitepaper',
      url: 'https://slack.com/trust/security',
      addedById: userIds.liamCarter,
    },
  })

  // Approvals for Slack (all 3 approved)
  for (const approverId of fixedApproverIds) {
    await prisma.signOffApproval.create({
      data: {
        signOffId: soIds.slackEnterprise,
        approverId,
        decision: 'APPROVED',
        comment: 'Reviewed and approved. Good due diligence on the security posture.',
        contentVersion: 1,
        createdAt: daysAgo(32),
      },
    })
  }

  // Status history for Slack
  await prisma.signOffStatusChange.createMany({
    data: [
      { signOffId: soIds.slackEnterprise, fromStatus: null, toStatus: 'DRAFT', changedById: userIds.liamCarter, createdAt: daysAgo(45) },
      { signOffId: soIds.slackEnterprise, fromStatus: 'DRAFT', toStatus: 'SUBMITTED', changedById: userIds.liamCarter, createdAt: daysAgo(40) },
      { signOffId: soIds.slackEnterprise, fromStatus: 'SUBMITTED', toStatus: 'APPROVED', changedById: userIds.garyMason, createdAt: daysAgo(30) },
    ],
  })

  // --- 2. Notion Workspace - SUBMITTED (2 of 3 approvals) ---
  await prisma.signOff.create({
    data: {
      id: soIds.notionWorkspace,
      title: 'Notion Enterprise - Company Knowledge Base',
      status: 'SUBMITTED',
      categories: ['THIRD_PARTY_TOOL', 'NEW_SUPPLIER_SOFTWARE'],
      vendorName: 'Notion Labs Inc.',
      vendorWebsite: 'https://notion.so',
      description:
        'Adopt Notion as the company-wide knowledge management platform, replacing Confluence. This will serve as the single source of truth for documentation, runbooks, and onboarding materials.',
      dueDiligence:
        'Notion is SOC 2 Type II certified and has completed a recent penetration test (report available on request). Data residency options available for EU storage. SAML SSO supported.',
      rollOutPlan:
        'Phase 1: IT and Engineering pilot (4 weeks). Phase 2: Content migration from Confluence using Notion importer (2 weeks). Phase 3: Company-wide rollout with training sessions.',
      cost: '£18 per user/month. Estimated annual cost: £75,600 for 350 users.',
      isTrial: false,
      submittedById: userIds.sophieTaylor,
      departmentId: deptIds.product,
      contentVersion: 1,
      createdAt: daysAgo(14),
      updatedAt: daysAgo(5),
    },
  })
  await assignFixedApprovers(soIds.notionWorkspace)

  await prisma.riskAssessment.create({
    data: {
      signOffId: soIds.notionWorkspace,
      dataClassification: 'CONFIDENTIAL',
      personalDataInvolved: true,
      personalDataDetails: 'Internal process documentation may reference employee names and project codenames.',
      dataStorageLocation: 'AWS eu-west-1 (Notion-managed, EU data residency)',
      thirdPartyDataSharing: false,
      likelihoodOfBreach: 'LOW',
      impactOfBreach: 'MODERATE',
      overallRiskScore: 6,
      hasEncryptionAtRest: true,
      hasEncryptionInTransit: true,
      hasMfa: true,
      hasAuditLogging: true,
      hasPenTestReport: true,
      hasDisasterRecovery: true,
      hasSla: true,
      slaDetails: '99.9% uptime SLA.',
      complianceCertifications: ['SOC 2 Type II', 'ISO 27001', 'GDPR compliant'],
    },
  })

  // 2 of 3 approvals
  await prisma.signOffApproval.create({
    data: {
      signOffId: soIds.notionWorkspace,
      approverId: userIds.andrewPhillips,
      decision: 'APPROVED',
      comment: 'Looks good. Happy with the EU data residency option.',
      contentVersion: 1,
      createdAt: daysAgo(8),
    },
  })
  await prisma.signOffApproval.create({
    data: {
      signOffId: soIds.notionWorkspace,
      approverId: userIds.jamesSimcox,
      decision: 'APPROVED',
      comment: 'Approved. Please ensure SAML SSO is configured before rollout.',
      contentVersion: 1,
      createdAt: daysAgo(6),
    },
  })

  await prisma.signOffStatusChange.createMany({
    data: [
      { signOffId: soIds.notionWorkspace, fromStatus: null, toStatus: 'DRAFT', changedById: userIds.sophieTaylor, createdAt: daysAgo(14) },
      { signOffId: soIds.notionWorkspace, fromStatus: 'DRAFT', toStatus: 'SUBMITTED', changedById: userIds.sophieTaylor, createdAt: daysAgo(10) },
    ],
  })

  // --- 3. AWS Bedrock AI - DRAFT ---
  await prisma.signOff.create({
    data: {
      id: soIds.awsBedrock,
      title: 'AWS Bedrock - Foundation Model Access for Internal Tooling',
      status: 'DRAFT',
      categories: ['AI_FUNCTIONALITY', 'TECHNICAL_INTEGRATION', 'DATA_SECURITY_IMPACT'],
      vendorName: 'Amazon Web Services',
      vendorWebsite: 'https://aws.amazon.com/bedrock/',
      description:
        'Enable AWS Bedrock in our existing AWS account to provide foundation model access (Claude, Titan) for internal developer tooling. Initial use case: automated code review summaries and incident post-mortem generation.',
      dueDiligence:
        'AWS Bedrock runs within our existing VPC. No data leaves the AWS environment. Models available include Anthropic Claude and Amazon Titan. AWS BAA already in place.',
      rollOutPlan: '',
      cost: 'Usage-based pricing. Estimated £2,000-£5,000/month based on projected token volumes.',
      isTrial: false,
      submittedById: userIds.oliverBennett,
      departmentId: deptIds.engineering,
      contentVersion: 1,
      createdAt: daysAgo(3),
      updatedAt: daysAgo(3),
    },
  })
  await assignFixedApprovers(soIds.awsBedrock)

  await prisma.signOffStatusChange.create({
    data: {
      signOffId: soIds.awsBedrock,
      fromStatus: null,
      toStatus: 'DRAFT',
      changedById: userIds.oliverBennett,
      createdAt: daysAgo(3),
    },
  })

  // --- 4. GitHub Copilot Trial - APPROVED (trial sign-off) ---
  await prisma.signOff.create({
    data: {
      id: soIds.copilotTrial,
      title: 'GitHub Copilot Business - Engineering Trial',
      status: 'APPROVED',
      categories: ['AI_FUNCTIONALITY', 'THIRD_PARTY_TOOL'],
      vendorName: 'GitHub (Microsoft)',
      vendorWebsite: 'https://github.com/features/copilot',
      description:
        'Trial GitHub Copilot Business for the engineering team to evaluate productivity gains in code completion, test generation, and documentation. Trial limited to 15 developers.',
      dueDiligence:
        'GitHub Copilot Business does not retain code snippets or use them for model training. Telemetry can be disabled at the org level. SOC 2 Type II certified through GitHub Enterprise.',
      rollOutPlan:
        'Enable Copilot seats for 15 senior engineers. Collect feedback via weekly surveys. Measure PR velocity and code quality metrics over the trial period.',
      cost: '£19/user/month. Trial cost: £855 total for 3 months (15 users).',
      isTrial: true,
      trialDuration: '3 months',
      trialDataAccessScope: 'Code repositories only. No access to production data or customer information.',
      trialSuccessCriteria: '20% improvement in PR throughput. Positive developer satisfaction score (>7/10). No security incidents.',
      trialGoLiveRolloutPlan: 'If successful, expand to all 45 engineering staff. Submit separate full rollout sign-off.',
      trialEndDate: daysAgo(-30),
      submittedById: userIds.andrewPhillips,
      departmentId: deptIds.engineering,
      contentVersion: 1,
      createdAt: daysAgo(60),
      updatedAt: daysAgo(50),
    },
  })
  await assignFixedApprovers(soIds.copilotTrial)

  await prisma.riskAssessment.create({
    data: {
      signOffId: soIds.copilotTrial,
      dataClassification: 'INTERNAL',
      personalDataInvolved: false,
      dataStorageLocation: 'GitHub-managed infrastructure (Azure)',
      thirdPartyDataSharing: true,
      thirdPartyDataDetails: 'Code snippets sent to GitHub/OpenAI for completion. Business plan ensures no data retention for training.',
      likelihoodOfBreach: 'LOW',
      impactOfBreach: 'MINOR',
      overallRiskScore: 2,
      hasEncryptionAtRest: true,
      hasEncryptionInTransit: true,
      hasMfa: true,
      hasAuditLogging: true,
      hasPenTestReport: true,
      hasDisasterRecovery: true,
      hasSla: true,
      slaDetails: 'GitHub Enterprise SLA applies.',
      complianceCertifications: ['SOC 2 Type II', 'ISO 27001'],
    },
  })

  // All 3 approvals (auto-approved for Andrew since he submitted)
  await prisma.signOffApproval.create({
    data: {
      signOffId: soIds.copilotTrial,
      approverId: userIds.andrewPhillips,
      decision: 'APPROVED',
      comment: 'Auto-approved (submitter is a fixed approver)',
      contentVersion: 1,
      createdAt: daysAgo(55),
    },
  })
  await prisma.signOffApproval.create({
    data: {
      signOffId: soIds.copilotTrial,
      approverId: userIds.jamesSimcox,
      decision: 'APPROVED',
      comment: 'Good scope limitation. Happy to approve the trial.',
      contentVersion: 1,
      createdAt: daysAgo(53),
    },
  })
  await prisma.signOffApproval.create({
    data: {
      signOffId: soIds.copilotTrial,
      approverId: userIds.garyMason,
      decision: 'APPROVED',
      comment: 'Approved. Reasonable cost for the trial period.',
      contentVersion: 1,
      createdAt: daysAgo(51),
    },
  })

  await prisma.signOffStatusChange.createMany({
    data: [
      { signOffId: soIds.copilotTrial, fromStatus: null, toStatus: 'DRAFT', changedById: userIds.andrewPhillips, createdAt: daysAgo(60) },
      { signOffId: soIds.copilotTrial, fromStatus: 'DRAFT', toStatus: 'SUBMITTED', changedById: userIds.andrewPhillips, createdAt: daysAgo(55) },
      { signOffId: soIds.copilotTrial, fromStatus: 'SUBMITTED', toStatus: 'APPROVED', changedById: userIds.garyMason, createdAt: daysAgo(50) },
    ],
  })

  // --- 5. Snyk Security Scanner - HAS_COMMENTS ---
  await prisma.signOff.create({
    data: {
      id: soIds.snykSecurity,
      title: 'Snyk - Application Security Testing Platform',
      status: 'HAS_COMMENTS',
      categories: ['NEW_SUPPLIER_SOFTWARE', 'THIRD_PARTY_TOOL'],
      vendorName: 'Snyk Ltd',
      vendorWebsite: 'https://snyk.io',
      description:
        'Integrate Snyk into our CI/CD pipeline for automated dependency vulnerability scanning, container image scanning, and IaC security checks. Replaces manual dependency auditing.',
      dueDiligence:
        'Snyk is widely adopted in the fintech space. SOC 2 Type II certified. Integrates natively with GitHub and our existing Jenkins pipelines.',
      rollOutPlan:
        'Phase 1: Enable Snyk Open Source on all GitHub repos (1 week). Phase 2: Container scanning on Docker images (1 week). Phase 3: IaC scanning for Terraform configs (2 weeks).',
      cost: '£32,000 per annum for Team plan (up to 100 developers).',
      isTrial: false,
      submittedById: userIds.danielReeves,
      departmentId: deptIds.data,
      contentVersion: 2,
      createdAt: daysAgo(20),
      updatedAt: daysAgo(7),
    },
  })
  await assignFixedApprovers(soIds.snykSecurity)

  await prisma.riskAssessment.create({
    data: {
      signOffId: soIds.snykSecurity,
      dataClassification: 'INTERNAL',
      personalDataInvolved: false,
      dataStorageLocation: 'Snyk-managed cloud (AWS eu-west-1)',
      thirdPartyDataSharing: true,
      thirdPartyDataDetails: 'Dependency manifests (package.json, Dockerfile) are shared with Snyk for analysis. No source code is transmitted.',
      likelihoodOfBreach: 'VERY_LOW',
      impactOfBreach: 'MINOR',
      overallRiskScore: 1,
      hasEncryptionAtRest: true,
      hasEncryptionInTransit: true,
      hasMfa: true,
      hasAuditLogging: true,
      hasPenTestReport: true,
      hasDisasterRecovery: true,
      hasSla: true,
      slaDetails: '99.9% uptime.',
      complianceCertifications: ['SOC 2 Type II', 'ISO 27001'],
    },
  })

  // 1 approval, 1 has-comments
  await prisma.signOffApproval.create({
    data: {
      signOffId: soIds.snykSecurity,
      approverId: userIds.andrewPhillips,
      decision: 'APPROVED',
      comment: 'Strong choice. We need this kind of automated scanning.',
      contentVersion: 2,
      createdAt: daysAgo(10),
    },
  })
  await prisma.signOffApproval.create({
    data: {
      signOffId: soIds.snykSecurity,
      approverId: userIds.garyMason,
      decision: 'HAS_COMMENTS',
      comment: 'Can we get a breakdown of the pricing tiers? £32k seems steep — have we compared with Dependabot (free) or Mend?',
      contentVersion: 2,
      createdAt: daysAgo(8),
    },
  })

  await prisma.signOffComment.createMany({
    data: [
      {
        signOffId: soIds.snykSecurity,
        authorId: userIds.garyMason,
        content: 'Can we get a breakdown of the pricing tiers? £32k seems steep — have we compared with Dependabot (free) or Mend?',
        createdAt: daysAgo(8),
      },
      {
        signOffId: soIds.snykSecurity,
        authorId: userIds.danielReeves,
        content: 'Good point. I have added a cost comparison in the updated description. Snyk provides container and IaC scanning which Dependabot does not cover. Mend was evaluated but lacks the GitHub App integration we need.',
        createdAt: daysAgo(7),
      },
    ],
  })

  await prisma.signOffStatusChange.createMany({
    data: [
      { signOffId: soIds.snykSecurity, fromStatus: null, toStatus: 'DRAFT', changedById: userIds.danielReeves, createdAt: daysAgo(20) },
      { signOffId: soIds.snykSecurity, fromStatus: 'DRAFT', toStatus: 'SUBMITTED', changedById: userIds.danielReeves, createdAt: daysAgo(15) },
      { signOffId: soIds.snykSecurity, fromStatus: 'SUBMITTED', toStatus: 'HAS_COMMENTS', changedById: userIds.garyMason, createdAt: daysAgo(8) },
    ],
  })

  // --- 6. Stripe Connect - REJECTED ---
  await prisma.signOff.create({
    data: {
      id: soIds.stripeConnect,
      title: 'Stripe Connect - Marketplace Payments Integration',
      status: 'REJECTED',
      categories: ['TECHNICAL_INTEGRATION', 'DATA_SECURITY_IMPACT', 'NEW_PRODUCT_PLATFORM'],
      vendorName: 'Stripe Inc.',
      vendorWebsite: 'https://stripe.com/connect',
      description:
        'Integrate Stripe Connect to enable marketplace-style payment splitting for our new merchant referral programme. This would handle sub-merchant onboarding and automated payment routing.',
      dueDiligence:
        'Stripe is PCI DSS Level 1 certified. Connect platform has been reviewed by our compliance team. However, regulatory concerns have been raised about the e-money implications.',
      rollOutPlan:
        'Phase 1: Sandbox integration (4 weeks). Phase 2: FCA notification and compliance review (8 weeks). Phase 3: Limited pilot with 10 merchants.',
      cost: '2.9% + 20p per transaction. Platform fee: 0.5% per connected account transaction. Estimated £15,000/month at projected volumes.',
      isTrial: false,
      submittedById: userIds.jessicaWood,
      departmentId: deptIds.finance,
      contentVersion: 1,
      createdAt: daysAgo(35),
      updatedAt: daysAgo(25),
    },
  })
  await assignFixedApprovers(soIds.stripeConnect)

  await prisma.riskAssessment.create({
    data: {
      signOffId: soIds.stripeConnect,
      dataClassification: 'RESTRICTED',
      personalDataInvolved: true,
      personalDataDetails: 'Merchant PII, bank account details, transaction data, KYC documents.',
      dataStorageLocation: 'Stripe-managed infrastructure (PCI DSS compliant)',
      thirdPartyDataSharing: true,
      thirdPartyDataDetails: 'Customer and merchant financial data shared with Stripe for payment processing.',
      likelihoodOfBreach: 'LOW',
      impactOfBreach: 'SEVERE',
      overallRiskScore: 20,
      hasEncryptionAtRest: true,
      hasEncryptionInTransit: true,
      hasMfa: true,
      hasAuditLogging: true,
      hasPenTestReport: true,
      hasDisasterRecovery: true,
      hasSla: true,
      slaDetails: '99.99% uptime SLA for API availability.',
      complianceCertifications: ['PCI DSS Level 1', 'SOC 2 Type II', 'ISO 27001'],
      mitigationPlan: 'Engage FCA regulatory counsel before proceeding. Implement additional AML checks on connected accounts.',
      residualRiskNotes: 'Regulatory risk remains high. FCA may classify this as a material change to our e-money licence.',
    },
  })

  await prisma.signOffApproval.create({
    data: {
      signOffId: soIds.stripeConnect,
      approverId: userIds.garyMason,
      decision: 'REJECTED',
      comment: 'Rejected due to unresolved regulatory concerns. The FCA implications of operating a payment marketplace under our existing e-money licence need to be fully assessed before we can proceed. Please engage Legal and Compliance first.',
      contentVersion: 1,
      createdAt: daysAgo(26),
    },
  })

  await prisma.signOffComment.create({
    data: {
      signOffId: soIds.stripeConnect,
      authorId: userIds.garyMason,
      content: 'Rejected due to unresolved regulatory concerns. The FCA implications of operating a payment marketplace under our existing e-money licence need to be fully assessed before we can proceed. Please engage Legal and Compliance first.',
      createdAt: daysAgo(26),
    },
  })

  await prisma.signOffStatusChange.createMany({
    data: [
      { signOffId: soIds.stripeConnect, fromStatus: null, toStatus: 'DRAFT', changedById: userIds.jessicaWood, createdAt: daysAgo(35) },
      { signOffId: soIds.stripeConnect, fromStatus: 'DRAFT', toStatus: 'SUBMITTED', changedById: userIds.jessicaWood, createdAt: daysAgo(30) },
      { signOffId: soIds.stripeConnect, fromStatus: 'SUBMITTED', toStatus: 'REJECTED', changedById: userIds.garyMason, createdAt: daysAgo(25) },
    ],
  })

  // --- 7. Datadog APM - SUBMITTED (1 of 3 approvals) ---
  await prisma.signOff.create({
    data: {
      id: soIds.datadogApm,
      title: 'Datadog APM - Application Performance Monitoring',
      status: 'SUBMITTED',
      categories: ['THIRD_PARTY_TOOL', 'TECHNICAL_INTEGRATION'],
      vendorName: 'Datadog Inc.',
      vendorWebsite: 'https://www.datadoghq.com',
      description:
        'Adopt Datadog APM for distributed tracing, error tracking, and performance monitoring across our Node.js and Python services. This replaces our current New Relic setup which lacks adequate Kubernetes support.',
      dueDiligence:
        'Datadog is SOC 2 Type II, ISO 27001, and HIPAA compliant. Widely used in financial services. Their agent runs as a DaemonSet in our EKS clusters. Data can be stored in EU region.',
      rollOutPlan:
        'Phase 1: Deploy Datadog agent to staging EKS cluster (1 week). Phase 2: Instrument Node.js services with dd-trace (2 weeks). Phase 3: Migrate alerting from New Relic to Datadog (1 week). Phase 4: Decommission New Relic.',
      cost: '£45 per host/month for APM. Estimated 25 hosts = £13,500/year. Infrastructure monitoring bundled at £18 per host.',
      isTrial: false,
      submittedById: userIds.liamCarter,
      departmentId: deptIds.engineering,
      contentVersion: 1,
      createdAt: daysAgo(10),
      updatedAt: daysAgo(4),
    },
  })
  await assignFixedApprovers(soIds.datadogApm)

  await prisma.signOffApproval.create({
    data: {
      signOffId: soIds.datadogApm,
      approverId: userIds.andrewPhillips,
      decision: 'APPROVED',
      comment: 'Good replacement for New Relic. The Kubernetes native support is a significant improvement.',
      contentVersion: 1,
      createdAt: daysAgo(5),
    },
  })

  await prisma.signOffStatusChange.createMany({
    data: [
      { signOffId: soIds.datadogApm, fromStatus: null, toStatus: 'DRAFT', changedById: userIds.liamCarter, createdAt: daysAgo(10) },
      { signOffId: soIds.datadogApm, fromStatus: 'DRAFT', toStatus: 'SUBMITTED', changedById: userIds.liamCarter, createdAt: daysAgo(7) },
    ],
  })

  // --- 8. OpenAI API - WITHDRAWN ---
  await prisma.signOff.create({
    data: {
      id: soIds.openaiApi,
      title: 'OpenAI API - Customer Support Chatbot',
      status: 'WITHDRAWN',
      categories: ['AI_FUNCTIONALITY', 'DATA_SECURITY_IMPACT', 'NEW_PRODUCT_PLATFORM'],
      vendorName: 'OpenAI',
      vendorWebsite: 'https://openai.com',
      description:
        'Integrate OpenAI GPT-4 API to power an AI-driven customer support chatbot on our public-facing help centre. The bot would handle tier-1 queries and escalate complex issues to human agents.',
      dueDiligence:
        'OpenAI offers a Business tier with data processing agreements and no training on customer data. SOC 2 Type II certified. However, concerns raised about sending customer query data to a US-based provider.',
      rollOutPlan:
        'Phase 1: Build chatbot with RAG pipeline using our knowledge base (6 weeks). Phase 2: Internal testing with support team (2 weeks). Phase 3: Gradual rollout to 10% of help centre traffic.',
      cost: 'Usage-based. Estimated £3,000-£8,000/month depending on query volume.',
      isTrial: false,
      submittedById: userIds.tomNguyen,
      departmentId: deptIds.customerSuccess,
      contentVersion: 1,
      createdAt: daysAgo(28),
      updatedAt: daysAgo(18),
    },
  })
  await assignFixedApprovers(soIds.openaiApi)

  await prisma.signOffComment.createMany({
    data: [
      {
        signOffId: soIds.openaiApi,
        authorId: userIds.emmaHarrison,
        content: 'Legal has flagged concerns about sending customer query data to OpenAI servers in the US. We need to assess GDPR transfer mechanism implications and whether our privacy notice covers this use case.',
        createdAt: daysAgo(22),
      },
      {
        signOffId: soIds.openaiApi,
        authorId: userIds.tomNguyen,
        content: 'Understood. Withdrawing this request pending the outcome of the GDPR assessment. We will re-evaluate once Legal has completed their review of the data transfer mechanism.',
        createdAt: daysAgo(18),
      },
    ],
  })

  await prisma.signOffStatusChange.createMany({
    data: [
      { signOffId: soIds.openaiApi, fromStatus: null, toStatus: 'DRAFT', changedById: userIds.tomNguyen, createdAt: daysAgo(28) },
      { signOffId: soIds.openaiApi, fromStatus: 'DRAFT', toStatus: 'SUBMITTED', changedById: userIds.tomNguyen, createdAt: daysAgo(25) },
      { signOffId: soIds.openaiApi, fromStatus: 'SUBMITTED', toStatus: 'WITHDRAWN', changedById: userIds.tomNguyen, reason: 'Pending GDPR data transfer assessment by Legal.', createdAt: daysAgo(18) },
    ],
  })

  // --- 9. HubSpot CRM - DRAFT ---
  await prisma.signOff.create({
    data: {
      id: soIds.hubspotCrm,
      title: 'HubSpot CRM - Marketing Automation Platform',
      status: 'DRAFT',
      categories: ['NEW_SUPPLIER_SOFTWARE', 'THIRD_PARTY_TOOL', 'DATA_SECURITY_IMPACT'],
      vendorName: 'HubSpot Inc.',
      vendorWebsite: 'https://www.hubspot.com',
      description:
        'Adopt HubSpot as our CRM and marketing automation platform. This will consolidate lead tracking, email campaigns, and sales pipeline management into a single tool, replacing our current Mailchimp + spreadsheet workflow.',
      dueDiligence:
        'HubSpot is SOC 2 Type II certified and offers EU data hosting. GDPR-compliant with built-in consent management. Integrates with Slack and Salesforce.',
      rollOutPlan: '',
      cost: 'Professional tier: £800/month for 5 seats + £45/month per additional seat. Estimated £14,400/year.',
      isTrial: false,
      submittedById: userIds.katieFord,
      departmentId: deptIds.marketing,
      contentVersion: 1,
      createdAt: daysAgo(2),
      updatedAt: daysAgo(2),
    },
  })
  await assignFixedApprovers(soIds.hubspotCrm)

  await prisma.signOffStatusChange.create({
    data: {
      signOffId: soIds.hubspotCrm,
      fromStatus: null,
      toStatus: 'DRAFT',
      changedById: userIds.katieFord,
      createdAt: daysAgo(2),
    },
  })

  // --- 10. Cursor IDE Trial - SUBMITTED (0 approvals, trial) ---
  await prisma.signOff.create({
    data: {
      id: soIds.cursorIdeTrial,
      title: 'Cursor IDE - AI-Powered Development Environment Trial',
      status: 'SUBMITTED',
      categories: ['AI_FUNCTIONALITY', 'THIRD_PARTY_TOOL'],
      vendorName: 'Anysphere Inc.',
      vendorWebsite: 'https://cursor.com',
      description:
        'Trial Cursor IDE (VS Code fork with integrated AI assistance) for a small group of 5 developers. Cursor provides inline AI code generation, codebase-aware chat, and automated refactoring capabilities.',
      dueDiligence:
        'Cursor is a relatively new product. They offer a Privacy Mode that ensures no code is stored on their servers. SOC 2 Type II certification is in progress (expected Q2 2026). The IDE is a fork of VS Code and supports all existing extensions.',
      rollOutPlan:
        'Enable Cursor Business licences for 5 volunteers from the engineering team. Evaluate over 6 weeks against GitHub Copilot (which we already have approved). Decision criteria: developer preference, code quality, and cost-effectiveness.',
      cost: '£40/user/month. Trial cost: £1,200 total for 6 weeks (5 users).',
      isTrial: true,
      trialDuration: '6 weeks',
      trialDataAccessScope: 'Code repositories only. Privacy Mode enabled — no code stored on Cursor servers.',
      trialSuccessCriteria: 'Developer satisfaction survey (>7/10). Feature comparison vs Copilot documented. No security incidents.',
      trialGoLiveRolloutPlan: 'If preferred over Copilot, submit full rollout sign-off to replace Copilot licences.',
      trialEndDate: daysAgo(-25),
      submittedById: userIds.oliverBennett,
      departmentId: deptIds.engineering,
      contentVersion: 1,
      createdAt: daysAgo(5),
      updatedAt: daysAgo(1),
    },
  })
  await assignFixedApprovers(soIds.cursorIdeTrial)

  await prisma.riskAssessment.create({
    data: {
      signOffId: soIds.cursorIdeTrial,
      dataClassification: 'INTERNAL',
      personalDataInvolved: false,
      dataStorageLocation: 'Cursor-managed cloud. Privacy Mode ensures no persistent code storage.',
      thirdPartyDataSharing: true,
      thirdPartyDataDetails: 'Code context sent to AI models for completion. Privacy Mode prevents storage. Uses Anthropic Claude and OpenAI models.',
      likelihoodOfBreach: 'LOW',
      impactOfBreach: 'MINOR',
      overallRiskScore: 2,
      hasEncryptionAtRest: true,
      hasEncryptionInTransit: true,
      hasMfa: true,
      hasAuditLogging: false,
      hasAuditLoggingUnknown: true,
      hasPenTestReport: false,
      hasPenTestReportUnknown: true,
      hasDisasterRecovery: true,
      hasSla: false,
      hasSlaUnknown: true,
      complianceCertifications: ['SOC 2 Type II (in progress)'],
      residualRiskNotes: 'SOC 2 certification still in progress. Mitigated by Privacy Mode and limited trial scope.',
    },
  })

  await prisma.signOffCustomSection.create({
    data: {
      signOffId: soIds.cursorIdeTrial,
      title: 'Comparison with GitHub Copilot',
      content:
        'This trial will run in parallel with our existing GitHub Copilot licences. Key differentiators to evaluate:\n- Codebase-aware context (Cursor indexes the full repo)\n- Multi-file editing capabilities\n- Inline terminal command generation\n- Cost: Cursor £40/user/month vs Copilot £19/user/month',
      sortOrder: 0,
    },
  })

  await prisma.signOffSupportingDoc.create({
    data: {
      signOffId: soIds.cursorIdeTrial,
      title: 'Cursor Security & Privacy Documentation',
      url: 'https://cursor.com/privacy',
      addedById: userIds.oliverBennett,
    },
  })

  await prisma.signOffStatusChange.createMany({
    data: [
      { signOffId: soIds.cursorIdeTrial, fromStatus: null, toStatus: 'DRAFT', changedById: userIds.oliverBennett, createdAt: daysAgo(5) },
      { signOffId: soIds.cursorIdeTrial, fromStatus: 'DRAFT', toStatus: 'SUBMITTED', changedById: userIds.oliverBennett, createdAt: daysAgo(2) },
    ],
  })

  console.log('Seed completed successfully.')
  process.exit(0)
}

main().catch((e) => {
  console.error('Seed failed:', e)
  process.exit(1)
})
