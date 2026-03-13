import { Badge } from '@/components/ui/badge'
import { FlaskConical } from 'lucide-react'

export function TrialBadge() {
  return (
    <Badge variant="outline" className="border border-[#d97706] bg-[#f59e0b] text-white dark:bg-[#fbbf24]/10 dark:text-[#fbbf24] dark:border-[#fbbf24]/40">
      <FlaskConical className="mr-1 h-3 w-3" />
      Trial
    </Badge>
  )
}
