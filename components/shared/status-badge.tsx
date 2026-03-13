import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { SignOffStatus } from '@/types'

const STATUS_CONFIG: Record<SignOffStatus, { label: string; className: string }> = {
  DRAFT: {
    label: 'Draft',
    className: 'border-[#6b7280] bg-[#6b7280] text-white dark:bg-[#374151]/50 dark:text-[#d1d5db] dark:border-[#4b5563]',
  },
  SUBMITTED: {
    label: 'Submitted',
    className: 'border-[#d97706] bg-[#f59e0b] text-white dark:bg-[#fbbf24]/10 dark:text-[#fbbf24] dark:border-[#fbbf24]/40',
  },
  HAS_COMMENTS: {
    label: 'Has Comments',
    className: 'border-[#c2410c] bg-[#f97316] text-white dark:bg-[#fb923c]/10 dark:text-[#fb923c] dark:border-[#fb923c]/40',
  },
  APPROVED: {
    label: 'Approved',
    className: 'border-[#059669] bg-[#10b981] text-white dark:bg-[#34d399]/10 dark:text-[#34d399] dark:border-[#34d399]/40',
  },
  REJECTED: {
    label: 'Rejected',
    className: 'border-[#dc2626] bg-[#ef4444] text-white dark:bg-[#f87171]/10 dark:text-[#f87171] dark:border-[#f87171]/40',
  },
  WITHDRAWN: {
    label: 'Withdrawn',
    className: 'border-[#9ca3af] bg-[#9ca3af] text-white dark:bg-[#6b7280]/10 dark:text-[#9ca3af] dark:border-[#6b7280]/40',
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
