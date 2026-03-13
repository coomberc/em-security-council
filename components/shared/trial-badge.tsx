import { FlaskConical } from 'lucide-react'

export function TrialBadge() {
  return (
    <span
      className="inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap trial-badge"
      style={{
        '--sb-bg': '#f59e0b',
        '--sb-text': '#ffffff',
        '--sb-border': '#d97706',
        '--sb-bg-dark': 'rgba(251,191,36,0.1)',
        '--sb-text-dark': '#fbbf24',
        '--sb-border-dark': 'rgba(251,191,36,0.4)',
        backgroundColor: 'var(--sb-bg)',
        color: 'var(--sb-text)',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: 'var(--sb-border)',
      } as React.CSSProperties}
    >
      <FlaskConical className="mr-1 h-3 w-3" />
      Trial
    </span>
  )
}
