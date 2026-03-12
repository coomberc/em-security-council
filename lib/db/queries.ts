import { getPrisma } from '@/lib/db'
import { computeRiskScore } from '@/lib/constants'
import type {
  User,
  Department,
  SignOffRequest,
  SignOffSummary,
  SignOffSummaryApproval,
  SignOffApproval,
  SignOffComment,
  SignOffStatusChange,
  SignOffCustomSection,
  SignOffSupportingDoc,
  SignOffApproverAssignment,
  RiskAssessment,
} from '@/types'
import type {
  User as PrismaUser,
  Department as PrismaDepartment,
  SignOff as PrismaSignOff,
  SignOffApproval as PrismaApproval,
  SignOffComment as PrismaComment,
  SignOffStatusChange as PrismaStatusChange,
  SignOffCustomSection as PrismaCustomSection,
  SignOffSupportingDoc as PrismaSupportingDoc,
  SignOffApprover as PrismaApprover,
  RiskAssessment as PrismaRiskAssessment,
} from '@/lib/generated/prisma/client'

// ---------------------------------------------------------------------------
// Mapper: Prisma User → frontend User
// ---------------------------------------------------------------------------

export function mapUser(u: PrismaUser): User {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    avatarUrl: u.avatarUrl ?? undefined,
    role: u.role,
    isFixedApprover: u.isFixedApprover,
    slackId: u.slackId ?? undefined,
    departmentId: u.departmentId ?? undefined,
  }
}

// ---------------------------------------------------------------------------
// Mapper: Prisma Department → frontend Department
// ---------------------------------------------------------------------------

export function mapDepartment(d: PrismaDepartment): Department {
  return {
    id: d.id,
    name: d.name,
    slug: d.slug,
    archivedAt: d.archivedAt?.toISOString(),
  }
}

// ---------------------------------------------------------------------------
// Mapper: Risk Assessment
// ---------------------------------------------------------------------------

function mapRiskAssessment(r: PrismaRiskAssessment): RiskAssessment {
  return {
    id: r.id,
    dataClassification: r.dataClassification ?? undefined,
    dataClassificationUnknown: r.dataClassificationUnknown,
    personalDataInvolved: r.personalDataInvolved ?? undefined,
    personalDataInvolvedUnknown: r.personalDataInvolvedUnknown,
    personalDataDetails: r.personalDataDetails ?? undefined,
    dataStorageLocation: r.dataStorageLocation ?? undefined,
    dataStorageLocationUnknown: r.dataStorageLocationUnknown,
    thirdPartyDataSharing: r.thirdPartyDataSharing ?? undefined,
    thirdPartyDataSharingUnknown: r.thirdPartyDataSharingUnknown,
    thirdPartyDataDetails: r.thirdPartyDataDetails ?? undefined,
    likelihoodOfBreach: r.likelihoodOfBreach ?? undefined,
    likelihoodOfBreachUnknown: r.likelihoodOfBreachUnknown,
    impactOfBreach: r.impactOfBreach ?? undefined,
    impactOfBreachUnknown: r.impactOfBreachUnknown,
    overallRiskScore: r.overallRiskScore ?? undefined,
    hasEncryptionAtRest: r.hasEncryptionAtRest ?? undefined,
    hasEncryptionAtRestUnknown: r.hasEncryptionAtRestUnknown,
    hasEncryptionInTransit: r.hasEncryptionInTransit ?? undefined,
    hasEncryptionInTransitUnknown: r.hasEncryptionInTransitUnknown,
    hasMfa: r.hasMfa ?? undefined,
    hasMfaUnknown: r.hasMfaUnknown,
    hasAuditLogging: r.hasAuditLogging ?? undefined,
    hasAuditLoggingUnknown: r.hasAuditLoggingUnknown,
    hasPenTestReport: r.hasPenTestReport ?? undefined,
    hasPenTestReportUnknown: r.hasPenTestReportUnknown,
    hasDisasterRecovery: r.hasDisasterRecovery ?? undefined,
    hasDisasterRecoveryUnknown: r.hasDisasterRecoveryUnknown,
    hasSso: r.hasSso ?? undefined,
    hasSsoUnknown: r.hasSsoUnknown,
    hasSla: r.hasSla ?? undefined,
    hasSlaUnknown: r.hasSlaUnknown,
    slaDetails: r.slaDetails ?? undefined,
    complianceCertifications: r.complianceCertifications,
    mitigationPlan: r.mitigationPlan ?? undefined,
    residualRiskNotes: r.residualRiskNotes ?? undefined,
  }
}

// ---------------------------------------------------------------------------
// Mapper: SignOff (full)
// ---------------------------------------------------------------------------

