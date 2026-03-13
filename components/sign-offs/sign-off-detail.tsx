'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState } from 'react'
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  ExternalLink,
  FileText,
  FlaskConical,
  Globe,
  Info,
  Pencil,
  Plus,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { StatusBadge } from '@/components/shared/status-badge'
import { TrialBadge } from '@/components/shared/trial-badge'
import { CategoryBadge } from '@/components/shared/category-badge'
import { RiskBadge } from '@/components/shared/risk-badge'
import { MarkdownContent } from '@/components/shared/markdown-content'
import { SignOffSidebar } from '@/components/sign-offs/sign-off-sidebar'
import { SignOffTimeline } from '@/components/sign-offs/sign-off-timeline'
import { SignOffComments } from '@/components/sign-offs/sign-off-comments'
import { useCurrentUser } from '@/providers/user-provider'
import { createRolloutAction, closeTrialAction, extendTrialAction } from '@/app/actions/sign-offs'
import {
  formatSequenceNumber,
  formatDateTime,
  signOffUrl,
} from '@/lib/format'
import {
  CATEGORY_LABELS,
  DATA_CLASSIFICATION_LABELS,
  RISK_LIKELIHOOD_LABELS,
  RISK_IMPACT_LABELS,
} from '@/lib/constants'
import { toast } from 'sonner'
import { useTransition } from 'react'
import type { SignOffRequest, RiskAssessment, TrialOutcome } from '@/types'

interface SignOffDetailProps {
  signOff: SignOffRequest
}

