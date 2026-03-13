'use client'

import { AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ApprovalTracker } from '@/components/sign-offs/approval-tracker'
import { SignOffActions } from '@/components/sign-offs/sign-off-actions'
import { useCurrentUser } from '@/providers/user-provider'
import type { SignOffRequest, RiskAssessment } from '@/types'

interface SignOffSidebarProps {
  signOff: SignOffRequest
}

/** Fields on the risk assessment that have an "unknown" flag */
const UNKNOWN_RISK_FIELDS: {
  field: keyof RiskAssessment
  label: string
}[] = [
  { field: 'dataClassificationUnknown', label: 'Data Classification' },
  { field: 'personalDataInvolvedUnknown', label: 'Personal Data Involved' },
  { field: 'dataStorageLocationUnknown', label: 'Data Storage Location' },
  { field: 'thirdPartyDataSharingUnknown', label: 'Third-Party Data Sharing' },
  { field: 'likelihoodOfBreachUnknown', label: 'Likelihood of Breach' },
  { field: 'impactOfBreachUnknown', label: 'Impact of Breach' },
  { field: 'hasEncryptionAtRestUnknown', label: 'Encryption at Rest' },
  { field: 'hasEncryptionInTransitUnknown', label: 'Encryption in Transit' },
  { field: 'hasMfaUnknown', label: 'Multi-Factor Authentication' },
  { field: 'hasAuditLoggingUnknown', label: 'Audit Logging' },
  { field: 'hasPenTestReportUnknown', label: 'Penetration Test Report' },
  { field: 'hasDisasterRecoveryUnknown', label: 'Disaster Recovery' },
  { field: 'hasSlaUnknown', label: 'SLA' },
]

function getUnknownFields(riskAssessment: RiskAssessment): string[] {
  return UNKNOWN_RISK_FIELDS
    .filter(({ field }) => riskAssessment[field] === true)
    .map(({ label }) => label)
}

export function SignOffSidebar({ signOff }: SignOffSidebarProps) {
  const { currentUser, allUsers } = useCurrentUser()
  const isApprover = signOff.approvers.some((a) => a.userId === currentUser.id)
  const unknownFields = signOff.riskAssessment
    ? getUnknownFields(signOff.riskAssessment)
    : []

  return (
    <div className="space-y-4">
      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <SignOffActions signOff={signOff} user={currentUser} />
        </CardContent>
      </Card>

      {/* Content Version */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Content Version</CardTitle>
        </CardHeader>
        <CardContent>
          <Badge variant="secondary" className="text-sm font-mono">
            v{signOff.contentVersion}
          </Badge>
        </CardContent>
      </Card>

      {/* Unknown Risk Fields Warning (for approvers) */}
      {isApprover && unknownFields.length > 0 && (
        <Card className="border-[#d97706] dark:border-[#fbbf24]/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-foreground">
              <AlertTriangle className="h-4 w-4 text-[#d97706] dark:text-[#fbbf24]" />
              Unknown Risk Fields
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-2">
              The submitter marked the following fields as unknown. Consider
              requesting clarification before approving.
            </p>
            <ul className="space-y-1">
              {unknownFields.map((field) => (
                <li
                  key={field}
                  className="flex items-center gap-2 text-sm text-foreground"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-[#d97706] dark:bg-[#fbbf24] shrink-0" />
                  {field}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Approval Tracker */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Approvals</CardTitle>
        </CardHeader>
        <CardContent>
          <ApprovalTracker
            approvers={signOff.approvers}
            approvals={signOff.approvals}
            allUsers={allUsers}
          />
        </CardContent>
      </Card>
    </div>
  )
}
