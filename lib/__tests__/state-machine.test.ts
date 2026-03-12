import { describe, it, expect } from 'vitest'
import {
  canPerformAction,
  getNextStatus,
  getAvailableActions,
  getActiveApprovals,
  getApprovalCount,
  getRequiredApprovalCount,
  isFullyApproved,
  shouldAutoApprove,
} from '@/lib/state-machine'
import type {
  User,
  SignOffStatus,
  SignOffAction,
  SignOffApproval,
  SignOffApproverAssignment,
} from '@/types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    email: 'user@test.com',
    name: 'Test User',
    role: 'STAFF_MEMBER',
    isFixedApprover: false,
    ...overrides,
  }
}

function makeApprover(overrides: Partial<User> = {}): User {
  return makeUser({
    id: 'approver-1',
    role: 'APPROVER',
    isFixedApprover: true,
    ...overrides,
  })
}

function makeSignOff(overrides: Partial<{
  status: SignOffStatus
  submittedById: string
  contentVersion: number
  approvals: SignOffApproval[]
  approvers: SignOffApproverAssignment[]
}> = {}) {
  return {
    status: overrides.status ?? ('DRAFT' as SignOffStatus),
    submittedBy: { id: overrides.submittedById ?? 'user-1' },
    contentVersion: overrides.contentVersion ?? 1,
    approvals: overrides.approvals ?? [],
    approvers: overrides.approvers ?? [
      { userId: 'approver-1', isFixed: true },
      { userId: 'approver-2', isFixed: true },
      { userId: 'approver-3', isFixed: true },
    ],
  }
}

