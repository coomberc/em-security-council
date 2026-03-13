import type { SignOffSummary } from '@/types'
import { CATEGORY_LABELS, STATUS_LABELS } from '@/lib/constants'
import { formatSequenceNumber } from '@/lib/format'

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function formatDate(dateString: string): string {
  return dateString.slice(0, 10)
}

const COLUMNS = [
  'Seq #',
  'Title',
  'Vendor',
  'Department',
  'Categories',
  'Status',
  'Trial',
  'Trial End',
  'Risk Score',
  'Submitted By',
  'Created',
  'Updated',
] as const

export function exportSignOffsToCSV(signOffs: SignOffSummary[]): string {
  const header = COLUMNS.map(escapeCSV).join(',')

  const rows = signOffs.map((s) => {
    const fields = [
      formatSequenceNumber(s.sequenceNumber),
      s.title,
      s.vendorName ?? '',
      s.department.name,
      s.categories.map((c) => CATEGORY_LABELS[c]).join('; '),
      STATUS_LABELS[s.status] ?? s.status,
      s.isTrial ? 'Yes' : 'No',
      s.trialEndDate ?? '',
      s.riskScore != null ? String(s.riskScore) : '',
      s.submittedBy.name,
      formatDate(s.createdAt),
      formatDate(s.updatedAt),
    ]
    return fields.map(escapeCSV).join(',')
  })

  return [header, ...rows].join('\n')
}
