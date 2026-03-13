'use client'

import { Card, CardContent } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MetricCardData } from '@/lib/analytics/types'

interface MetricCardProps {
  data: MetricCardData
}

export function MetricCard({ data }: MetricCardProps) {
  const { label, value, trend, trendLabel } = data

  return (
    <Card className="py-3">
      <CardContent className="flex flex-col gap-1">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold">{value}</span>
          {trend && trendLabel && (
            <span
              className={cn(
                'flex items-center gap-0.5 text-xs font-medium',
                trend === 'up' && 'text-green-600 dark:text-green-400',
                trend === 'down' && 'text-red-600 dark:text-red-400',
                trend === 'neutral' && 'text-muted-foreground',
              )}
            >
              {trend === 'up' && <TrendingUp className="h-3 w-3" />}
              {trend === 'down' && <TrendingDown className="h-3 w-3" />}
              {trend === 'neutral' && <Minus className="h-3 w-3" />}
              {trendLabel}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