function makeApproval(overrides: Partial<SignOffApproval> = {}): SignOffApproval {
  return {
    id: `approval-${Math.random()}`,
    approverId: 'approver-1',
    approver: makeApprover(),
    decision: 'APPROVED',
    contentVersion: 1,
    createdAt: new Date().toISOString(),
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// canPerformAction
// ---------------------------------------------------------------------------

describe('canPerformAction', () => {
  describe('submit', () => {
    it('allows the submitter to submit a DRAFT', () => {
      const user = makeUser()
      const signOff = makeSignOff({ status: 'DRAFT' })
      expect(canPerformAction(user, signOff, 'submit')).toEqual({ allowed: true })
    })

    it('rejects submit from non-submitter', () => {
      const user = makeUser({ id: 'other-user' })
      const signOff = makeSignOff({ status: 'DRAFT' })
      const result = canPerformAction(user, signOff, 'submit')
      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('submitter')
    })

    it('rejects submit from SUBMITTED status', () => {
      const user = makeUser()
      const signOff = makeSignOff({ status: 'SUBMITTED' })
      const result = canPerformAction(user, signOff, 'submit')
      expect(result.allowed).toBe(false)
    })
  })

  describe('approve', () => {
    it('allows an assigned approver to approve a SUBMITTED sign-off', () => {
      const user = makeApprover()
      const signOff = makeSignOff({ status: 'SUBMITTED' })
      expect(canPerformAction(user, signOff, 'approve')).toEqual({ allowed: true })
    })

    it('rejects approve from non-assigned approver', () => {
      const user = makeApprover({ id: 'not-assigned' })
      const signOff = makeSignOff({ status: 'SUBMITTED' })
      const result = canPerformAction(user, signOff, 'approve')
      expect(result.allowed).toBe(false)
    })

    it('rejects approve if already approved', () => {
      const user = makeApprover()
      const signOff = makeSignOff({
        status: 'SUBMITTED',
        approvals: [makeApproval({ approverId: 'approver-1' })],
      })
      const result = canPerformAction(user, signOff, 'approve')
      expect(result.allowed).toBe(false)
    })

    it('allows approve even when revoked approval exists', () => {
      const user = makeApprover()
      const signOff = makeSignOff({
        status: 'SUBMITTED',
        approvals: [
          makeApproval({
            approverId: 'approver-1',
            revokedAt: new Date().toISOString(),
          }),
        ],
      })
      expect(canPerformAction(user, signOff, 'approve')).toEqual({ allowed: true })
    })
  })

  describe('comment', () => {
    it('allows an approver to comment on a SUBMITTED sign-off', () => {
      const user = makeApprover()
      const signOff = makeSignOff({ status: 'SUBMITTED' })
      expect(canPerformAction(user, signOff, 'comment')).toEqual({ allowed: true })
    })

    it('rejects comment from submitter', () => {
      const user = makeUser()
      const signOff = makeSignOff({ status: 'SUBMITTED' })
      const result = canPerformAction(user, signOff, 'comment')
      expect(result.allowed).toBe(false)
    })

    it('allows council member to comment', () => {
      const user = makeUser({ id: 'council-1', role: 'COUNCIL_MEMBER' })
      const signOff = makeSignOff({ status: 'SUBMITTED', submittedById: 'other' })
      expect(canPerformAction(user, signOff, 'comment')).toEqual({ allowed: true })
    })
  })

  describe('reject', () => {
    it('allows an assigned approver to reject', () => {
      const user = makeApprover()
      const signOff = makeSignOff({ status: 'SUBMITTED' })
      expect(canPerformAction(user, signOff, 'reject')).toEqual({ allowed: true })
    })

    it('rejects rejection from submitter', () => {
      const user = makeUser()
      const signOff = makeSignOff({ status: 'SUBMITTED' })
      const result = canPerformAction(user, signOff, 'reject')
      expect(result.allowed).toBe(false)
    })
  })

  describe('withdraw', () => {
    it('allows submitter to withdraw from DRAFT', () => {
      const user = makeUser()
      const signOff = makeSignOff({ status: 'DRAFT' })
      expect(canPerformAction(user, signOff, 'withdraw')).toEqual({ allowed: true })
    })

    it('allows submitter to withdraw from SUBMITTED', () => {
      const user = makeUser()
      const signOff = makeSignOff({ status: 'SUBMITTED' })
      expect(canPerformAction(user, signOff, 'withdraw')).toEqual({ allowed: true })
    })

    it('rejects withdraw from non-submitter', () => {
      const user = makeUser({ id: 'other' })
      const signOff = makeSignOff({ status: 'SUBMITTED' })
      const result = canPerformAction(user, signOff, 'withdraw')
      expect(result.allowed).toBe(false)
    })

    it('rejects withdraw from APPROVED', () => {
      const user = makeUser()
      const signOff = makeSignOff({ status: 'APPROVED' })
      const result = canPerformAction(user, signOff, 'withdraw')
      expect(result.allowed).toBe(false)
    })
  })

  describe('reopen', () => {
    it('allows submitter to reopen WITHDRAWN', () => {
      const user = makeUser()
      const signOff = makeSignOff({ status: 'WITHDRAWN' })
      expect(canPerformAction(user, signOff, 'reopen')).toEqual({ allowed: true })
    })

    it('rejects reopen from non-submitter', () => {
      const user = makeUser({ id: 'other' })
      const signOff = makeSignOff({ status: 'WITHDRAWN' })
      const result = canPerformAction(user, signOff, 'reopen')
      expect(result.allowed).toBe(false)
    })
  })

  describe('resubmit', () => {
    it('allows submitter to resubmit from HAS_COMMENTS', () => {
      const user = makeUser()
      const signOff = makeSignOff({ status: 'HAS_COMMENTS' })
      expect(canPerformAction(user, signOff, 'resubmit')).toEqual({ allowed: true })
    })

    it('rejects resubmit from non-submitter', () => {
      const user = makeUser({ id: 'other' })
      const signOff = makeSignOff({ status: 'HAS_COMMENTS' })
      const result = canPerformAction(user, signOff, 'resubmit')
      expect(result.allowed).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// getNextStatus
// ---------------------------------------------------------------------------

describe('getNextStatus', () => {
  it('submit → SUBMITTED', () => {
    const signOff = makeSignOff({ status: 'DRAFT' })
    expect(getNextStatus(signOff, 'submit')).toBe('SUBMITTED')
  })

  it('approve with 2/3 approvals → SUBMITTED', () => {
    const signOff = makeSignOff({
      status: 'SUBMITTED',
      approvals: [
        makeApproval({ approverId: 'approver-1' }),
      ],
    })
    expect(getNextStatus(signOff, 'approve')).toBe('SUBMITTED')
  })

  it('approve with 2/3 approvals (completing) → APPROVED', () => {
    const signOff = makeSignOff({
      status: 'SUBMITTED',
      approvals: [
        makeApproval({ approverId: 'approver-1' }),
        makeApproval({ approverId: 'approver-2' }),
      ],
    })
    expect(getNextStatus(signOff, 'approve')).toBe('APPROVED')
  })

  it('comment → HAS_COMMENTS', () => {
    const signOff = makeSignOff({ status: 'SUBMITTED' })
    expect(getNextStatus(signOff, 'comment')).toBe('HAS_COMMENTS')
  })

  it('reject → REJECTED', () => {
    const signOff = makeSignOff({ status: 'SUBMITTED' })
    expect(getNextStatus(signOff, 'reject')).toBe('REJECTED')
  })

  it('withdraw → WITHDRAWN', () => {
    const signOff = makeSignOff({ status: 'SUBMITTED' })
    expect(getNextStatus(signOff, 'withdraw')).toBe('WITHDRAWN')
  })

  it('reopen → DRAFT', () => {
    const signOff = makeSignOff({ status: 'WITHDRAWN' })
    expect(getNextStatus(signOff, 'reopen')).toBe('DRAFT')
  })

  it('resubmit → SUBMITTED', () => {
    const signOff = makeSignOff({ status: 'HAS_COMMENTS' })
    expect(getNextStatus(signOff, 'resubmit')).toBe('SUBMITTED')
  })
})

// ---------------------------------------------------------------------------
// getAvailableActions
// ---------------------------------------------------------------------------

describe('getAvailableActions', () => {
  it('submitter on DRAFT can submit or withdraw', () => {
    const user = makeUser()
    const signOff = makeSignOff({ status: 'DRAFT' })
    expect(getAvailableActions(user, signOff)).toEqual(['submit', 'withdraw'])
  })

  it('approver on SUBMITTED can approve, comment, or reject', () => {
    const user = makeApprover()
    const signOff = makeSignOff({ status: 'SUBMITTED', submittedById: 'other' })
    expect(getAvailableActions(user, signOff)).toEqual(['approve', 'comment', 'reject'])
  })

  it('submitter on SUBMITTED can only withdraw', () => {
    const user = makeUser()
    const signOff = makeSignOff({ status: 'SUBMITTED' })
    expect(getAvailableActions(user, signOff)).toEqual(['withdraw'])
  })

  it('no actions on APPROVED', () => {
    const user = makeUser()
    const signOff = makeSignOff({ status: 'APPROVED' })
    expect(getAvailableActions(user, signOff)).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

describe('getActiveApprovals', () => {
  it('filters out revoked approvals', () => {
    const signOff = {
      approvals: [
        makeApproval({ id: 'a1' }),
        makeApproval({ id: 'a2', revokedAt: new Date().toISOString() }),
      ],
      approvers: [],
    }
    expect(getActiveApprovals(signOff)).toHaveLength(1)
    expect(getActiveApprovals(signOff)[0].id).toBe('a1')
  })
})

describe('getApprovalCount', () => {
  it('counts active APPROVED decisions', () => {
    const signOff = {
      approvals: [
        makeApproval({ decision: 'APPROVED' }),
        makeApproval({ decision: 'HAS_COMMENTS' }),
        makeApproval({ decision: 'APPROVED', revokedAt: new Date().toISOString() }),
      ],
      approvers: [],
    }
    expect(getApprovalCount(signOff)).toBe(1)
  })
})

describe('isFullyApproved', () => {
  it('returns true when all approvers have approved', () => {
    const signOff = {
      approvals: [
        makeApproval({ approverId: 'approver-1', approver: makeApprover({ id: 'approver-1' }) }),
        makeApproval({ approverId: 'approver-2', approver: makeApprover({ id: 'approver-2' }) }),
      ],
      approvers: [
        { userId: 'approver-1', isFixed: true },
        { userId: 'approver-2', isFixed: true },
      ],
    }
    expect(isFullyApproved(signOff)).toBe(true)
  })

  it('returns false when some approvers have not approved', () => {
    const signOff = {
      approvals: [
        makeApproval({ approverId: 'approver-1' }),
      ],
      approvers: [
        { userId: 'approver-1', isFixed: true },
        { userId: 'approver-2', isFixed: true },
      ],
    }
    expect(isFullyApproved(signOff)).toBe(false)
  })
})

describe('shouldAutoApprove', () => {
  it('returns true when user is a fixed approver', () => {
    expect(shouldAutoApprove('approver-1', [
      { userId: 'approver-1', isFixed: true },
      { userId: 'approver-2', isFixed: true },
    ])).toBe(true)
  })

  it('returns false when user is not a fixed approver', () => {
    expect(shouldAutoApprove('user-1', [
      { userId: 'approver-1', isFixed: true },
    ])).toBe(false)
  })

  it('returns false for additional (non-fixed) approver', () => {
    expect(shouldAutoApprove('approver-3', [
      { userId: 'approver-1', isFixed: true },
      { userId: 'approver-3', isFixed: false },
    ])).toBe(false)
  })
})
