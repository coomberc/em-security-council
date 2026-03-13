import type { StatusChangeRecord } from '@/lib/analytics/types'

// ---------------------------------------------------------------------------
// Cycle time computation
// ---------------------------------------------------------------------------

/**
 * Compute cycle time in days for a sign-off, from first submission
 * (DRAFT -> SUBMITTED) to final approval (-> APPROVED).
 * Returns null if the sign-off hasn't completed.
 */
export function computeCycleTimeDays(
  statusChanges: StatusChangeRecord[],
): number | null {
  if (statusChanges.length === 0) return null

  const sorted = [...statusChanges].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  )

  // Find first submission (transition from DRAFT to SUBMITTED)
  const submission = sorted.find(
    (s) => s.fromStatus === 'DRAFT' && s.toStatus === 'SUBMITTED',
  )
  if (!submission) return null

  // Find approval
  const approval = sorted.find((s) => s.toStatus === 'APPROVED')
  if (!approval) return null

  return round(diffHours(submission.createdAt, approval.createdAt) / 24)
}

/**
 * Compute percentile from a sorted array of numbers.
 */
export function percentile(sortedValues: number[], p: number): number {
  if (sortedValues.length === 0) return 0
  const index = (p / 100) * (sortedValues.length - 1)
  const lower = Math.floor(index)
  const upper = Math.ceil(index)
  if (lower === upper) return sortedValues[lower]
  return round(
    sortedValues[lower] * (upper - index) + sortedValues[upper] * (index - lower),
  )
}

/**
 * Compute median from an array of numbers.
 */
export function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  return percentile(sorted, 50)
}

// ---------------------------------------------------------------------------
// Week bucketing
// ---------------------------------------------------------------------------

/**
 * Get the ISO week start (Monday) for a given date string.
 */
export function getWeekStart(dateStr: string): string {
  const date = new Date(dateStr)
  const day = date.getUTCDay()
  const diff = day === 0 ? -6 : 1 - day // Adjust to Monday
  const monday = new Date(date)
  monday.setUTCDate(monday.getUTCDate() + diff)
  return `${monday.getUTCFullYear()}-${String(monday.getUTCMonth() + 1).padStart(2, '0')}-${String(monday.getUTCDate()).padStart(2, '0')}`
}

// ---------------------------------------------------------------------------
// Response time computation
// ---------------------------------------------------------------------------

/**
 * Compute response time in hours — time from SUBMITTED to next status change.
 */
export function getResponseHours(statusChanges: StatusChangeRecord[]): number | null {
  const sorted = [...statusChanges].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  )
  const startIdx = sorted.findIndex((s) => s.toStatus === 'SUBMITTED')
  if (startIdx === -1) return null

  const nextChange = sorted[startIdx + 1]
  if (!nextChange) return null

  return (new Date(nextChange.createdAt).getTime() - new Date(sorted[startIdx].createdAt).getTime()) / (1000 * 60 * 60)
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function diffHours(from: string, to: string): number {
  return (new Date(to).getTime() - new Date(from).getTime()) / (1000 * 60 * 60)
}

function round(value: number, decimals: number = 1): number {
  const factor = Math.pow(10, decimals)
  return Math.round(value * factor) / factor
}

export { round, diffHours }