type PrismaSignOffWithIncludes = PrismaSignOff & {
  submittedBy: PrismaUser
  department: PrismaDepartment
  approvers: (PrismaApprover & { user: PrismaUser })[]
  approvals: (PrismaApproval & { approver: PrismaUser })[]
  comments: (PrismaComment & { author: PrismaUser })[]
  statusHistory: (PrismaStatusChange & { changedBy: PrismaUser })[]
  customSections: PrismaCustomSection[]
  supportingDocs: (PrismaSupportingDoc & { addedBy: PrismaUser })[]
  riskAssessment: PrismaRiskAssessment | null
}

function mapSignOff(r: PrismaSignOffWithIncludes): SignOffRequest {
  return {
    id: r.id,
    sequenceNumber: r.sequenceNumber,
    status: r.status,
    title: r.title,
    categories: r.categories,
    vendorName: r.vendorName ?? undefined,
    vendorWebsite: r.vendorWebsite ?? undefined,
    description: r.description,
    dueDiligence: r.dueDiligence,
    rollOutPlan: r.rollOutPlan,
    cost: r.cost,
    isTrial: r.isTrial,
    trialDuration: r.trialDuration ?? undefined,
    trialDataAccessScope: r.trialDataAccessScope ?? undefined,
    trialSuccessCriteria: r.trialSuccessCriteria ?? undefined,
    trialGoLiveRolloutPlan: r.trialGoLiveRolloutPlan ?? undefined,
    trialEndDate: r.trialEndDate?.toISOString(),
    parentSignOffId: r.parentSignOffId ?? undefined,
    contentVersion: r.contentVersion,
    submittedBy: mapUser(r.submittedBy),
    department: mapDepartment(r.department),
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    customSections: r.customSections.map(mapCustomSection),
    supportingDocs: r.supportingDocs.map(mapSupportingDoc),
    approvers: r.approvers.map(mapApproverAssignment),
    approvals: r.approvals.map(mapApproval),
    comments: r.comments.map(mapComment),
    statusHistory: r.statusHistory.map(mapStatusChange),
    riskAssessment: r.riskAssessment ? mapRiskAssessment(r.riskAssessment) : undefined,
  }
}

function mapApproval(
  a: PrismaApproval & { approver: PrismaUser },
): SignOffApproval {
  return {
    id: a.id,
    approverId: a.approverId,
    approver: mapUser(a.approver),
    decision: a.decision,
    comment: a.comment ?? undefined,
    contentVersion: a.contentVersion,
    createdAt: a.createdAt.toISOString(),
    revokedAt: a.revokedAt?.toISOString(),
  }
}

function mapComment(
  c: PrismaComment & { author: PrismaUser },
): SignOffComment {
  return {
    id: c.id,
    author: mapUser(c.author),
    content: c.content,
    parentId: c.parentId ?? undefined,
    createdAt: c.createdAt.toISOString(),
  }
}

function mapStatusChange(
  s: PrismaStatusChange & { changedBy: PrismaUser },
): SignOffStatusChange {
  return {
    id: s.id,
    fromStatus: s.fromStatus,
    toStatus: s.toStatus,
    changedBy: mapUser(s.changedBy),
    reason: s.reason ?? undefined,
    createdAt: s.createdAt.toISOString(),
  }
}

function mapCustomSection(s: PrismaCustomSection): SignOffCustomSection {
  return {
    id: s.id,
    title: s.title,
    content: s.content,
    sortOrder: s.sortOrder,
  }
}

function mapSupportingDoc(
  d: PrismaSupportingDoc & { addedBy: PrismaUser },
): SignOffSupportingDoc {
  return {
    id: d.id,
    title: d.title,
    url: d.url,
    addedBy: { id: d.addedBy.id, name: d.addedBy.name },
    createdAt: d.createdAt.toISOString(),
  }
}

function mapApproverAssignment(
  a: PrismaApprover & { user: PrismaUser },
): SignOffApproverAssignment {
  return {
    userId: a.userId,
    isFixed: a.isFixed,
  }
}

// ---------------------------------------------------------------------------
// Shared includes for SignOff queries
// ---------------------------------------------------------------------------

const signOffIncludes = {
  submittedBy: true,
  department: true,
  approvers: {
    include: { user: true },
  },
  approvals: {
    include: { approver: true },
    orderBy: { createdAt: 'asc' as const },
  },
  comments: {
    include: { author: true },
    orderBy: { createdAt: 'asc' as const },
  },
  statusHistory: {
    include: { changedBy: true },
    orderBy: { createdAt: 'asc' as const },
  },
  customSections: {
    orderBy: { sortOrder: 'asc' as const },
  },
  supportingDocs: {
    include: { addedBy: true },
    orderBy: { createdAt: 'asc' as const },
  },
  riskAssessment: true,
}

