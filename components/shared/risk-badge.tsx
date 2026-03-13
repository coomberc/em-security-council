import { getRiskLevel } from '@/lib/constants'

const RISK_CONFIG = {
  low: {
    label: 'Low Risk',
    light: { bg: '#10b981', text: '#ffffff', border: '#059669' },
    dark: { bg: 'rgba(52,211,153,0.1)', text: '#34d399', border: 'rgba(52,211,153,0.4)' },
  },
  medium: {
    label: 'Medium Risk',
    light: { bg: '#f59e0b', text: '#ffffff', border: '#d97706' },
    dark: { bg: 'rgba(251,191,36,0.1)', text: '#fbbf24', border: 'rgba(251,191,36,0.4)' },
  },
  high: {
    label: 'High Risk',
    light: { bg: '#f97316', text: '#ffffff', border: '#c2410c' },
    dark: { bg: 'rgba(251,146,60,0.1)', text: '#fb923c', border: 'rgba(251,146,60,0.4)' },
  },
  critical: {
    label: 'Critical Risk',
    light: { bg: '#ef4444', text: '#ffffff', border: '#dc2626' },
    dark: { bg: 'rgba(248,113,113,0.1)', text: '#f87171', border: 'rgba(248,113,113,0.4)' },
  },
}

export function RiskBadge({ score }: { score: number }) {
  const level = getRiskLevel(score)
  const { label, light, dark } = RISK_CONFIG[level]

  return (
    <span
      className="inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap risk-badge"
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
      {label} ({score})
    </span>
  )
}
