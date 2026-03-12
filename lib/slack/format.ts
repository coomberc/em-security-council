import type { KnownBlock } from '@slack/web-api'
import { formatSequenceNumber } from '@/lib/format'
import type { SignOffRequest } from '@/types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function signOffLink(signOff: Pick<SignOffRequest, 'id' | 'sequenceNumber' | 'title'>, baseUrl: string): string {
  const seq = formatSequenceNumber(signOff.sequenceNumber)
  return `<${baseUrl}/sign-offs/${signOff.id}|${seq} – ${signOff.title}>`
}

function headerBlock(text: string): KnownBlock {
  return { type: 'header', text: { type: 'plain_text', text, emoji: true } }
}

function sectionBlock(markdown: string): KnownBlock {
  return { type: 'section', text: { type: 'mrkdwn', text: markdown } }
}

function divider(): KnownBlock {
  return { type: 'divider' }
}

// ---------------------------------------------------------------------------
// Formatters
// ---------------------------------------------------------------------------

export function formatSubmitted(
  signOff: Pick<SignOffRequest, 'id' | 'sequenceNumber' | 'title' | 'department'>,
  submitterName: string,
  baseUrl: string,
): KnownBlock[] {
  return [
    headerBlock('New Sign-Off Submitted'),
    sectionBlock(
      `${signOffLink(signOff, baseUrl)}\n\n` +
      `*Department:* ${signOff.department.name}\n` +
      `*Submitted by:* ${submitterName}`,
    ),
    divider(),
  ]
}

export function formatApproved(
  signOff: Pick<SignOffRequest, 'id' | 'sequenceNumber' | 'title' | 'department'>,
  approverName: string,
  baseUrl: string,
): KnownBlock[] {
  return [
    headerBlock('Sign-Off Fully Approved'),
    sectionBlock(
      `${signOffLink(signOff, baseUrl)}\n\n` +
      `*Department:* ${signOff.department.name}\n` +
      `*Final approval by:* ${approverName}`,
    ),
    divider(),
  ]
}

export function formatRejected(
  signOff: Pick<SignOffRequest, 'id' | 'sequenceNumber' | 'title'>,
  rejectorName: string,
  comment: string | undefined,
  baseUrl: string,
): KnownBlock[] {
  const blocks: KnownBlock[] = [
    headerBlock('Sign-Off Rejected'),
    sectionBlock(
      `${signOffLink(signOff, baseUrl)}\n\n` +
      `*Rejected by:* ${rejectorName}`,
    ),
  ]
  if (comment) {
    blocks.push(sectionBlock(`*Comment:*\n>${comment}`))
  }
  blocks.push(divider())
  return blocks
}

export function formatComment(
  signOff: Pick<SignOffRequest, 'id' | 'sequenceNumber' | 'title'>,
  commenterName: string,
  baseUrl: string,
): KnownBlock[] {
  return [
    headerBlock('Sign-Off Has Comments'),
    sectionBlock(
      `${signOffLink(signOff, baseUrl)}\n\n` +
      `*Comment by:* ${commenterName}\n` +
      `The sign-off status has been changed to *Has Comments*. Please review and address the feedback.`,
    ),
    divider(),
  ]
}

export function formatContentChanged(
  signOff: Pick<SignOffRequest, 'id' | 'sequenceNumber' | 'title'>,
  userName: string,
  baseUrl: string,
): KnownBlock[] {
  return [
    headerBlock('Approval Revoked — Content Changed'),
    sectionBlock(
      `${signOffLink(signOff, baseUrl)}\n\n` +
      `*Updated by:* ${userName}\n` +
      `Previous approvals have been revoked because the sign-off content was modified.`,
    ),
    divider(),
  ]
}

export function formatTrialReminder(
  signOff: Pick<SignOffRequest, 'id' | 'sequenceNumber' | 'title'>,
  daysUntilExpiry: number,
  baseUrl: string,
): KnownBlock[] {
  return [
    headerBlock('Trial Deadline Approaching'),
    sectionBlock(
      `${signOffLink(signOff, baseUrl)}\n\n` +
      `This trial sign-off expires in *${daysUntilExpiry} day${daysUntilExpiry === 1 ? '' : 's'}*. ` +
      `Please ensure the trial evaluation is completed and a decision is made.`,
    ),
    divider(),
  ]
}

export function formatSlaReminder(
  signOff: Pick<SignOffRequest, 'id' | 'sequenceNumber' | 'title'>,
  daysPending: number,
  baseUrl: string,
): KnownBlock[] {
  return [
    headerBlock('Approval Reminder'),
    sectionBlock(
      `${signOffLink(signOff, baseUrl)}\n\n` +
      `This sign-off has been pending your approval for *${daysPending} day${daysPending === 1 ? '' : 's'}*. ` +
      `Please review and make a decision.`,
    ),
    divider(),
  ]
}
