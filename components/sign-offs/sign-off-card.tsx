import { memo } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { StatusBadge } from '@/components/shared/status-badge'
import { RiskBadge } from '@/components/shared/risk-badge'
import { TrialStateBadge } from '@/components/shared/trial-badge'
import { ApprovalProgress } from '@/components/shared/approval-progress'
import { formatRelativeDate, formatSequenceNumber, signOffUrl } from '@/lib/format'
import type { SignOffSummary } from '@/types'

interface SignOffCardProps {
  signOff: SignOffSummary
}

function arePropsEqual(prev: SignOffCardProps, next: SignOffCardProps): boolean {
  return (
    prev.signOff.id === next.signOff.id &&
    prev.signOff.updatedAt === next.signOff.updatedAt
  )
}

export const SignOffCard = memo(function SignOffCard({ signOff }: SignOffCardProps) {
  return (
    <Link href={signOffUrl(signOff)} prefetch={false} className="block">
      <Card className="transition-colors hover:bg-accent/50">
        <CardContent className="p-3 space-y-2">
          {/* Title + sequence number */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-medium leading-snug line-clamp-2">
              {signOff.title}
            </h3>
            <Badge variant="outline" className="font-mono text-[10px] shrink-0">
              {formatSequenceNumber(signOff.sequenceNumber)}
            </Badge>
          </div>

          {/* Badges */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <StatusBadge status={signOff.status} />
            <TrialStateBadge signOff={signOff} />
            {signOff.riskScore != null && <RiskBadge score={signOff.riskScore} />}
          </div>

          {/* Meta line */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="truncate">{signOff.department.name}</span>
            {signOff.vendorName && (
              <>
                <span>&middot;</span>
                <span className="truncate">{signOff.vendorName}</span>
              </>
            )}
            <span>&middot;</span>
            <span className="truncate">{signOff.submittedBy.name}</span>
            <span>&middot;</span>
            <span className="shrink-0">{formatRelativeDate(signOff.createdAt)}</span>
          </div>

          {/* Approval progress */}
          <ApprovalProgress
            approvers={signOff.approvers}
            approvals={signOff.approvals}
          />
        </CardContent>
      </Card>
    </Link>
  )
}, arePropsEqual)