function RiskAssessmentSummary({ risk }: { risk: RiskAssessment }) {
  const rows: { label: string; value: React.ReactNode; unknown?: boolean }[] = [
    {
      label: 'Data Classification',
      value: risk.dataClassification
        ? DATA_CLASSIFICATION_LABELS[risk.dataClassification] ?? risk.dataClassification
        : null,
      unknown: risk.dataClassificationUnknown,
    },
    {
      label: 'Personal Data Involved',
      value: risk.personalDataInvolved != null ? (risk.personalDataInvolved ? 'Yes' : 'No') : null,
      unknown: risk.personalDataInvolvedUnknown,
    },
    {
      label: 'Data Storage Location',
      value: risk.dataStorageLocation,
      unknown: risk.dataStorageLocationUnknown,
    },
    {
      label: 'Third-Party Data Sharing',
      value: risk.thirdPartyDataSharing != null ? (risk.thirdPartyDataSharing ? 'Yes' : 'No') : null,
      unknown: risk.thirdPartyDataSharingUnknown,
    },
    {
      label: 'Likelihood of Breach',
      value: risk.likelihoodOfBreach
        ? RISK_LIKELIHOOD_LABELS[risk.likelihoodOfBreach] ?? risk.likelihoodOfBreach
        : null,
      unknown: risk.likelihoodOfBreachUnknown,
    },
    {
      label: 'Impact of Breach',
      value: risk.impactOfBreach
        ? RISK_IMPACT_LABELS[risk.impactOfBreach] ?? risk.impactOfBreach
        : null,
      unknown: risk.impactOfBreachUnknown,
    },
  ]

  const booleanRows: { label: string; value: boolean | undefined; unknown?: boolean }[] = [
    { label: 'Encryption at Rest', value: risk.hasEncryptionAtRest, unknown: risk.hasEncryptionAtRestUnknown },
{ label: 'Multi-Factor Auth', value: risk.hasMfa, unknown: risk.hasMfaUnknown },
    { label: 'Audit Logging', value: risk.hasAuditLogging, unknown: risk.hasAuditLoggingUnknown },
    { label: 'Pen Test Report', value: risk.hasPenTestReport, unknown: risk.hasPenTestReportUnknown },
    { label: 'Disaster Recovery', value: risk.hasDisasterRecovery, unknown: risk.hasDisasterRecoveryUnknown },
    { label: 'SSO', value: risk.hasSso, unknown: risk.hasSsoUnknown },
    { label: 'SLA', value: risk.hasSla, unknown: risk.hasSlaUnknown },
  ]

  return (
    <div className="space-y-4">
      {risk.overallRiskScore != null && (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Overall Risk Score:</span>
          <RiskBadge score={risk.overallRiskScore} />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {rows.map(({ label, value, unknown }) => (
          <div key={label} className="text-sm">
            <span className="text-muted-foreground">{label}:</span>{' '}
            {unknown ? (
              <Badge
                variant="outline"
                className="border-[#FFB900] bg-[#fef3c7] text-[#92400e] text-xs dark:border-[#fbbf24]/30 dark:bg-[#fbbf24]/10 dark:text-[#fcd34d]"
              >
                Unknown
              </Badge>
            ) : value ? (
              <span className="font-medium">{value}</span>
            ) : (
              <span className="text-muted-foreground italic">Not provided</span>
            )}
          </div>
        ))}
      </div>

      <Separator />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {booleanRows.map(({ label, value, unknown }) => (
          <div key={label} className="text-sm">
            <span className="text-muted-foreground">{label}:</span>{' '}
            {unknown ? (
              <Badge
                variant="outline"
                className="border-[#FFB900] bg-[#fef3c7] text-[#92400e] text-xs dark:border-[#fbbf24]/30 dark:bg-[#fbbf24]/10 dark:text-[#fcd34d]"
              >
                Unknown
              </Badge>
            ) : value != null ? (
              <span className="font-medium">{value ? 'Yes' : 'No'}</span>
            ) : (
              <span className="text-muted-foreground italic">N/A</span>
            )}
          </div>
        ))}
      </div>

      {risk.complianceCertifications.length > 0 && (
        <>
          <Separator />
          <div>
            <p className="text-sm text-muted-foreground mb-1">Compliance Certifications</p>
            <div className="flex flex-wrap gap-1.5">
              {risk.complianceCertifications.map((cert) => (
                <Badge key={cert} variant="secondary" className="text-xs">
                  {cert}
                </Badge>
              ))}
            </div>
          </div>
        </>
      )}

      {risk.slaDetails && (
        <div>
          <p className="text-sm text-muted-foreground mb-1">SLA Details</p>
          <MarkdownContent content={risk.slaDetails} />
        </div>
      )}

      {risk.personalDataDetails && (
        <div>
          <p className="text-sm text-muted-foreground mb-1">Personal Data Details</p>
          <MarkdownContent content={risk.personalDataDetails} />
        </div>
      )}

      {risk.thirdPartyDataDetails && (
        <div>
          <p className="text-sm text-muted-foreground mb-1">Third-Party Data Details</p>
          <MarkdownContent content={risk.thirdPartyDataDetails} />
        </div>
      )}

      {risk.mitigationPlan && (
        <div>
          <p className="text-sm text-muted-foreground mb-1">Mitigation Plan</p>
          <MarkdownContent content={risk.mitigationPlan} />
        </div>
      )}

      {risk.residualRiskNotes && (
        <div>
          <p className="text-sm text-muted-foreground mb-1">Residual Risk Notes</p>
          <MarkdownContent content={risk.residualRiskNotes} />
        </div>
      )}
    </div>
  )
}

const CLOSURE_REASON_CHIPS = [
  "Didn't meet success criteria",
  'Vendor pulled out',
  'Budget not approved',
  'Security concerns unresolved',
]

export function SignOffDetail({ signOff }: SignOffDetailProps) {
  const { currentUser } = useCurrentUser()
  const router = useRouter()
  const [isCreatingRollout, startRolloutTransition] = useTransition()
  const [isClosingTrial, startCloseTransition] = useTransition()
  const [isExtendingTrial, startExtendTransition] = useTransition()

  const [closeDialogOpen, setCloseDialogOpen] = useState(false)
  const [closeReason, setCloseReason] = useState('')
  const [extendDialogOpen, setExtendDialogOpen] = useState(false)
  const [extendDate, setExtendDate] = useState('')
  const [extendReason, setExtendReason] = useState('')

  const isSubmitter = signOff.submittedBy.id === currentUser.id
  const isAdmin = currentUser.role === 'APPROVER' || currentUser.role === 'COUNCIL_MEMBER'
  const canEdit =
    (signOff.status === 'DRAFT') ||
    (isSubmitter && (signOff.status === 'HAS_COMMENTS' || signOff.status === 'WITHDRAWN'))

  const trialOutcome = signOff.trialOutcome as TrialOutcome | undefined
  const isTrialPending = signOff.isTrial && signOff.status === 'APPROVED' &&
    (!trialOutcome || trialOutcome === 'PENDING')
  const canActOnTrial = isTrialPending && (isSubmitter || isAdmin)

  const showCreateRollout = canActOnTrial
  const showCloseTrial = canActOnTrial
  const showExtendTrial = canActOnTrial

  const isTrialOverdue = isTrialPending && signOff.trialEndDate &&
    new Date(signOff.trialEndDate) < new Date()

  function handleCreateRollout() {
    startRolloutTransition(async () => {
      const result = await createRolloutAction(signOff.id, currentUser.id)
      if (result.success && result.signOff) {
        toast.success('Rollout request created')
        router.push(signOffUrl(result.signOff))
      } else {
        toast.error(result.error ?? 'Failed to create rollout request')
      }
    })
  }

  function handleCloseTrial() {
    if (!closeReason.trim()) return
    startCloseTransition(async () => {
      const result = await closeTrialAction(signOff.id, currentUser.id, closeReason.trim())
      if (result.success) {
        toast.success('Trial closed')
        setCloseDialogOpen(false)
        setCloseReason('')
        router.refresh()
      } else {
        toast.error(result.error ?? 'Failed to close trial')
      }
    })
  }

  function handleExtendTrial() {
    if (!extendDate || !extendReason.trim()) return
    startExtendTransition(async () => {
      const result = await extendTrialAction(signOff.id, currentUser.id, extendDate, extendReason.trim())
      if (result.success) {
        toast.success('Trial extended')
        setExtendDialogOpen(false)
        setExtendDate('')
        setExtendReason('')
        router.refresh()
      } else {
        toast.error(result.error ?? 'Failed to extend trial')
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/sign-offs"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Sign-Offs
      </Link>

      {/* Trial resolution banners */}
      {signOff.isTrial && trialOutcome === 'ROLLED_OUT' && (
        <Card className="border-[#93c5fd] bg-[#eff6ff] dark:border-[#3b82f6]/30 dark:bg-[#3b82f6]/10">
          <CardContent className="flex items-center gap-2 py-3">
            <Info className="h-4 w-4 text-[#2563eb] dark:text-[#60a5fa]" />
            <span className="text-sm">
              Rollout request created
              {signOff.childSignOffIds.length > 0 && (
                <> &mdash; <Link
                  href={`/sign-offs/${signOff.childSignOffIds[0]}`}
                  className="font-medium text-[#6C33DA] hover:underline dark:text-[#c4b5fd]"
                >
                  View rollout
                </Link></>
              )}
            </span>
          </CardContent>
        </Card>
      )}

      {signOff.isTrial && trialOutcome === 'CLOSED' && (
        <Card className="border-[#d1d5db] bg-[#f3f4f6] dark:border-[#4b5563] dark:bg-[#374151]/50">
          <CardContent className="flex items-center gap-2 py-3">
            <X className="h-4 w-4 text-[#6b7280] dark:text-[#9ca3af]" />
            <span className="text-sm text-[#374151] dark:text-[#d1d5db]">
              Trial closed{signOff.trialClosedAt && <> on {formatDateTime(signOff.trialClosedAt)}</>}
              {signOff.trialClosureReason && <> &mdash; {signOff.trialClosureReason}</>}
            </span>
          </CardContent>
        </Card>
      )}

      {isTrialOverdue && (
        <Card className="border-[#fca5a5] bg-[#fef2f2] dark:border-[#ef4444]/30 dark:bg-[#ef4444]/10">
          <CardContent className="flex items-center gap-2 py-3">
            <AlertTriangle className="h-4 w-4 text-[#dc2626] dark:text-[#f87171]" />
            <span className="text-sm text-[#991b1b] dark:text-[#fca5a5]">
              Trial ended on {formatDateTime(signOff.trialEndDate!)} &mdash; please create a rollout request or close this trial
            </span>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm text-muted-foreground">
              {formatSequenceNumber(signOff.sequenceNumber)}
            </span>
            <StatusBadge status={signOff.status} />
            {signOff.isTrial && <TrialBadge />}
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{signOff.title}</h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>by {signOff.submittedBy.name}</span>
            <span>&middot;</span>
            <span>{signOff.department.name}</span>
            <span>&middot;</span>
            <span>{formatDateTime(signOff.createdAt)}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {signOff.categories.map((cat) => (
              <CategoryBadge key={cat} category={cat} />
            ))}
          </div>
          {signOff.vendorName && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Vendor:</span>
              <span className="font-medium">{signOff.vendorName}</span>
              {signOff.vendorWebsite && (
                <a
                  href={signOff.vendorWebsite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[#2563eb] dark:text-[#60a5fa] hover:underline"
                >
                  <Globe className="h-3 w-3" />
                  Website
                </a>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 shrink-0">
          {canEdit && (
            <Button variant="outline" asChild>
              <Link href={`/sign-offs/${signOff.id}/edit`}>
                <Pencil className="h-4 w-4" />
                Edit
              </Link>
            </Button>
          )}
          {showExtendTrial && (
            <Button
              variant="outline"
              onClick={() => setExtendDialogOpen(true)}
            >
              <CalendarDays className="h-4 w-4" />
              Extend Trial
            </Button>
          )}
          {showCloseTrial && (
            <Button
              variant="outline"
              onClick={() => setCloseDialogOpen(true)}
            >
              <X className="h-4 w-4" />
              Close Trial
            </Button>
          )}
          {showCreateRollout && (
            <Button
              onClick={handleCreateRollout}
              disabled={isCreatingRollout}
            >
              <Plus className="h-4 w-4" />
              {isCreatingRollout ? 'Creating...' : 'Create Rollout Request'}
            </Button>
          )}
        </div>
      </div>

      {/* Close Trial Dialog */}
      <Dialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Close Trial</DialogTitle>
            <DialogDescription>
              Provide a reason for closing this trial. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {CLOSURE_REASON_CHIPS.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setCloseReason(chip)}
                  className="rounded-full border px-3 py-1 text-xs hover:bg-muted transition-colors"
                >
                  {chip}
                </button>
              ))}
            </div>
            <div className="space-y-2">
              <Label htmlFor="close-reason">Reason</Label>
              <Textarea
                id="close-reason"
                value={closeReason}
                onChange={(e) => setCloseReason(e.target.value)}
                placeholder="Why is this trial being closed?"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCloseDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCloseTrial}
              disabled={!closeReason.trim() || isClosingTrial}
            >
              {isClosingTrial ? 'Closing...' : 'Close Trial'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Extend Trial Dialog */}
      <Dialog open={extendDialogOpen} onOpenChange={setExtendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Extend Trial</DialogTitle>
            <DialogDescription>
              Set a new end date and provide a reason for the extension.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="extend-date">New End Date</Label>
              <Input
                id="extend-date"
                type="date"
                value={extendDate}
                onChange={(e) => setExtendDate(e.target.value)}
                min={signOff.trialEndDate
                  ? new Date(new Date(signOff.trialEndDate).getTime() + 86400000).toISOString().split('T')[0]
                  : new Date().toISOString().split('T')[0]
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="extend-reason">Reason for Extension</Label>
              <Textarea
                id="extend-reason"
                value={extendReason}
                onChange={(e) => setExtendReason(e.target.value)}
                placeholder="e.g. Need more time to evaluate, Waiting on vendor response"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExtendDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleExtendTrial}
              disabled={!extendDate || !extendReason.trim() || isExtendingTrial}
            >
              {isExtendingTrial ? 'Extending...' : 'Extend Trial'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Linked parent/child sign-off */}
      {signOff.parentSignOffId && (
        <Card className="border-[#d1d5db] bg-[#f9fafb] dark:border-[#4b5563] dark:bg-[#1f2937]/50">
          <CardContent className="flex items-center gap-2 py-3">
            <FileText className="h-4 w-4 text-[#2563eb] dark:text-[#60a5fa]" />
            <span className="text-sm">
              This is a rollout request linked to trial sign-off{' '}
              <Link
                href={`/sign-offs/${signOff.parentSignOffId}`}
                className="font-medium text-[#6C33DA] hover:underline dark:text-[#c4b5fd]"
              >
                {signOff.parentSignOffId}
              </Link>
            </span>
          </CardContent>
        </Card>
      )}

      {/* Trial fields with amber treatment */}
      {signOff.isTrial && (
        <Card className="border-[#FFB900] bg-[#fef3c7]/50 dark:border-[#fbbf24]/30 dark:bg-[#fbbf24]/10/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FlaskConical className="h-4 w-4 text-[#d97706] dark:text-[#fcd34d]" />
              Trial Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {signOff.trialDuration && (
              <div className="text-sm">
                <span className="text-muted-foreground">Duration:</span>{' '}
                <span className="font-medium">{signOff.trialDuration}</span>
              </div>
            )}
            {signOff.trialEndDate && (
              <div className="flex items-center gap-2 text-sm">
                <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">End Date:</span>{' '}
                <span className="font-medium">{formatDateTime(signOff.trialEndDate)}</span>
              </div>
            )}
            {signOff.trialDataAccessScope && (
              <div className="text-sm">
                <p className="text-muted-foreground mb-1">Data Access Scope</p>
                <MarkdownContent content={signOff.trialDataAccessScope} />
              </div>
            )}
            {signOff.trialSuccessCriteria && (
              <div className="text-sm">
                <p className="text-muted-foreground mb-1">Success Criteria</p>
                <MarkdownContent content={signOff.trialSuccessCriteria} />
              </div>
            )}
            {signOff.trialGoLiveRolloutPlan && (
              <div className="text-sm">
                <p className="text-muted-foreground mb-1">Go-Live Rollout Plan</p>
                <MarkdownContent content={signOff.trialGoLiveRolloutPlan} />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Two-column layout: main + sidebar */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        {/* Main content */}
        <div className="space-y-6 min-w-0">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <MarkdownContent content={signOff.description} />
            </CardContent>
          </Card>

          {/* Due Diligence */}
          {signOff.dueDiligence && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Due Diligence</CardTitle>
              </CardHeader>
              <CardContent>
                <MarkdownContent content={signOff.dueDiligence} />
              </CardContent>
            </Card>
          )}

          {/* Roll Out Plan */}
          {signOff.rollOutPlan && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Roll Out Plan</CardTitle>
              </CardHeader>
              <CardContent>
                <MarkdownContent content={signOff.rollOutPlan} />
              </CardContent>
            </Card>
          )}

          {/* Cost */}
          {signOff.cost && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Cost</CardTitle>
              </CardHeader>
              <CardContent>
                <MarkdownContent content={signOff.cost} />
              </CardContent>
            </Card>
          )}

          {/* Custom Sections */}
          {signOff.customSections.length > 0 &&
            signOff.customSections
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((section) => (
                <Card key={section.id}>
                  <CardHeader>
                    <CardTitle className="text-base">{section.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <MarkdownContent content={section.content} />
                  </CardContent>
                </Card>
              ))}

          {/* Supporting Docs */}
          {signOff.supportingDocs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Supporting Documents/Links</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {signOff.supportingDocs.map((doc) => (
                    <li key={doc.id} className="flex items-center gap-2 text-sm">
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#2563eb] dark:text-[#60a5fa] hover:underline truncate"
                      >
                        {doc.title}
                      </a>
                      <span className="text-muted-foreground text-xs shrink-0">
                        added by {doc.addedBy.name}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Risk Assessment */}
          {signOff.riskAssessment && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Risk Assessment</CardTitle>
              </CardHeader>
              <CardContent>
                <RiskAssessmentSummary risk={signOff.riskAssessment} />
              </CardContent>
            </Card>
          )}

          {/* Status History / Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <SignOffTimeline statusHistory={signOff.statusHistory} />
            </CardContent>
          </Card>

          {/* Comments */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Comments</CardTitle>
            </CardHeader>
            <CardContent>
              <SignOffComments comments={signOff.comments} signOffId={signOff.id} />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="order-first lg:order-last">
          <div className="lg:sticky lg:top-6">
            <SignOffSidebar signOff={signOff} />
          </div>
        </div>
      </div>
    </div>
  )
}
