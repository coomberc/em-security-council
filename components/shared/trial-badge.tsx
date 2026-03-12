import { Badge } from '@/components/ui/badge'
import { FlaskConical } from 'lucide-react'

export function TrialBadge() {
  return (
    <Badge variant="outline" className="border-[#f59e0b] bg-[#fef3c7] text-[#92400e] dark:border-[#b45309] dark:bg-[#78350f] dark:text-[#fcd34d]">
      <FlaskConical className="mr-1 h-3 w-3" />
      Trial
    </Badge>
  )
}
