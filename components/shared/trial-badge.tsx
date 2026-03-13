import { Badge } from '@/components/ui/badge'
import { FlaskConical } from 'lucide-react'

export function TrialBadge() {
  return (
    <Badge variant="outline" className="border border-[#f59e0b] bg-[#fde68a] text-[#78350f] dark:bg-[#fbbf24]/10 dark:text-[#fbbf24] dark:border-[#fbbf24]/40">
      <FlaskConical className="mr-1 h-3 w-3" />
      Trial
    </Badge>
  )
}
