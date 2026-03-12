import type { KnownBlock } from '@slack/web-api'
import { env } from '@/lib/env'
import { getSlackClient } from '@/lib/slack/client'
import { lookupSlackUserId } from '@/lib/slack/users'
import {
  formatSubmitted,
  formatApproved,
  formatRejected,
  formatComment,
  formatContentChanged,
  formatTrialReminder,
  formatSlaReminder,
} from '@/lib/slack/format'
import type { SignOffRequest, User } from '@/types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const CHANNEL_ID = env.SLACK_CHANNEL_ID ?? ''
const BASE_URL = env.APP_BASE_URL

async function postToChannel(blocks: KnownBlock[]): Promise<void> {
  if (!CHANNEL_ID) {
    console.warn('[Slack] SLACK_CHANNEL_ID not configured — skipping channel notification')
    return
  }
  const slack = await getSlackClient()
  await slack.chat.postMessage({ channel: CHANNEL_ID, blocks, text: 'Security Approvals notification' })
}

async function sendDm(userEmail: string, blocks: KnownBlock[]): Promise<void> {
  const slackUserId = await lookupSlackUserId(userEmail)
  if (!slackUserId) {
    console.warn(`[Slack] Cannot DM — no Slack user found for ${userEmail}`)
    return
  }
  const slack = await getSlackClient()
  const conversation = await slack.conversations.open({ users: slackUserId })
  const channelId = conversation.channel?.id
  if (!channelId) {
    console.warn(`[Slack] Cannot DM — failed to open conversation with ${slackUserId}`)
    return
  }
  await slack.chat.postMessage({ channel: channelId, blocks, text: 'Security Approvals notification' })
}

/**
 * Fire-and-forget wrapper. Logs errors but never throws so callers are not
 * blocked by Slack failures.
 */
function fireAndForget(fn: () => Promise<void>): void {
  fn().catch((error) => {
    console.error('[Slack] Notification failed:', error)
  })
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function notifySubmitted(
  signOff: Pick<SignOffRequest, 'id' | 'sequenceNumber' | 'title' | 'department'>,
  submitter: Pick<User, 'name'>,
): void {
  fireAndForget(async () => {
    const blocks = formatSubmitted(signOff, submitter.name, BASE_URL)
    await postToChannel(blocks)
  })
}

export function notifyApproved(
  signOff: Pick<SignOffRequest, 'id' | 'sequenceNumber' | 'title' | 'department' | 'submittedBy'>,
  approver: Pick<User, 'name'>,
): void {
  fireAndForget(async () => {
    const blocks = formatApproved(signOff, approver.name, BASE_URL)
    await postToChannel(blocks)
    await sendDm(signOff.submittedBy.email, blocks)
  })
}

export function notifyRejected(
  signOff: Pick<SignOffRequest, 'id' | 'sequenceNumber' | 'title' | 'submittedBy'>,
  rejector: Pick<User, 'name'>,
  comment?: string,
): void {
  fireAndForget(async () => {
    const blocks = formatRejected(signOff, rejector.name, comment, BASE_URL)
    await sendDm(signOff.submittedBy.email, blocks)
  })
}

export function notifyCommented(
  signOff: Pick<SignOffRequest, 'id' | 'sequenceNumber' | 'title' | 'submittedBy'>,
  commenter: Pick<User, 'name'>,
): void {
  fireAndForget(async () => {
    const blocks = formatComment(signOff, commenter.name, BASE_URL)
    await sendDm(signOff.submittedBy.email, blocks)
  })
}

export function notifyApprovalRevoked(
  signOff: Pick<SignOffRequest, 'id' | 'sequenceNumber' | 'title' | 'submittedBy'>,
  user: Pick<User, 'name'>,
): void {
  fireAndForget(async () => {
    const blocks = formatContentChanged(signOff, user.name, BASE_URL)
    await sendDm(signOff.submittedBy.email, blocks)
  })
}

export function notifyTrialDeadline(
  signOff: Pick<SignOffRequest, 'id' | 'sequenceNumber' | 'title' | 'submittedBy'>,
  daysUntilExpiry: number,
): void {
  fireAndForget(async () => {
    const blocks = formatTrialReminder(signOff, daysUntilExpiry, BASE_URL)
    await sendDm(signOff.submittedBy.email, blocks)
  })
}

export function notifySlaReminder(
  signOff: Pick<SignOffRequest, 'id' | 'sequenceNumber' | 'title' | 'approvers'>,
  daysPending: number,
  approverEmails: string[],
): void {
  fireAndForget(async () => {
    const blocks = formatSlaReminder(signOff, daysPending, BASE_URL)
    await Promise.all(approverEmails.map((email) => sendDm(email, blocks)))
  })
}
