import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { getRiskLevel } from '@/lib/constants'

const RISK_CONFIG = {
  low: {
    label: 'Low Risk',
    className: 'border-[#059669] bg-[#10b981] text-white dark:bg-[#34d399]/10 dark:text-[#34d399] dark:border-[#34d399]/40',
  },
  medium: {
    label: 'Medium Risk',
    className: 'border-[#d97706] bg-[#f59e0b] text-white dark:bg-[#fbbf24]/10 dark:text-[#fbbf24] dark:border-[#fbbf24]/40',
  },
  high: {
    label: 'High Risk',
    className: 'border-[#c2410c] bg-[#f97316] text-white dark:bg-[#fb923c]/10 dark:text-[#fb923c] dark:border-[#fb923c]/40',
  },
  critical: {
    label: 'Critical Risk',
    className: 'border-[#dc2626] bg-[#ef4444] text-white dark:bg-[#f87171]/10 dark:text-[#f87171] dark:border-[#f87171]/40',
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
