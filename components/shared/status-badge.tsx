import type { SignOffStatus } from '@/types'

const STATUS_CONFIG: Record<SignOffStatus, { label: string; light: { bg: string; text: string; border: string }; dark: { bg: string; text: string; border: string } }> = {
  DRAFT: {
    label: 'Draft',
    light: { bg: '#6b7280', text: '#ffffff', border: '#6b7280' },
    dark: { bg: 'rgba(107,114,128,0.15)', text: '#d1d5db', border: 'rgba(107,114,128,0.4)' },
  },
  SUBMITTED: {
    label: 'Submitted',
    light: { bg: '#f59e0b', text: '#ffffff', border: '#d97706' },
    dark: { bg: 'rgba(251,191,36,0.1)', text: '#fbbf24', border: 'rgba(251,191,36,0.4)' },
  },
  HAS_COMMENTS: {
    label: 'Has Comments',
    light: { bg: '#f97316', text: '#ffffff', border: '#c2410c' },
    dark: { bg: 'rgba(251,146,60,0.1)', text: '#fb923c', border: 'rgba(251,146,60,0.4)' },
  },
  APPROVED: {
    label: 'Approved',
    light: { bg: '#10b981', text: '#ffffff', border: '#059669' },
    dark: { bg: 'rgba(52,211,153,0.1)', text: '#34d399', border: 'rgba(52,211,153,0.4)' },
  },
  REJECTED: {
    label: 'Rejected',
    light: { bg: '#ef4444', text: '#ffffff', border: '#dc2626' },
    dark: { bg: 'rgba(248,113,113,0.1)', text: '#f87171', border: 'rgba(248,113,113,0.4)' },
  },
  WITHDRAWN: {
    label: 'Withdrawn',
    light: { bg: '#9ca3af', text: '#ffffff', border: '#9ca3af' },
    dark: { bg: 'rgba(107,114,128,0.1)', text: '#9ca3af', border: 'rgba(107,114,128,0.4)' },
  },
}

export function StatusBadge({ status }: { status: SignOffStatus }) {
  const config = STATUS_CONFIG[status]
  return (
    <>
      <span
        className="inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap dark:hidden"
        style={{ backgroundColor: config.light.bg, color: config.light.text, border: `1px solid ${config.light.border}` }}
      >
        {config.label}
      </span>
      <span
        className="hidden dark:inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap"
        style={{ backgroundColor: config.dark.bg, color: config.dark.text, border: `1px solid ${config.dark.border}` }}
      >
        {config.label}
      </span>
    </>
  )
}
