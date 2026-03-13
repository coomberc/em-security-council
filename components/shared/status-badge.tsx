import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { SignOffStatus } from '@/types'

const STATUS_CONFIG: Record<SignOffStatus, { label: string; className: string }> = {
  DRAFT: {
    label: 'Draft',
    className: 'bg-[#f3f4f6] text-[#374151] dark:bg-[#374151]/50 dark:text-[#d1d5db] dark:border-[#4b5563]',
  },
  SUBMITTED: {
    label: 'Submitted',
    className: 'bg-[#fef3c7] text-[#92400e] dark:bg-[#fbbf24]/10 dark:text-[#fbbf24] dark:border-[#fbbf24]/40',
  },
  HAS_COMMENTS: {
    label: 'Has Comments',
    className: 'bg-[#ffedd5] text-[#9a3412] dark:bg-[#fb923c]/10 dark:text-[#fb923c] dark:border-[#fb923c]/40',
  },
  APPROVED: {
    label: 'Approved',
    className: 'bg-[#d1fae5] text-[#065f46] dark:bg-[#34d399]/10 dark:text-[#34d399] dark:border-[#34d399]/40',
  },
  REJECTED: {
    label: 'Rejected',
    className: 'bg-[#fef2f2] text-[#b91c1c] dark:bg-[#f87171]/10 dark:text-[#f87171] dark:border-[#f87171]/40',
  },
  WITHDRAWN: {
    label: 'Withdrawn',
    className: 'bg-[#f3f4f6] text-[#6b7280] dark:bg-[#6b7280]/10 dark:text-[#9ca3af] dark:border-[#6b7280]/40',
  },
}

export function StatusBadge({ status }: { status: SignOffStatus }) {
  const config = STATUS_CONFIG[status]
  return (
    <Badge variant="outline" className={cn('font-medium dark:border', config.className)}>
      {config.label}
    </Badge>
  )
}
