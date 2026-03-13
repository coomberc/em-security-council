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
  const config = RISK_CONFIG[level]
  return (
    <>
      <span
        className="inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap dark:hidden"
        style={{ backgroundColor: config.light.bg, color: config.light.text, border: `1px solid ${config.light.border}` }}
      >
        {config.label} ({score})
      </span>
      <span
        className="hidden dark:inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap"
        style={{ backgroundColor: config.dark.bg, color: config.dark.text, border: `1px solid ${config.dark.border}` }}
      >
        {config.label} ({score})
      </span>
    </>
  )
}
