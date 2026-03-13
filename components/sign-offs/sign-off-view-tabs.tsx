'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronDown, Check } from 'lucide-react'
import {
  SIGN_OFF_VIEWS,
  VIEW_LABELS,
  type SignOffView,
} from '@/hooks/use-sign-off-filters'

const MOBILE_LABELS: Partial<Record<SignOffView, string>> = {
  'needs-my-review': 'My Review',
  'my-requests': 'My Open',
}

interface SignOffViewTabsProps {
  currentView: SignOffView
  counts: Record<SignOffView, number>
  onViewChange: (view: SignOffView) => void
  isApprover: boolean
}

function TabButton({
  view,
  label,
  count,
  isActive,
  onClick,
}: {
  view: SignOffView
  label: string
  count: number
  isActive: boolean
  onClick: () => void
}) {
  return (
    <button
      key={view}
      type="button"
      onClick={onClick}
      className={cn(
        'relative px-3 py-2 text-sm font-medium transition-colors',
        'hover:text-foreground',
        isActive ? 'text-foreground' : 'text-muted-foreground',
      )}
    >
      <span className="flex items-center gap-1.5">
        {label}
        <span
          className={cn(
            'inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-xs tabular-nums',
            isActive
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground',
          )}
        >
          {count}
        </span>
      </span>
      {isActive && (
        <span className="absolute inset-x-0 -bottom-px h-0.5 bg-primary" />
      )}
    </button>
  )
}

export function SignOffViewTabs({
  currentView,
  counts,
  onViewChange,
  isApprover,
}: SignOffViewTabsProps) {
  const visibleViews = SIGN_OFF_VIEWS.filter(
    (v) => v !== 'needs-my-review' || isApprover,
  )

  const primaryTabs = visibleViews.slice(0, 3)
  const overflowTabs = visibleViews.slice(3)
  const isOverflowActive = overflowTabs.includes(currentView)

  return (
    <>
      {/* Desktop */}
      <div className="hidden md:flex gap-1 border-b">
        {visibleViews.map((view) => (
          <TabButton
            key={view}
            view={view}
            label={VIEW_LABELS[view]}
            count={counts[view]}
            isActive={currentView === view}
            onClick={() => onViewChange(view)}
          />
        ))}
      </div>

      {/* Mobile */}
      <div className="md:hidden flex gap-1 border-b">
        {primaryTabs.map((view) => (
          <TabButton
            key={view}
            view={view}
            label={MOBILE_LABELS[view] ?? VIEW_LABELS[view]}
            count={counts[view]}
            isActive={currentView === view}
            onClick={() => onViewChange(view)}
          />
        ))}
        {overflowTabs.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'relative h-auto px-3 py-2 text-sm font-medium',
                  isOverflowActive ? 'text-foreground' : 'text-muted-foreground',
                )}
              >
                {isOverflowActive ? (MOBILE_LABELS[currentView] ?? VIEW_LABELS[currentView]) : 'More'}
                <ChevronDown className="ml-1 h-3 w-3" />
                {isOverflowActive && (
                  <span className="absolute inset-x-0 -bottom-px h-0.5 bg-primary" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {overflowTabs.map((view) => (
                <DropdownMenuItem
                  key={view}
                  onClick={() => onViewChange(view)}
                  className="flex items-center justify-between gap-3"
                >
                  <span className="flex items-center gap-2">
                    {currentView === view && <Check className="h-3.5 w-3.5" />}
                    {VIEW_LABELS[view]}
                  </span>
                  <span
                    className={cn(
                      'inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-xs tabular-nums',
                      currentView === view
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {counts[view]}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </>
  )
}
