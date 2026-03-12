import { CheckCircle2, Circle, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SignOffSummaryApproval, SignOffApproverAssignment } from '@/types'

interface ApprovalProgressProps {
  approvers: SignOffApproverAssignment[]
  approvals: SignOffSummaryApproval[]
}

export function ApprovalProgress({ approvers, approvals }: ApprovalProgressProps) {
  const activeApprovals = approvals.filter((a) => !a.revokedAt)
  const approvedCount = activeApprovals.filter((a) => a.decision === 'APPROVED').length
  const rejectedCount = activeApprovals.filter((a) => a.decision === 'REJECTED').length
  const total = approvers.length

  if (total === 0) return null

  return (
    <div className="flex items-center gap-1.5 text-sm">
      {rejectedCount > 0 ? (
        <>
          <XCircle className="h-4 w-4 text-[#D95852]" />
          <span className="text-[#D95852] dark:text-[#fca5a5]">Rejected</span>
        </>
      ) : (
        <>
          <CheckCircle2 className={cn(
            'h-4 w-4',
            approvedCount === total ? 'text-[#22c55e]' : 'text-muted-foreground',
          )} />
          <span className={cn(
            approvedCount === total ? 'text-[#065f46] dark:text-[#6ee7b7]' : 'text-muted-foreground',
          )}>
            {approvedCount}/{total}
          </span>
        </>
      )}
    </div>
  )
}
