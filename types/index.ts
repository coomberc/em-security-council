// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const SIGN_OFF_STATUSES = [
  'DRAFT', 'SUBMITTED', 'HAS_COMMENTS',
  'APPROVED', 'REJECTED', 'WITHDRAWN',
] as const
export type SignOffStatus = (typeof SIGN_OFF_STATUSES)[number]

export const SIGN_OFF_CATEGORIES = [
  'NEW_VENDOR_SUPPLIER', 'EXISTING_VENDOR_CHANGE', 'AI_ML_USAGE',
  'DATA_HANDLING_CHANGE', 'INFRASTRUCTURE_CHANGE', 'NEW_PRODUCT_FEATURE',
  'INCIDENT_REMEDIATION', 'OTHER',
] as const
export type SignOffCategory = (typeof SIGN_OFF_CATEGORIES)[number]

export const USER_ROLES = ['APPROVER', 'COUNCIL_MEMBER', 'STAFF_MEMBER'] as const
export type UserRole = (typeof USER_ROLES)[number]

export type ApprovalDecision = 'APPROVED' | 'REJECTED' | 'HAS_COMMENTS'

export const TRIAL_OUTCOMES = ['PENDING', 'ROLLED_OUT', 'CLOSED'] as const
export type TrialOutcome = (typeof TRIAL_OUTCOMES)[number]

export const RISK_LIKELIHOODS = ['VERY_LOW', 'LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH'] as const
export type RiskLikelihood = (typeof RISK_LIKELIHOODS)[number]

export const RISK_IMPACTS = ['NEGLIGIBLE', 'MINOR', 'MODERATE', 'MAJOR', 'SEVERE'] as const
export type RiskImpact = (typeof RISK_IMPACTS)[number]

export const DATA_CLASSIFICATIONS = ['PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED'] as const
export type DataClassification = (typeof DATA_CLASSIFICATIONS)[number]

// ---------------------------------------------------------------------------
// Domain types
// ---------------------------------------------------------------------------

export interface User {
  id: string
  email: string
  name: string
  avatarUrl?: string
  role: UserRole
  isFixedApprover: boolean
  slackId?: string
  departmentId?: string
}

export interface Department {
  id: string
  name: string
  slug: string
  archivedAt?: string
}

export interface SignOffApproverAssignment {
  userId: string
  isFixed: boolean
}

export interface SignOffApproval {
  id: string
  approverId: string
  approver: User
  decision: ApprovalDecision
  comment?: string
  contentVersion: number
  createdAt: string
  revokedAt?: string
}

export interface SignOffComment {
  id: string
  author: User
  content: string
  parentId?: string
  createdAt: string
}

export interface SignOffStatusChange {
  id: string
  fromStatus: SignOffStatus | null
  toStatus: SignOffStatus
  changedBy: User
  reason?: string
  createdAt: string
}

export interface SignOffCustomSection {
  id: string
  title: string
  content: string
  sortOrder: number
}

export interface SignOffSupportingDoc {
  id: string
  title: string
  url: string
  addedBy: Pick<User, 'id' | 'name'>
  createdAt: string
}

export interface RiskAssessment {
  id: string
  dataClassification?: DataClassification
  dataClassificationUnknown: boolean
  personalDataInvolved?: boolean
  personalDataInvolvedUnknown: boolean
  personalDataDetails?: string
  dataStorageLocation?: string
  dataStorageLocationUnknown: boolean
  thirdPartyDataSharing?: boolean
  thirdPartyDataSharingUnknown: boolean
  thirdPartyDataDetails?: string
  likelihoodOfBreach?: RiskLikelihood
  likelihoodOfBreachUnknown: boolean
  impactOfBreach?: RiskImpact
  impactOfBreachUnknown: boolean
  overallRiskScore?: number
  hasEncryptionAtRest?: boolean
  hasEncryptionAtRestUnknown: boolean
  hasEncryptionInTransit?: boolean
  hasEncryptionInTransitUnknown: boolean
  hasMfa?: boolean
  hasMfaUnknown: boolean
  hasAuditLogging?: boolean
  hasAuditLoggingUnknown: boolean
  hasPenTestReport?: boolean
  hasPenTestReportUnknown: boolean
  hasDisasterRecovery?: boolean
  hasDisasterRecoveryUnknown: boolean
  hasSso?: boolean
  hasSsoUnknown: boolean
  hasSla?: boolean
  hasSlaUnknown: boolean
  slaDetails?: string
  complianceCertifications: string[]
  mitigationPlan?: string
  residualRiskNotes?: string
  dataPrivacyNA: boolean
  riskScoringNA: boolean
  controlsNA: boolean
}

