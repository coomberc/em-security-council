import { Badge } from '@/components/ui/badge'
import { FlaskConical } from 'lucide-react'

export function TrialBadge() {
  return (
    <Badge variant="outline" className="border-[#f59e0b] bg-[#fef3c7] text-[#92400e] dark:bg-[#fbbf24]/10 dark:text-[#fbbf24] dark:border-[#fbbf24]/40">
      <FlaskConical className="mr-1 h-3 w-3" />
      Trial
    </Badge>
  )
}
