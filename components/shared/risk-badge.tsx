import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { getRiskLevel } from '@/lib/constants'

const RISK_CONFIG = {
  low: {
    label: 'Low Risk',
    className: 'border-[#34d399] bg-[#a7f3d0] text-[#065f46] dark:bg-[#34d399]/10 dark:text-[#34d399] dark:border-[#34d399]/40',
  },
  medium: {
    label: 'Medium Risk',
    className: 'border-[#f59e0b] bg-[#fde68a] text-[#78350f] dark:bg-[#fbbf24]/10 dark:text-[#fbbf24] dark:border-[#fbbf24]/40',
  },
  high: {
    label: 'High Risk',
    className: 'border-[#f97316] bg-[#fed7aa] text-[#7c2d12] dark:bg-[#fb923c]/10 dark:text-[#fb923c] dark:border-[#fb923c]/40',
  },
  critical: {
    label: 'Critical Risk',
    className: 'border-[#f87171] bg-[#fecaca] text-[#991b1b] dark:bg-[#f87171]/10 dark:text-[#f87171] dark:border-[#f87171]/40',
  },
}

export function RiskBadge({ score }: { score: number }) {
  const level = getRiskLevel(score)
  const config = RISK_CONFIG[level]
  return (
    <Badge variant="outline" className={cn('font-medium border', config.className)}>
      {config.label} ({score})
    </Badge>
  )
}
