import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns'

export function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString)
  if (isToday(date)) return `Today ${format(date, 'HH:mm')}`
  if (isYesterday(date)) return `Yesterday ${format(date, 'HH:mm')}`
  return format(date, 'd MMM yyyy')
}

export function formatDateTime(dateString: string): string {
  return format(new Date(dateString), 'd MMM yyyy HH:mm')
}

export function formatTimeAgo(dateString: string): string {
  return formatDistanceToNow(new Date(dateString), { addSuffix: true })
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function signOffUrl(signOff: { id: string; title: string }): string {
  return `/sign-offs/${signOff.id}/${slugify(signOff.title)}`
}

export function formatSequenceNumber(seq: number): string {
  return `SC-${String(seq).padStart(3, '0')}`
}