// ---------------------------------------------------------------------------
// Lean includes for summary list
// ---------------------------------------------------------------------------

const signOffSummaryIncludes = {
  submittedBy: true,
  department: true,
  approvers: true,
  approvals: {
    select: {
      id: true,
      approverId: true,
      decision: true,
      contentVersion: true,
      revokedAt: true,
    },
    orderBy: { createdAt: 'asc' as const },
  },
  riskAssessment: {
    select: {
      overallRiskScore: true,
      likelihoodOfBreach: true,
      impactOfBreach: true,
    },
  },
}

type PrismaSignOffSummaryRow = PrismaSignOff & {
  submittedBy: PrismaUser
  department: PrismaDepartment
  approvers: PrismaApprover[]
  approvals: { id: string; approverId: string; decision: string; contentVersion: number; revokedAt: Date | null }[]
  riskAssessment: { overallRiskScore: number | null; likelihoodOfBreach: string | null; impactOfBreach: string | null } | null
}

function mapSignOffSummary(r: PrismaSignOffSummaryRow): SignOffSummary {
  const riskScore = r.riskAssessment?.overallRiskScore ??
    computeRiskScore(r.riskAssessment?.likelihoodOfBreach, r.riskAssessment?.impactOfBreach)

  return {
    id: r.id,
    sequenceNumber: r.sequenceNumber,
    status: r.status,
    title: r.title,
    categories: r.categories,
    vendorName: r.vendorName ?? undefined,
    isTrial: r.isTrial,
    trialEndDate: r.trialEndDate?.toISOString(),
    submittedBy: { id: r.submittedBy.id, name: r.submittedBy.name },
    department: mapDepartment(r.department),
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    approvers: r.approvers.map((a) => ({ userId: a.userId, isFixed: a.isFixed })),
    approvals: r.approvals.map((a): SignOffSummaryApproval => ({
      id: a.id,
      approverId: a.approverId,
      decision: a.decision as SignOffSummaryApproval['decision'],
      contentVersion: a.contentVersion,
      revokedAt: a.revokedAt?.toISOString(),
    })),
    riskScore: riskScore ?? undefined,
  }
}

// ---------------------------------------------------------------------------
// Public query functions
// ---------------------------------------------------------------------------

export async function getUsers(): Promise<User[]> {
  const prisma = await getPrisma()
  const users = await prisma.user.findMany({
    orderBy: { name: 'asc' },
  })
  return users.map(mapUser)
}

export async function getUserById(id: string): Promise<User | null> {
  const prisma = await getPrisma()
  const user = await prisma.user.findUnique({ where: { id } })
  return user ? mapUser(user) : null
}

export async function getDepartments(): Promise<Department[]> {
  const prisma = await getPrisma()
  const departments = await prisma.department.findMany({ orderBy: { name: 'asc' } })
  return departments.map(mapDepartment)
}

export async function getActiveDepartments(): Promise<Department[]> {
  const prisma = await getPrisma()
  const departments = await prisma.department.findMany({
    where: { archivedAt: null },
    orderBy: { name: 'asc' },
  })
  return departments.map(mapDepartment)
}

export async function getSignOffSummaries(): Promise<SignOffSummary[]> {
  const prisma = await getPrisma()
  const signOffs = await prisma.signOff.findMany({
    include: signOffSummaryIncludes,
    orderBy: { createdAt: 'desc' },
  })
  return (signOffs as PrismaSignOffSummaryRow[]).map(mapSignOffSummary)
}

export async function getSignOffById(id: string): Promise<SignOffRequest | null> {
  const prisma = await getPrisma()
  const signOff = await prisma.signOff.findUnique({
    where: { id },
    include: signOffIncludes,
  })
  return signOff ? mapSignOff(signOff as PrismaSignOffWithIncludes) : null
}

export async function getSignOffBySequenceNumber(seq: number): Promise<SignOffRequest | null> {
  const prisma = await getPrisma()
  const signOff = await prisma.signOff.findUnique({
    where: { sequenceNumber: seq },
    include: signOffIncludes,
  })
  return signOff ? mapSignOff(signOff as PrismaSignOffWithIncludes) : null
}

export async function getFixedApprovers(): Promise<User[]> {
  const prisma = await getPrisma()
  const users = await prisma.user.findMany({
    where: { isFixedApprover: true },
    orderBy: { name: 'asc' },
  })
  return users.map(mapUser)
}
