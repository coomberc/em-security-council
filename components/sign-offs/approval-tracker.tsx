'use client'

import { CheckCircle2, XCircle, MessageCircle, Clock, Zap } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type {
  SignOffApproval,
  SignOffApproverAssignment,
  User,
} from '@/types'

interface ApprovalTrackerProps {
  approvers: SignOffApproverAssignment[]
  approvals: SignOffApproval[]
  allUsers: User[]
}

type ApproverStatus = 'approved' | 'rejected' | 'commented' | 'pending'

function getApproverStatus(
  userId: string,
  approvals: SignOffApproval[],
): { status: ApproverStatus; approval?: SignOffApproval } {
  const active = approvals.filter((a) => !a.revokedAt && a.approver.id === userId)
  const approved = active.find((a) => a.decision === 'APPROVED')
  if (approved) return { status: 'approved', approval: approved }
  const rejected = active.find((a) => a.decision === 'REJECTED')
  if (rejected) return { status: 'rejected', approval: rejected }
  const commented = active.find((a) => a.decision === 'HAS_COMMENTS')
  if (commented) return { status: 'commented', approval: commented }
  return { status: 'pending' }
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const STATUS_ICON: Record<ApproverStatus, React.ReactNode> = {
  approved: <CheckCircle2 className="h-4 w-4 text-[#22c55e]" />,
  rejected: <XCircle className="h-4 w-4 text-[#D95852]" />,
  commented: <MessageCircle className="h-4 w-4 text-[#d97706]" />,
  pending: <Clock className="h-4 w-4 text-muted-foreground" />,
}

const STATUS_LABEL: Record<ApproverStatus, string> = {
  approved: 'Approved',
  rejected: 'Rejected',
  commented: 'Commented',
  pending: 'Pending',
}

export function ApprovalTracker({ approvers, approvals, allUsers }: ApprovalTrackerProps) {
  if (approvers.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No approvers assigned.</p>
    )
  }

  return (
    <div className="space-y-3">
      {approvers.map((assignment) => {
        const user = allUsers.find((u) => u.id === assignment.userId)
        const name = user?.name ?? 'Unknown User'
        const avatarUrl = user?.avatarUrl
        const { status, approval } = getApproverStatus(assignment.userId, approvals)
        const isAutoApproved =
          status === 'approved' && approval?.comment === 'Auto-approved (submitter is a fixed approver)'

        return (
          <div
            key={assignment.userId}
            className="flex items-center gap-3 rounded-lg border border-border bg-background p-3"
          >
            <Avatar size="sm">
              {avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
              <AvatarFallback>{getInitials(name)}</AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium truncate">{name}</span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                {STATUS_ICON[status]}
                <span className="text-xs text-muted-foreground">
                  {STATUS_LABEL[status]}
                </span>
                {approval && (
                  <span className="text-xs text-muted-foreground">
                    (v{approval.contentVersion})
                  </span>
                )}
                {isAutoApproved && (
                  <Badge
                    variant="outline"
                    className="ml-1 gap-0.5 border-[#d1d5db] bg-[#f3f4f6] text-[#374151] text-[10px] px-1.5 py-0 dark:border-[#4b5563] dark:bg-[#374151] dark:text-[#d1d5db]"
                  >
                    <Zap className="h-2.5 w-2.5" />
                    Auto
                  </Badge>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
