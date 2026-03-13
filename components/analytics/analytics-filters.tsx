'use client'

import { Button } from '@/components/ui/button'
import { CalendarIcon } from 'lucide-react'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'

interface DateRange {
  from: Date
  to: Date
}

interface AnalyticsFiltersProps {
  dateRange: DateRange
  onDateRangeChange: (range: DateRange) => void
}

const PRESETS = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
  { label: 'Last 6 months', days: 180 },
  { label: 'Last 12 months', days: 365 },
] as const

export function AnalyticsFilters({ dateRange, onDateRangeChange }: AnalyticsFiltersProps) {
  const activeDays = Math.round(
    (dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24),
  )
  const activePreset = PRESETS.find((p) => Math.abs(p.days - activeDays) <= 1)

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {PRESETS.map((preset) => {
        const isActive = activePreset?.days === preset.days
        return (
          <Button
            key={preset.days}
            variant={isActive ? 'default' : 'outline'}
            size="sm"
            className={isActive ? undefined : 'hover:bg-transparent hover:border-primary'}
            onClick={() =>
              onDateRangeChange({
                from: startOfDay(subDays(new Date(), preset.days)),
                to: endOfDay(new Date()),
              })
            }
          >
            {preset.label}
          </Button>
        )
      })}
      <div className="ml-2 flex items-center gap-1.5 text-sm text-muted-foreground">
        <CalendarIcon className="h-4 w-4" />
        <span>
          {format(dateRange.from, 'd MMM yyyy')} &ndash; {format(dateRange.to, 'd MMM yyyy')}
        </span>
      </div>
    </div>
  )
}
