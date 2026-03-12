import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { SignOffStatus } from '@/types'

const STATUS_CONFIG: Record<SignOffStatus, { label: string; className: string }> = {
  DRAFT: {
    label: 'Draft',
    className: 'bg-[#f3f4f6] text-[#374151] dark:bg-[#374151] dark:text-[#d1d5db]',
  },
  SUBMITTED: {
    label: 'Submitted',
    className: 'bg-[#fef3c7] text-[#92400e] dark:bg-[#78350f] dark:text-[#fcd34d]',
  },
  HAS_COMMENTS: {
    label: 'Has Comments',
    className: 'bg-[#ffedd5] text-[#9a3412] dark:bg-[#7c2d12] dark:text-[#fdba74]',
  },
  APPROVED: {
    label: 'Approved',
    className: 'bg-[#d1fae5] text-[#065f46] dark:bg-[#064e3b] dark:text-[#6ee7b7]',
  },
  REJECTED: {
    label: 'Rejected',
    className: 'bg-[#fef2f2] text-[#b91c1c] dark:bg-[#450a0a] dark:text-[#fca5a5]',
  },
  WITHDRAWN: {
    label: 'Withdrawn',
    className: 'bg-[#f3f4f6] text-[#6b7280] dark:bg-[#374151] dark:text-[#9ca3af]',
  },
}

export function StatusBadge({ status }: { status: SignOffStatus }) {
  const config = STATUS_CONFIG[status]
  return (
    <Badge variant="outline" className={cn('border-0 font-medium', config.className)}>
      {config.label}
    </Badge>
  )
}
