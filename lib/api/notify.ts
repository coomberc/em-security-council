import type { SignOffAction, SignOffRequest, User } from '@/types'
import {
  notifySubmitted,
  notifyApproved,
  notifyRejected,
  notifyCommented,
  notifyApprovalRevoked,
} from '@/lib/slack/notify'

/**
 * Maps a sign-off action to the appropriate Slack notification(s).
 * Fire-and-forget — errors are logged but never thrown.
 */
export async function dispatchActionNotification(
  signOff: SignOffRequest,
  user: User,
  action: SignOffAction,
  comment?: string,
): Promise<void> {
  switch (action) {
    case 'submit':
    case 'resubmit':
      notifySubmitted(signOff, user)
      break

    case 'approve':
      // Only send "fully approved" notification when the sign-off has moved to APPROVED status
      if (signOff.status === 'APPROVED') {
        notifyApproved(signOff, user)
      }
      break

    case 'reject':
      notifyRejected(signOff, user, comment)
      break

    case 'comment':
      if (signOff.status === 'HAS_COMMENTS') {
        notifyCommented(signOff, user)
      }
      break

    case 'withdraw':
      // No notification for withdrawal — submitter initiated the action
      break

    case 'reopen':
      // No notification for reopen — submitter initiated the action
      break

    default: {
      // Exhaustive check — TypeScript will flag if a new action is added
      const _exhaustive: never = action
      console.warn(`[Notify] Unhandled action: ${_exhaustive}`)
    }
  }
}

/**
 * Dispatches a notification when approvals are revoked due to content changes.
 */
export function dispatchContentChangedNotification(
  signOff: SignOffRequest,
  user: User,
): void {
  notifyApprovalRevoked(signOff, user)
}
