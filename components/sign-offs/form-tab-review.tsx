'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { MarkdownContent } from '@/components/shared/markdown-content'
import { RiskBadge } from '@/components/shared/risk-badge'
import { useDepartments } from '@/providers/departments-provider'
import {
  CATEGORY_LABELS,
  DATA_CLASSIFICATION_LABELS,
  RISK_LIKELIHOOD_LABELS,
  RISK_IMPACT_LABELS,
  computeRiskScore,
  getRiskAssessmentRequirement,
} from '@/lib/constants'
import type { SignOffCategory } from '@/types'
import type { BasicsFormData } from './form-tab-basics'
import type { DetailsFormData } from './form-tab-details'
import type { RiskFormData } from './form-tab-risk'
import { AlertTriangle, CheckCircle2, XCircle, Loader2 } from 'lucide-react'

interface FormTabReviewProps {
  basics: BasicsFormData
  details: DetailsFormData
  risk: RiskFormData
  isSubmitting: boolean
  onSubmit: () => void
}

interface ValidationIssue {
  type: 'error' | 'warning'
  message: string
  tab: string
}

function validate(
  basics: BasicsFormData,
  details: DetailsFormData,
  risk: RiskFormData,
): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  // Required fields
  if (!basics.title.trim()) {
    issues.push({ type: 'error', message: 'Title is required', tab: 'Basics' })
  }
  if (!basics.departmentId) {
    issues.push({ type: 'error', message: 'Department is required', tab: 'Basics' })
  }
  if (basics.categories.length === 0) {
    issues.push({ type: 'error', message: 'At least one category is required', tab: 'Basics' })
  }

  // Risk assessment validation
  const riskRequirement = getRiskAssessmentRequirement(basics.categories)
  if (riskRequirement === 'required') {
    const hasLikelihood = risk.likelihoodOfBreach || risk.likelihoodOfBreachUnknown
    const hasImpact = risk.impactOfBreach || risk.impactOfBreachUnknown
    const hasClassification = risk.dataClassification || risk.dataClassificationUnknown

    if (!hasClassification) {
      issues.push({
        type: 'error',
        message: 'Data classification is required (or mark as unknown)',
        tab: 'Risk Assessment',
      })
    }
    if (!hasLikelihood) {
      issues.push({
        type: 'error',
        message: 'Likelihood of breach is required (or mark as unknown)',
        tab: 'Risk Assessment',
      })
    }
    if (!hasImpact) {
      issues.push({
        type: 'error',
        message: 'Impact of breach is required (or mark as unknown)',
        tab: 'Risk Assessment',
      })
    }
  }

  // Recommended fields (warnings)
  if (!details.description.trim()) {
    issues.push({ type: 'warning', message: 'Description is empty', tab: 'Details' })
  }
  if (!details.dueDiligence.trim()) {
    issues.push({ type: 'warning', message: 'Due diligence is empty', tab: 'Details' })
  }
  if (!details.rollOutPlan.trim()) {
    issues.push({ type: 'warning', message: 'Roll out plan is empty', tab: 'Details' })
  }
  if (!details.cost.trim()) {
    issues.push({ type: 'warning', message: 'Cost information is empty', tab: 'Details' })
  }

  // Trial-specific warnings
  if (basics.isTrial) {
    if (!details.trialDuration.trim()) {
      issues.push({ type: 'warning', message: 'Trial duration is empty', tab: 'Details' })
    }
    if (!details.trialEndDate) {
      issues.push({ type: 'warning', message: 'Trial end date is not set', tab: 'Details' })
    }
    if (!details.trialSuccessCriteria.trim()) {
      issues.push({ type: 'warning', message: 'Trial success criteria is empty', tab: 'Details' })
    }
  }

  return issues
}

