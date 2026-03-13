import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { SignOffStatus } from '@/types'

const STATUS_CONFIG: Record<SignOffStatus, { label: string; className: string }> = {
  DRAFT: {
    label: 'Draft',
    className: 'border-[#9ca3af] bg-[#e5e7eb] text-[#374151] dark:bg-[#374151]/50 dark:text-[#d1d5db] dark:border-[#4b5563]',
  },
  SUBMITTED: {
    label: 'Submitted',
    className: 'border-[#f59e0b] bg-[#fde68a] text-[#78350f] dark:bg-[#fbbf24]/10 dark:text-[#fbbf24] dark:border-[#fbbf24]/40',
  },
  HAS_COMMENTS: {
    label: 'Has Comments',
    className: 'border-[#f97316] bg-[#fed7aa] text-[#7c2d12] dark:bg-[#fb923c]/10 dark:text-[#fb923c] dark:border-[#fb923c]/40',
  },
  APPROVED: {
    label: 'Approved',
    className: 'border-[#34d399] bg-[#a7f3d0] text-[#065f46] dark:bg-[#34d399]/10 dark:text-[#34d399] dark:border-[#34d399]/40',
  },
  REJECTED: {
    label: 'Rejected',
    className: 'border-[#f87171] bg-[#fecaca] text-[#991b1b] dark:bg-[#f87171]/10 dark:text-[#f87171] dark:border-[#f87171]/40',
  },
  WITHDRAWN: {
    label: 'Withdrawn',
    className: 'border-[#9ca3af] bg-[#e5e7eb] text-[#6b7280] dark:bg-[#6b7280]/10 dark:text-[#9ca3af] dark:border-[#6b7280]/40',
  },
}

export function StatusBadge({ status }: { status: SignOffStatus }) {
  const config = STATUS_CONFIG[status]
  return (
    <Badge variant="outline" className={cn('font-medium border', config.className)}>
      {config.label}
    </Badge>
  )
}
