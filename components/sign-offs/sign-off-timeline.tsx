'use client'

import { ArrowRight } from 'lucide-react'
import { StatusBadge } from '@/components/shared/status-badge'
import { formatDateTime } from '@/lib/format'
import type { SignOffStatusChange } from '@/types'

interface SignOffTimelineProps {
  statusHistory: SignOffStatusChange[]
}

export function SignOffTimeline({ statusHistory }: SignOffTimelineProps) {
  if (statusHistory.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No status changes recorded.</p>
    )
  }

  const sorted = [...statusHistory].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  )

  return (
    <div className="relative space-y-0">
      {sorted.map((change, index) => {
        const isLast = index === sorted.length - 1

        return (
          <div key={change.id} className="relative flex gap-4 pb-6 last:pb-0">
            {/* Vertical line */}
            {!isLast && (
              <div className="absolute left-[11px] top-6 h-full w-px bg-border" />
            )}

            {/* Dot */}
            <div className="relative z-10 mt-1.5 h-[9px] w-[9px] shrink-0 rounded-full border-2 border-primary bg-background" />

            {/* Content */}
            <div className="flex-1 min-w-0 -mt-0.5">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-medium">{change.changedBy.name}</span>
                {change.fromStatus ? (
                  <>
                    <StatusBadge status={change.fromStatus} />
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    <StatusBadge status={change.toStatus} />
                  </>
                ) : (
                  <>
                    <span className="text-muted-foreground">created as</span>
                    <StatusBadge status={change.toStatus} />
                  </>
                )}
              </div>
              {change.reason && (
                <p className="mt-1 text-sm text-muted-foreground">{change.reason}</p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                {formatDateTime(change.createdAt)}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
