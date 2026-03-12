import type { SignOffCategory } from '@/types'

/** Categories that require a risk assessment at submit time */
export const RISK_ASSESSMENT_REQUIRED_CATEGORIES: SignOffCategory[] = [
  'NEW_SUPPLIER_SOFTWARE',
  'THIRD_PARTY_TOOL',
  'DATA_SECURITY_IMPACT',
  'AI_FUNCTIONALITY',
]

/** Categories where risk assessment is recommended (prompted but optional) */
export const RISK_ASSESSMENT_RECOMMENDED_CATEGORIES: SignOffCategory[] = [
  'SCOPE_CHANGE',
  'TECHNICAL_INTEGRATION',
]

/** Categories where risk assessment is optional (available but not prompted) */
export const RISK_ASSESSMENT_OPTIONAL_CATEGORIES: SignOffCategory[] = [
  'NEW_PRODUCT_PLATFORM',
  'SIGNIFICANT_CHANGE',
  'OTHER',
]

export const CATEGORY_LABELS: Record<SignOffCategory, string> = {
  NEW_SUPPLIER_SOFTWARE: 'New Supplier Software',
  THIRD_PARTY_TOOL: 'Third-Party Tool',
  SCOPE_CHANGE: 'Scope Change',
  NEW_PRODUCT_PLATFORM: 'New Product Platform',
  SIGNIFICANT_CHANGE: 'Significant Change',
  TECHNICAL_INTEGRATION: 'Technical Integration',
  AI_FUNCTIONALITY: 'AI Functionality',
  DATA_SECURITY_IMPACT: 'Data Security Impact',
  OTHER: 'Other',
}

export const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
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
): 'required' | 'recommended' | 'optional' {
  if (categories.some((c) => RISK_ASSESSMENT_REQUIRED_CATEGORIES.includes(c))) {
    return 'required'
  }
  if (categories.some((c) => RISK_ASSESSMENT_RECOMMENDED_CATEGORIES.includes(c))) {
    return 'recommended'
  }
  return 'optional'
}
