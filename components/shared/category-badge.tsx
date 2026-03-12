import { Badge } from '@/components/ui/badge'
import { CATEGORY_LABELS } from '@/lib/constants'
import type { SignOffCategory } from '@/types'

export function CategoryBadge({ category }: { category: SignOffCategory }) {
  return (
    <Badge variant="secondary" className="text-xs">
      {CATEGORY_LABELS[category] ?? category}
    </Badge>
  )
}
