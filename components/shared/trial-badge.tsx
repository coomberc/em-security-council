import { FlaskConical } from 'lucide-react'
import type { SignOffSummary } from '@/types'

export function TrialBadge() {
  return (
    <span
      className="inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap trial-badge"
      style={{
        '--sb-bg': '#fde68a',
        '--sb-text': '#92400e',
        '--sb-border': '#f59e0b',
        '--sb-bg-dark': 'rgba(251,191,36,0.1)',
        '--sb-text-dark': '#fbbf24',
        '--sb-border-dark': 'rgba(251,191,36,0.4)',
        backgroundColor: 'var(--sb-bg)',
        color: 'var(--sb-text)',
      } as React.CSSProperties}
    >
      <FlaskConical className="mr-1 h-3 w-3" />
      Trial
    </span>
  )
}

type TrialState = 'active' | 'overdue' | 'rolled-out' | 'closed'

const TRIAL_STATE_STYLES: Record<TrialState, { bg: string; text: string; bgDark: string; textDark: string }> = {
  active: { bg: '#fde68a', text: '#92400e', bgDark: 'rgba(251,191,36,0.1)', textDark: '#fbbf24' },
  overdue: { bg: '#fecaca', text: '#991b1b', bgDark: 'rgba(239,68,68,0.1)', textDark: '#f87171' },
  'rolled-out': { bg: '#bbf7d0', text: '#166534', bgDark: 'rgba(34,197,94,0.1)', textDark: '#4ade80' },
  closed: { bg: '#e5e7eb', text: '#374151', bgDark: 'rgba(156,163,175,0.15)', textDark: '#9ca3af' },
}

const TRIAL_STATE_LABELS: Record<TrialState, string> = {
  active: 'Active',
  overdue: 'Overdue',
  'rolled-out': 'Rolled Out',
  closed: 'Closed',
}

function getTrialState(signOff: Pick<SignOffSummary, 'isTrial' | 'status' | 'trialOutcome' | 'trialEndDate'>): TrialState | null {
  if (!signOff.isTrial) return null

  if (signOff.trialOutcome === 'ROLLED_OUT') return 'rolled-out'
  if (signOff.trialOutcome === 'CLOSED') return 'closed'

  // PENDING or no outcome yet — only show state badge for approved trials
  if (signOff.status !== 'APPROVED') return null

  const isOverdue = signOff.trialEndDate && new Date(signOff.trialEndDate) < new Date()
  return isOverdue ? 'overdue' : 'active'
}

export function TrialStateBadge({ signOff }: { signOff: Pick<SignOffSummary, 'isTrial' | 'status' | 'trialOutcome' | 'trialEndDate'> }) {
  const state = getTrialState(signOff)
  if (!state) {
    // Fall back to simple trial badge for non-approved trials
    return signOff.isTrial ? <TrialBadge /> : null
  }

  const styles = TRIAL_STATE_STYLES[state]

  return (
    <span
      className="inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap"
      style={{
        backgroundColor: styles.bg,
        color: styles.text,
      } as React.CSSProperties}
    >
      <FlaskConical className="mr-1 h-3 w-3" />
      {TRIAL_STATE_LABELS[state]}
    </span>
  )
}
