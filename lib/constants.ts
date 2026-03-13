import type { SignOffCategory } from '@/types'

/** Categories that require a risk assessment at submit time */
export const RISK_ASSESSMENT_REQUIRED_CATEGORIES: SignOffCategory[] = [
  'NEW_VENDOR_SUPPLIER',
  'AI_ML_USAGE',
  'DATA_HANDLING_CHANGE',
]

/** Categories where risk assessment is optional (available but not prompted) */
export const RISK_ASSESSMENT_OPTIONAL_CATEGORIES: SignOffCategory[] = [
  'EXISTING_VENDOR_CHANGE',
  'INFRASTRUCTURE_CHANGE',
  'NEW_PRODUCT_FEATURE',
  'INCIDENT_REMEDIATION',
  'OTHER',
]

export const CATEGORY_LABELS: Record<SignOffCategory, string> = {
  NEW_VENDOR_SUPPLIER: 'New Vendor/Supplier',
  EXISTING_VENDOR_CHANGE: 'Existing Vendor Change',
  AI_ML_USAGE: 'AI/ML Usage',
  DATA_HANDLING_CHANGE: 'Data Handling Change',
  INFRASTRUCTURE_CHANGE: 'Infrastructure/Architecture Change',
  NEW_PRODUCT_FEATURE: 'New Product/Feature',
  INCIDENT_REMEDIATION: 'Incident Response/Remediation',
  OTHER: 'Other',
}

export const CATEGORY_DESCRIPTIONS: Record<SignOffCategory, string> = {
  NEW_VENDOR_SUPPLIER: 'Bringing in a new SaaS tool, service provider, or software vendor',
  EXISTING_VENDOR_CHANGE: 'Scope change, new data access, or tier upgrade for an existing vendor',
  AI_ML_USAGE: 'Any use of AI features, LLMs, or automated decision-making — in-house or third-party',
  DATA_HANDLING_CHANGE: 'New data flows, changes to where or how data is stored, or new data sharing arrangements',
  INFRASTRUCTURE_CHANGE: 'New cloud services, network changes, or significant technical architecture changes',
  NEW_PRODUCT_FEATURE: 'Launching something new with security implications — customer-facing or internal',
  INCIDENT_REMEDIATION: 'Post-incident changes that need security sign-off',
  OTHER: 'Anything that doesn\'t fit the above categories',
}

export const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Awaiting Review',
  HAS_COMMENTS: 'Has Comments',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  WITHDRAWN: 'Withdrawn',
}

export const RISK_LIKELIHOOD_LABELS: Record<string, string> = {
  VERY_LOW: 'Very Low',
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  VERY_HIGH: 'Very High',
}

export const RISK_IMPACT_LABELS: Record<string, string> = {
  NEGLIGIBLE: 'Negligible',
  MINOR: 'Minor',
  MODERATE: 'Moderate',
  MAJOR: 'Major',
  SEVERE: 'Severe',
}

export const DATA_CLASSIFICATION_LABELS: Record<string, string> = {
  PUBLIC: 'Public',
  INTERNAL: 'Internal',
  CONFIDENTIAL: 'Confidential',
  RESTRICTED: 'Restricted',
}

/** Likelihood x Impact risk score matrix (1–25) */
const LIKELIHOOD_VALUES: Record<string, number> = {
  VERY_LOW: 1,
  LOW: 2,
  MEDIUM: 3,
  HIGH: 4,
  VERY_HIGH: 5,
}

const IMPACT_VALUES: Record<string, number> = {
  NEGLIGIBLE: 1,
  MINOR: 2,
  MODERATE: 3,
  MAJOR: 4,
  SEVERE: 5,
}

export function computeRiskScore(
  likelihood: string | null | undefined,
  impact: string | null | undefined,
): number | null {
  if (!likelihood || !impact) return null
  const l = LIKELIHOOD_VALUES[likelihood]
  const i = IMPACT_VALUES[impact]
  if (l === undefined || i === undefined) return null
  return l * i
}

export function getRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
  if (score <= 4) return 'low'
  if (score <= 9) return 'medium'
  if (score <= 16) return 'high'
  return 'critical'
}

export function getRiskAssessmentRequirement(
  categories: SignOffCategory[],
): 'required' | 'optional' {
  if (categories.some((c) => RISK_ASSESSMENT_REQUIRED_CATEGORIES.includes(c))) {
    return 'required'
  }
  return 'optional'
}
