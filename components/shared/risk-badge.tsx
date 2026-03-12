import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { getRiskLevel } from '@/lib/constants'

const RISK_CONFIG = {
  low: {
    label: 'Low Risk',
    className: 'bg-[#d1fae5] text-[#065f46] dark:bg-[#064e3b] dark:text-[#6ee7b7]',
  },
  medium: {
    label: 'Medium Risk',
    className: 'bg-[#fef3c7] text-[#92400e] dark:bg-[#78350f] dark:text-[#fcd34d]',
  },
  high: {
    label: 'High Risk',
    className: 'bg-[#ffedd5] text-[#c2410c] dark:bg-[#7c2d12] dark:text-[#fdba74]',
  },
  critical: {
    label: 'Critical Risk',
    className: 'bg-[#fee2e2] text-[#991b1b] dark:bg-[#7f1d1d] dark:text-[#fca5a5]',
  },
}

export function RiskBadge({ score }: { score: number }) {
  const level = getRiskLevel(score)
  const config = RISK_CONFIG[level]
  return (
    <Badge variant="outline" className={cn('border-0 font-medium', config.className)}>
      {config.label} ({score})
    </Badge>
  )
}
