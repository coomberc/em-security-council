import type { SignOffStatus } from '@/types'

const STATUS_CONFIG: Record<SignOffStatus, { label: string; light: { bg: string; text: string; border: string }; dark: { bg: string; text: string; border: string } }> = {
  DRAFT: {
    label: 'Draft',
    light: { bg: '#e5e7eb', text: '#374151', border: '#9ca3af' },
    dark: { bg: 'rgba(107,114,128,0.15)', text: '#d1d5db', border: 'rgba(107,114,128,0.4)' },
  },
  SUBMITTED: {
    label: 'Submitted',
    light: { bg: '#fde68a', text: '#78350f', border: '#f59e0b' },
    dark: { bg: 'rgba(251,191,36,0.1)', text: '#fbbf24', border: 'rgba(251,191,36,0.4)' },
  },
  HAS_COMMENTS: {
    label: 'Has Comments',
    light: { bg: '#fed7aa', text: '#7c2d12', border: '#f97316' },
    dark: { bg: 'rgba(251,146,60,0.1)', text: '#fb923c', border: 'rgba(251,146,60,0.4)' },
  },
  APPROVED: {
    label: 'Approved',
    light: { bg: '#a7f3d0', text: '#065f46', border: '#10b981' },
    dark: { bg: 'rgba(52,211,153,0.1)', text: '#34d399', border: 'rgba(52,211,153,0.4)' },
  },
  REJECTED: {
    label: 'Rejected',
    light: { bg: '#fecaca', text: '#991b1b', border: '#ef4444' },
    dark: { bg: 'rgba(248,113,113,0.1)', text: '#f87171', border: 'rgba(248,113,113,0.4)' },
  },
  WITHDRAWN: {
    label: 'Withdrawn',
    light: { bg: '#e5e7eb', text: '#6b7280', border: '#9ca3af' },
    dark: { bg: 'rgba(107,114,128,0.1)', text: '#9ca3af', border: 'rgba(107,114,128,0.4)' },
  },
}

export function StatusBadge({ status }: { status: SignOffStatus }) {
  const { label, light, dark } = STATUS_CONFIG[status]

  return (
    <span
      className="inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap status-badge"
      style={{
        '--sb-bg': light.bg,
        '--sb-text': light.text,
        '--sb-border': light.border,
        '--sb-bg-dark': dark.bg,
        '--sb-text-dark': dark.text,
        '--sb-border-dark': dark.border,
        backgroundColor: 'var(--sb-bg)',
        color: 'var(--sb-text)',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: 'var(--sb-border)',
      } as React.CSSProperties}
    >
      {label}
    </span>
  )
}