export function FormTabReview({
  basics,
  details,
  risk,
  isSubmitting,
  onSubmit,
}: FormTabReviewProps) {
  const departments = useDepartments()
  const issues = validate(basics, details, risk)
  const errors = issues.filter((i) => i.type === 'error')
  const warnings = issues.filter((i) => i.type === 'warning')
  const canSubmit = errors.length === 0

  const department = departments.find((d) => d.id === basics.departmentId)
  const riskScore = computeRiskScore(
    risk.likelihoodOfBreach || null,
    risk.impactOfBreach || null,
  )

  return (
    <div className="space-y-6">
      {/* Validation summary */}
      {errors.length > 0 && (
        <div className="rounded-md border border-[#fca5a5] bg-[#fef2f2] p-4 dark:border-[#7f1d1d] dark:bg-[#450a0a]">
          <div className="flex items-center gap-2 text-[#b91c1c] dark:text-[#fca5a5]">
            <XCircle className="h-4 w-4 shrink-0" />
            <span className="text-sm font-medium">
              {errors.length} required {errors.length === 1 ? 'field' : 'fields'} missing
            </span>
          </div>
          <ul className="mt-2 space-y-1">
            {errors.map((e, i) => (
              <li key={i} className="text-xs text-[#b91c1c] dark:text-[#fca5a5]">
                <span className="font-medium">{e.tab}:</span> {e.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="rounded-md border border-[#FFB900] bg-[#fef3c7] p-4 dark:border-[#fbbf24]/30 dark:bg-[#fbbf24]/10">
          <div className="flex items-center gap-2 text-[#92400e] dark:text-[#fcd34d]">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span className="text-sm font-medium">
              {warnings.length} recommended {warnings.length === 1 ? 'field' : 'fields'} empty
            </span>
          </div>
          <ul className="mt-2 space-y-1">
            {warnings.map((w, i) => (
              <li key={i} className="text-xs text-[#92400e] dark:text-[#fcd34d]">
                <span className="font-medium">{w.tab}:</span> {w.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {errors.length === 0 && warnings.length === 0 && (
        <div className="rounded-md border border-[#6ee7b7] bg-[#d1fae5] p-4 dark:border-[#064e3b] dark:bg-[#064e3b]">
          <div className="flex items-center gap-2 text-[#065f46] dark:text-[#6ee7b7]">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span className="text-sm font-medium">All fields look good</span>
          </div>
        </div>
      )}

      {/* Basics summary */}
      <Card className="p-5 space-y-3">
        <h3 className="text-sm font-semibold">Basics</h3>
        <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
          <ReviewField label="Title" value={basics.title || '(empty)'} />
          <ReviewField label="Department" value={department?.name || '(not selected)'} />
        </div>
        <div className="space-y-1">
          <span className="text-xs font-medium text-muted-foreground">Categories</span>
          {basics.categories.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {basics.categories.map((cat) => (
                <Badge key={cat} variant="secondary" className="text-xs">
                  {CATEGORY_LABELS[cat]}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">(none selected)</p>
          )}
        </div>
        {basics.vendorName && (
          <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
            <ReviewField label="Vendor" value={basics.vendorName} />
            {basics.vendorWebsite && (
              <ReviewField label="Vendor Website" value={basics.vendorWebsite} />
            )}
          </div>
        )}
        {basics.isTrial && (
          <Badge
            variant="outline"
            className="border-[#FFB900] bg-[#fef3c7] text-[#92400e] dark:border-[#fbbf24]/30 dark:bg-[#fbbf24]/10 dark:text-[#fcd34d]"
          >
            Trial / Pilot
          </Badge>
        )}
      </Card>

      {/* Details summary */}
      <Card className="p-5 space-y-4">
        <h3 className="text-sm font-semibold">Details</h3>

        {basics.isTrial && (
          <>
            <div className="rounded-md border border-[#FFB900] bg-[#fef3c7]/50 p-3 space-y-2 dark:border-[#fbbf24]/30 dark:bg-[#fbbf24]/10/30">
              <span className="text-xs font-semibold text-[#92400e] dark:text-[#fcd34d]">
                Trial Details
              </span>
              <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                <ReviewField label="Duration" value={details.trialDuration || '(empty)'} />
                <ReviewField label="End Date" value={details.trialEndDate || '(not set)'} />
              </div>
              <ReviewMarkdown label="Data Access Scope" content={details.trialDataAccessScope} />
              <ReviewMarkdown label="Success Criteria" content={details.trialSuccessCriteria} />
              <ReviewMarkdown label="Go-Live Plan" content={details.trialGoLiveRolloutPlan} />
            </div>
            <Separator />
          </>
        )}

        <ReviewMarkdown label="Description" content={details.description} />
        <ReviewMarkdown label="Due Diligence" content={details.dueDiligence} />
        <ReviewMarkdown label="Roll Out Plan" content={details.rollOutPlan} />
        <ReviewMarkdown label="Cost" content={details.cost} />

        {details.supportingDocs.length > 0 && (
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">
              Supporting Documents/Links ({details.supportingDocs.length})
            </span>
            <ul className="space-y-1">
              {details.supportingDocs.map((doc, i) => (
                <li key={i} className="text-sm">
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#2563eb] dark:text-[#60a5fa] hover:underline"
                  >
                    {doc.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {details.customSections.length > 0 && (
          <div className="space-y-2">
            <span className="text-xs font-medium text-muted-foreground">
              Custom Sections ({details.customSections.length})
            </span>
            {details.customSections.map((section, i) => (
              <ReviewMarkdown key={i} label={section.title} content={section.content} />
            ))}
          </div>
        )}
      </Card>

      {/* Risk assessment summary */}
      <Card className="p-5 space-y-3">
        <h3 className="text-sm font-semibold">Risk Assessment</h3>

        <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
          <ReviewField
            label="Data Classification"
            value={
              risk.dataClassificationUnknown
                ? 'Unknown'
                : risk.dataClassification
                  ? DATA_CLASSIFICATION_LABELS[risk.dataClassification]
                  : '(not set)'
            }
          />
          <ReviewField
            label="Personal Data"
            value={
              risk.personalDataInvolvedUnknown
                ? 'Unknown'
                : risk.personalDataInvolved ? 'Yes' : 'No'
            }
          />
          <ReviewField
            label="Data Storage"
            value={
              risk.dataStorageLocationUnknown
                ? 'Unknown'
                : risk.dataStorageLocation || '(not set)'
            }
          />
          <ReviewField
            label="Third-Party Sharing"
            value={
              risk.thirdPartyDataSharingUnknown
                ? 'Unknown'
                : risk.thirdPartyDataSharing ? 'Yes' : 'No'
            }
          />
          <ReviewField
            label="Likelihood"
            value={
              risk.likelihoodOfBreachUnknown
                ? 'Unknown'
                : risk.likelihoodOfBreach
                  ? RISK_LIKELIHOOD_LABELS[risk.likelihoodOfBreach]
                  : '(not set)'
            }
          />
          <ReviewField
            label="Impact"
            value={
              risk.impactOfBreachUnknown
                ? 'Unknown'
                : risk.impactOfBreach
                  ? RISK_IMPACT_LABELS[risk.impactOfBreach]
                  : '(not set)'
            }
          />
        </div>

        {riskScore !== null && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Risk Score:</span>
            <RiskBadge score={riskScore} />
          </div>
        )}

        {risk.complianceCertifications.length > 0 && (
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">
              Compliance Certifications
            </span>
            <div className="flex flex-wrap gap-1.5">
              {risk.complianceCertifications.map((cert, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {cert}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {risk.mitigationPlan && (
          <ReviewMarkdown label="Mitigation Plan" content={risk.mitigationPlan} />
        )}
        {risk.residualRiskNotes && (
          <ReviewMarkdown label="Residual Risk Notes" content={risk.residualRiskNotes} />
        )}
      </Card>

      {/* Submit */}
      <div className="flex justify-end pt-2">
        <Button
          onClick={onSubmit}
          disabled={!canSubmit || isSubmitting}
          size="lg"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit for Approval'
          )}
        </Button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ReviewField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <p className="text-sm">{value}</p>
    </div>
  )
}

function ReviewMarkdown({ label, content }: { label: string; content: string }) {
  return (
    <div className="space-y-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {content.trim() ? (
        <MarkdownContent content={content} className="text-sm" />
      ) : (
        <p className="text-sm text-muted-foreground italic">(empty)</p>
      )}
    </div>
  )
}
