import { FlaskConical } from 'lucide-react'

export function TrialBadge() {
  return (
    <>
      <span
        className="inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap dark:hidden"
        style={{ backgroundColor: '#f59e0b', color: '#ffffff', border: '1px solid #d97706' }}
      >
        <FlaskConical className="mr-1 h-3 w-3" />
        Trial
      </span>
      <span
        className="hidden dark:inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap"
        style={{ backgroundColor: 'rgba(251,191,36,0.1)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.4)' }}
      >
        <FlaskConical className="mr-1 h-3 w-3" />
        Trial
      </span>
    </>
  )
}
