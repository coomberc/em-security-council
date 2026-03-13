import type {
  SignOffRequest,
  SignOffSummaryApproval,
  SignOffApproval,
  SignOffStatus,
  SignOffAction,
  User,
  TransitionResult,
  SignOffApproverAssignment,
} from '@/types'

/** A sign-off-like object with approvals and approvers */
type SignOffWithApprovals = {
  approvals: (SignOffApproval | SignOffSummaryApproval)[]
  approvers: SignOffApproverAssignment[]
}

/** Minimal sign-off shape for guard/transition checks */
type SignOffForChecks = {
  status: SignOffStatus
  submittedBy: { id: string }
  contentVersion: number
  approvals: (SignOffApproval | SignOffSummaryApproval)[]
  approvers: SignOffApproverAssignment[]
}

// ---------------------------------------------------------------------------
// Transition map: which actions are valid from each status
// ---------------------------------------------------------------------------

const TRANSITION_MAP: Record<SignOffStatus, SignOffAction[]> = {
  DRAFT: ['submit', 'withdraw'],
  SUBMITTED: ['approve', 'comment', 'reject', 'withdraw'],
  HAS_COMMENTS: ['resubmit', 'withdraw'],
  APPROVED: ['reopen'],
  REJECTED: [],
  WITHDRAWN: ['reopen'],
}

// ---------------------------------------------------------------------------
// Target status for each action (static mapping for non-conditional actions)
// ---------------------------------------------------------------------------

const ACTION_TARGET: Record<Exclude<SignOffAction, 'approve'>, SignOffStatus> = {
  submit: 'SUBMITTED',
  comment: 'HAS_COMMENTS',
  reject: 'REJECTED',
  withdraw: 'WITHDRAWN',
  reopen: 'DRAFT',
  resubmit: 'SUBMITTED',
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns only active (non-revoked) approvals */
export function getActiveApprovals<T extends SignOffWithApprovals>(signOff: T): T['approvals'] {
  return signOff.approvals.filter((a) => !a.revokedAt) as T['approvals']
}

function getApproverIdFromApproval(a: SignOffApproval | SignOffSummaryApproval): string {
  return 'approver' in a ? a.approver.id : a.approverId
}

function isSubmitter(user: User, signOff: SignOffForChecks): boolean {
  return signOff.submittedBy.id === user.id
}

function isAssignedApprover(user: User, signOff: SignOffForChecks): boolean {
  return signOff.approvers.some((a) => a.userId === user.id)
}

function isApproverOrCouncilMember(user: User): boolean {
  return user.role === 'APPROVER' || user.role === 'COUNCIL_MEMBER'
}

function hasAlreadyApproved(user: User, signOff: SignOffForChecks): boolean {
  const active = getActiveApprovals(signOff)
  return active.some(
    (a) => a.decision === 'APPROVED' && getApproverIdFromApproval(a) === user.id,
  )
}

/** Count of active APPROVED approvals */
export function getApprovalCount(signOff: SignOffWithApprovals): number {
  return getActiveApprovals(signOff).filter(
    (a) => a.decision === 'APPROVED',
  ).length
}

/** Total number of assigned approvers */
export function getRequiredApprovalCount(signOff: SignOffWithApprovals): number {
  return signOff.approvers.length
}

/** Check if all assigned approvers have approved */
export function isFullyApproved(signOff: SignOffWithApprovals): boolean {
  const active = getActiveApprovals(signOff)
  return signOff.approvers.every((approver) =>
    active.some(
      (a) => a.decision === 'APPROVED' && getApproverIdFromApproval(a) === approver.userId,
    ),
  )
}

// ---------------------------------------------------------------------------
// getNextStatus
// ---------------------------------------------------------------------------

export function getNextStatus(
  signOff: SignOffForChecks,
  action: SignOffAction,
): SignOffStatus {
  if (action === 'approve') {
    // Check if this approval would make all approvers approved
    const currentCount = getApprovalCount(signOff)
    const requiredCount = getRequiredApprovalCount(signOff)
    return currentCount + 1 >= requiredCount ? 'APPROVED' : 'SUBMITTED'
  }

  return ACTION_TARGET[action]
}

// ---------------------------------------------------------------------------
// Guard: canPerformAction
// ---------------------------------------------------------------------------

export function canPerformAction(
  user: User,
  signOff: SignOffForChecks,
  action: SignOffAction,
): TransitionResult {
  const validActions = TRANSITION_MAP[signOff.status]
  if (!validActions.includes(action)) {
    return {
      allowed: false,
      reason: `Action "${action}" is not allowed from status "${signOff.status}"`,
    }
  }

  switch (action) {
    case 'submit': {
      return { allowed: true }
    }

    case 'approve': {
      if (!isAssignedApprover(user, signOff)) {
        return { allowed: false, reason: 'User is not an assigned approver for this sign-off' }
      }
      if (hasAlreadyApproved(user, signOff)) {
        return { allowed: false, reason: 'User has already approved this sign-off (on current version)' }
      }
      return { allowed: true }
    }

    case 'comment': {
      if (isSubmitter(user, signOff)) {
        return { allowed: false, reason: 'The submitter cannot add review comments on their own sign-off' }
      }
      if (!isAssignedApprover(user, signOff) && !isApproverOrCouncilMember(user)) {
        return {
          allowed: false,
          reason: 'User must be an assigned approver or council member to comment',
        }
      }
      return { allowed: true }
    }

    case 'reject': {
      if (isSubmitter(user, signOff)) {
        return { allowed: false, reason: 'The submitter cannot reject their own sign-off' }
      }
      if (!isAssignedApprover(user, signOff)) {
        return { allowed: false, reason: 'Only assigned approvers can reject a sign-off' }
      }
      return { allowed: true }
    }

    case 'withdraw': {
      if (!isSubmitter(user, signOff)) {
        return { allowed: false, reason: 'Only the submitter can withdraw this sign-off' }
      }
      return { allowed: true }
    }

    case 'reopen': {
      // From APPROVED: only fixed approvers can reopen
      if (signOff.status === 'APPROVED') {
        const isFixedApprover = signOff.approvers.some((a) => a.userId === user.id && a.isFixed)
        if (!isFixedApprover) {
          return { allowed: false, reason: 'Only fixed approvers can reopen an approved sign-off' }
        }
        return { allowed: true }
      }
      // From WITHDRAWN: submitter can reopen
      if (!isSubmitter(user, signOff)) {
        return { allowed: false, reason: 'Only the submitter can reopen this sign-off' }
      }
      return { allowed: true }
    }

    case 'resubmit': {
      if (!isSubmitter(user, signOff)) {
        return { allowed: false, reason: 'Only the submitter can resubmit this sign-off' }
      }
      return { allowed: true }
    }

    default: {
      const _exhaustive: never = action
      return { allowed: false, reason: `Unknown action: ${_exhaustive}` }
    }
  }
}

// ---------------------------------------------------------------------------
// getAvailableActions
// ---------------------------------------------------------------------------

export function getAvailableActions(
  user: User,
  signOff: SignOffForChecks,
): SignOffAction[] {
  const validActions = TRANSITION_MAP[signOff.status]
  return validActions.filter(
    (action) => canPerformAction(user, signOff, action).allowed,
  )
}

// ---------------------------------------------------------------------------
// Auto-approve logic for submitters who are fixed approvers
// ---------------------------------------------------------------------------

export function shouldAutoApprove(userId: string, approvers: SignOffApproverAssignment[]): boolean {
  return approvers.some((a) => a.userId === userId && a.isFixed)
}