export interface SignOffRequest {
  id: string
  sequenceNumber: number
  status: SignOffStatus
  title: string
  categories: SignOffCategory[]
  vendorName?: string
  vendorWebsite?: string
  description: string
  dueDiligence: string
  rollOutPlan: string
  cost: string
  isTrial: boolean
  trialDuration?: string
  trialDataAccessScope?: string
  trialSuccessCriteria?: string
  trialGoLiveRolloutPlan?: string
  trialEndDate?: string
  trialOutcome?: TrialOutcome
  trialClosureReason?: string
  trialClosedAt?: string
  parentSignOffId?: string
  contentVersion: number
  submittedBy: User
  department: Department
  createdAt: string
  updatedAt: string
  customSections: SignOffCustomSection[]
  supportingDocs: SignOffSupportingDoc[]
  approvers: SignOffApproverAssignment[]
  approvals: SignOffApproval[]
  comments: SignOffComment[]
  statusHistory: SignOffStatusChange[]
  riskAssessment?: RiskAssessment
  childSignOffIds: string[]
}

// ---------------------------------------------------------------------------
// Slim types for the sign-off list grid
// ---------------------------------------------------------------------------

export interface SignOffSummaryApproval {
  id: string
  approverId: string
  decision: ApprovalDecision
  contentVersion: number
  revokedAt?: string
}

export interface SignOffSummary {
  id: string
  sequenceNumber: number
  status: SignOffStatus
  title: string
  categories: SignOffCategory[]
  vendorName?: string
  isTrial: boolean
  trialEndDate?: string
  trialOutcome?: TrialOutcome
  parentSignOffId?: string
  submittedBy: Pick<User, 'id' | 'name'>
  department: Department
  createdAt: string
  updatedAt: string
  approvers: SignOffApproverAssignment[]
  approvals: SignOffSummaryApproval[]
  riskScore?: number
}

// ---------------------------------------------------------------------------
// Form types
// ---------------------------------------------------------------------------

export interface CreateSignOffInput {
  title: string
  departmentId: string
  categories: SignOffCategory[]
  vendorName?: string
  vendorWebsite?: string
  description: string
  dueDiligence: string
  rollOutPlan: string
  cost: string
  isTrial: boolean
  trialDuration?: string
  trialDataAccessScope?: string
  trialSuccessCriteria?: string
  trialGoLiveRolloutPlan?: string
  trialEndDate?: string
  customSections: { title: string; content: string; sortOrder: number }[]
  supportingDocs: { title: string; url: string }[]
  riskAssessment?: CreateRiskAssessmentInput
}

export interface UpdateSignOffInput {
  title?: string
  departmentId?: string
  categories?: SignOffCategory[]
  vendorName?: string | null
  vendorWebsite?: string | null
  description?: string
  dueDiligence?: string
  rollOutPlan?: string
  cost?: string
  isTrial?: boolean
  trialDuration?: string | null
  trialDataAccessScope?: string | null
  trialSuccessCriteria?: string | null
  trialGoLiveRolloutPlan?: string | null
  trialEndDate?: string | null
  customSections?: { title: string; content: string; sortOrder: number }[]
  supportingDocs?: { title: string; url: string }[]
  riskAssessment?: CreateRiskAssessmentInput | null
}

export interface CreateRiskAssessmentInput {
  dataClassification?: DataClassification
  dataClassificationUnknown?: boolean
  personalDataInvolved?: boolean
  personalDataInvolvedUnknown?: boolean
  personalDataDetails?: string
  dataStorageLocation?: string
  dataStorageLocationUnknown?: boolean
  thirdPartyDataSharing?: boolean
  thirdPartyDataSharingUnknown?: boolean
  thirdPartyDataDetails?: string
  likelihoodOfBreach?: RiskLikelihood
  likelihoodOfBreachUnknown?: boolean
  impactOfBreach?: RiskImpact
  impactOfBreachUnknown?: boolean
  hasEncryptionAtRest?: boolean
  hasEncryptionAtRestUnknown?: boolean
  hasEncryptionInTransit?: boolean
  hasEncryptionInTransitUnknown?: boolean
  hasMfa?: boolean
  hasMfaUnknown?: boolean
  hasAuditLogging?: boolean
  hasAuditLoggingUnknown?: boolean
  hasPenTestReport?: boolean
  hasPenTestReportUnknown?: boolean
  hasDisasterRecovery?: boolean
  hasDisasterRecoveryUnknown?: boolean
  hasSso?: boolean
  hasSsoUnknown?: boolean
  hasSla?: boolean
  hasSlaUnknown?: boolean
  slaDetails?: string
  complianceCertifications?: string[]
  mitigationPlan?: string
  residualRiskNotes?: string
  dataPrivacyNA?: boolean
  riskScoringNA?: boolean
  controlsNA?: boolean
}

// ---------------------------------------------------------------------------
// State machine types
// ---------------------------------------------------------------------------

export const SIGN_OFF_ACTIONS = [
  'submit', 'approve', 'comment', 'reject', 'withdraw', 'resubmit', 'reopen',
] as const
export type SignOffAction = (typeof SIGN_OFF_ACTIONS)[number]

export interface TransitionResult {
  allowed: boolean
  reason?: string
}
