import { getPrisma } from '@/lib/db'
import { canPerformAction, getNextStatus, shouldAutoApprove, isFullyApproved } from '@/lib/state-machine'
import { computeRiskScore } from '@/lib/constants'
import { getSignOffById, getUserById, mapUser, mapDepartment } from '@/lib/db/queries'
import type {
  SignOffAction,
  SignOffStatus,
  CreateSignOffInput,
  UpdateSignOffInput,
  ApprovalDecision,
  SignOffRequest,
  User,
  Department,
} from '@/types'

// ---------------------------------------------------------------------------
// createSignOff
// ---------------------------------------------------------------------------

export async function createSignOff(
  input: CreateSignOffInput,
  userId: string,
): Promise<SignOffRequest> {
  const now = new Date()
  const prisma = await getPrisma()

  // Get fixed approvers to auto-assign
  const fixedApprovers = await prisma.user.findMany({
    where: { isFixedApprover: true },
  })

  const signOff = await prisma.$transaction(async (tx) => {
    const created = await tx.signOff.create({
      data: {
        status: 'DRAFT',
        title: input.title,
        departmentId: input.departmentId,
        categories: input.categories,
        vendorName: input.vendorName,
        vendorWebsite: input.vendorWebsite,
        description: input.description,
        dueDiligence: input.dueDiligence,
        rollOutPlan: input.rollOutPlan,
        cost: input.cost,
        isTrial: input.isTrial,
        trialDuration: input.trialDuration,
        trialDataAccessScope: input.trialDataAccessScope,
        trialSuccessCriteria: input.trialSuccessCriteria,
        trialGoLiveRolloutPlan: input.trialGoLiveRolloutPlan,
        trialEndDate: input.trialEndDate ? new Date(input.trialEndDate) : undefined,
        trialOutcome: input.isTrial ? 'PENDING' : undefined,
        submittedById: userId,
        contentVersion: 1,
        statusHistory: {
          create: {
            fromStatus: null,
            toStatus: 'DRAFT',
            changedById: userId,
            createdAt: now,
          },
        },
      },
    })

    // Auto-assign fixed approvers
    if (fixedApprovers.length > 0) {
      await tx.signOffApprover.createMany({
        data: fixedApprovers.map((fa) => ({
          signOffId: created.id,
          userId: fa.id,
          isFixed: true,
        })),
      })
    }

    // Create custom sections
    if (input.customSections.length > 0) {
      await tx.signOffCustomSection.createMany({
        data: input.customSections.map((s) => ({
          signOffId: created.id,
          title: s.title,
          content: s.content,
          sortOrder: s.sortOrder,
        })),
      })
    }

    // Create supporting docs
    if (input.supportingDocs.length > 0) {
      await tx.signOffSupportingDoc.createMany({
        data: input.supportingDocs.map((d) => ({
          signOffId: created.id,
          title: d.title,
          url: d.url,
          addedById: userId,
        })),
      })
    }

    // Create risk assessment if provided
    if (input.riskAssessment) {
      const ra = input.riskAssessment
      const score = computeRiskScore(ra.likelihoodOfBreach, ra.impactOfBreach)
      await tx.riskAssessment.create({
        data: {
          signOffId: created.id,
          dataClassification: ra.dataClassification,
          dataClassificationUnknown: ra.dataClassificationUnknown ?? false,
          personalDataInvolved: ra.personalDataInvolved,
          personalDataInvolvedUnknown: ra.personalDataInvolvedUnknown ?? false,
          personalDataDetails: ra.personalDataDetails,
          dataStorageLocation: ra.dataStorageLocation,
          dataStorageLocationUnknown: ra.dataStorageLocationUnknown ?? false,
          thirdPartyDataSharing: ra.thirdPartyDataSharing,
          thirdPartyDataSharingUnknown: ra.thirdPartyDataSharingUnknown ?? false,
          thirdPartyDataDetails: ra.thirdPartyDataDetails,
          likelihoodOfBreach: ra.likelihoodOfBreach,
          likelihoodOfBreachUnknown: ra.likelihoodOfBreachUnknown ?? false,
          impactOfBreach: ra.impactOfBreach,
          impactOfBreachUnknown: ra.impactOfBreachUnknown ?? false,
          overallRiskScore: score,
          hasEncryptionAtRest: ra.hasEncryptionAtRest,
          hasEncryptionAtRestUnknown: ra.hasEncryptionAtRestUnknown ?? false,
          hasEncryptionInTransit: ra.hasEncryptionInTransit,
          hasEncryptionInTransitUnknown: ra.hasEncryptionInTransitUnknown ?? false,
          hasMfa: ra.hasMfa,
          hasMfaUnknown: ra.hasMfaUnknown ?? false,
          hasAuditLogging: ra.hasAuditLogging,
          hasAuditLoggingUnknown: ra.hasAuditLoggingUnknown ?? false,
          hasPenTestReport: ra.hasPenTestReport,
          hasPenTestReportUnknown: ra.hasPenTestReportUnknown ?? false,
          hasDisasterRecovery: ra.hasDisasterRecovery,
          hasDisasterRecoveryUnknown: ra.hasDisasterRecoveryUnknown ?? false,
          hasSso: ra.hasSso,
          hasSsoUnknown: ra.hasSsoUnknown ?? false,
          hasSla: ra.hasSla,
          hasSlaUnknown: ra.hasSlaUnknown ?? false,
          slaDetails: ra.slaDetails,
          complianceCertifications: ra.complianceCertifications ?? [],
          mitigationPlan: ra.mitigationPlan,
          residualRiskNotes: ra.residualRiskNotes,
          dataPrivacyNA: ra.dataPrivacyNA ?? false,
          riskScoringNA: ra.riskScoringNA ?? false,
          controlsNA: ra.controlsNA ?? false,
        },
      })
    }

    return created
  })

  const hydrated = await getSignOffById(signOff.id)
  if (!hydrated) throw new Error('Failed to create sign-off')
  return hydrated
}

// ---------------------------------------------------------------------------
// updateSignOff
// ---------------------------------------------------------------------------

const EDITABLE_STATUSES = new Set(['DRAFT', 'HAS_COMMENTS', 'WITHDRAWN'])

export async function updateSignOff(
  signOffId: string,
  input: UpdateSignOffInput,
  userId: string,
): Promise<SignOffRequest> {
  const existing = await getSignOffById(signOffId)
  if (!existing) throw new Error('Sign-off not found')
  if (!EDITABLE_STATUSES.has(existing.status)) {
    throw new Error('Sign-off cannot be edited in its current status')
  }

  const now = new Date()
  const prisma = await getPrisma()

  // Increment content version — this will auto-revoke existing approvals
  const newContentVersion = existing.contentVersion + 1
  const hasActiveApprovals = existing.approvals.some(
    (a) => a.decision === 'APPROVED' && !a.revokedAt,
  )

  await prisma.$transaction(async (tx) => {
    await tx.signOff.update({
      where: { id: signOffId },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.departmentId !== undefined ? { departmentId: input.departmentId } : {}),
        ...(input.categories !== undefined ? { categories: input.categories } : {}),
        ...(input.vendorName !== undefined ? { vendorName: input.vendorName } : {}),
        ...(input.vendorWebsite !== undefined ? { vendorWebsite: input.vendorWebsite } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.dueDiligence !== undefined ? { dueDiligence: input.dueDiligence } : {}),
        ...(input.rollOutPlan !== undefined ? { rollOutPlan: input.rollOutPlan } : {}),
        ...(input.cost !== undefined ? { cost: input.cost } : {}),
        ...(input.isTrial !== undefined ? { isTrial: input.isTrial } : {}),
        ...(input.trialDuration !== undefined ? { trialDuration: input.trialDuration } : {}),
        ...(input.trialDataAccessScope !== undefined ? { trialDataAccessScope: input.trialDataAccessScope } : {}),
        ...(input.trialSuccessCriteria !== undefined ? { trialSuccessCriteria: input.trialSuccessCriteria } : {}),
        ...(input.trialGoLiveRolloutPlan !== undefined ? { trialGoLiveRolloutPlan: input.trialGoLiveRolloutPlan } : {}),
        ...(input.trialEndDate !== undefined
          ? { trialEndDate: input.trialEndDate ? new Date(input.trialEndDate) : null }
          : {}),
        contentVersion: newContentVersion,
      },
    })

    // Replace custom sections
    if (input.customSections !== undefined) {
      await tx.signOffCustomSection.deleteMany({ where: { signOffId } })
      if (input.customSections.length > 0) {
        await tx.signOffCustomSection.createMany({
          data: input.customSections.map((s) => ({
            signOffId,
            title: s.title,
            content: s.content,
            sortOrder: s.sortOrder,
          })),
        })
      }
    }

    // Replace supporting docs
    if (input.supportingDocs !== undefined) {
      await tx.signOffSupportingDoc.deleteMany({ where: { signOffId } })
      if (input.supportingDocs.length > 0) {
        await tx.signOffSupportingDoc.createMany({
          data: input.supportingDocs.map((d) => ({
            signOffId,
            title: d.title,
            url: d.url,
            addedById: userId,
          })),
        })
      }
    }

    // Replace risk assessment
    if (input.riskAssessment !== undefined) {
      await tx.riskAssessment.deleteMany({ where: { signOffId } })
      if (input.riskAssessment) {
        const ra = input.riskAssessment
        const score = computeRiskScore(ra.likelihoodOfBreach, ra.impactOfBreach)
        await tx.riskAssessment.create({
          data: {
            signOffId,
            dataClassification: ra.dataClassification,
            dataClassificationUnknown: ra.dataClassificationUnknown ?? false,
            personalDataInvolved: ra.personalDataInvolved,
            personalDataInvolvedUnknown: ra.personalDataInvolvedUnknown ?? false,
            personalDataDetails: ra.personalDataDetails,
            dataStorageLocation: ra.dataStorageLocation,
            dataStorageLocationUnknown: ra.dataStorageLocationUnknown ?? false,
            thirdPartyDataSharing: ra.thirdPartyDataSharing,
            thirdPartyDataSharingUnknown: ra.thirdPartyDataSharingUnknown ?? false,
            thirdPartyDataDetails: ra.thirdPartyDataDetails,
            likelihoodOfBreach: ra.likelihoodOfBreach,
            likelihoodOfBreachUnknown: ra.likelihoodOfBreachUnknown ?? false,
            impactOfBreach: ra.impactOfBreach,
            impactOfBreachUnknown: ra.impactOfBreachUnknown ?? false,
            overallRiskScore: score,
            hasEncryptionAtRest: ra.hasEncryptionAtRest,
            hasEncryptionAtRestUnknown: ra.hasEncryptionAtRestUnknown ?? false,
            hasEncryptionInTransit: ra.hasEncryptionInTransit,
            hasEncryptionInTransitUnknown: ra.hasEncryptionInTransitUnknown ?? false,
            hasMfa: ra.hasMfa,
            hasMfaUnknown: ra.hasMfaUnknown ?? false,
            hasAuditLogging: ra.hasAuditLogging,
            hasAuditLoggingUnknown: ra.hasAuditLoggingUnknown ?? false,
            hasPenTestReport: ra.hasPenTestReport,
            hasPenTestReportUnknown: ra.hasPenTestReportUnknown ?? false,
            hasDisasterRecovery: ra.hasDisasterRecovery,
            hasDisasterRecoveryUnknown: ra.hasDisasterRecoveryUnknown ?? false,
            hasSso: ra.hasSso,
            hasSsoUnknown: ra.hasSsoUnknown ?? false,
            hasSla: ra.hasSla,
            hasSlaUnknown: ra.hasSlaUnknown ?? false,
            slaDetails: ra.slaDetails,
            complianceCertifications: ra.complianceCertifications ?? [],
            mitigationPlan: ra.mitigationPlan,
            residualRiskNotes: ra.residualRiskNotes,
          },
        })
      }
    }

    // Auto-revoke existing approvals when content version changes
    if (hasActiveApprovals) {
      await tx.signOffApproval.updateMany({
        where: { signOffId, revokedAt: null, decision: 'APPROVED' },
        data: { revokedAt: now },
      })
    }
  })

  const hydrated = await getSignOffById(signOffId)
  if (!hydrated) throw new Error('Failed to update sign-off')
  return hydrated
}

// ---------------------------------------------------------------------------
// performAction
// ---------------------------------------------------------------------------

export async function performAction(
  signOffId: string,
  userId: string,
  action: SignOffAction,
  comment?: string,
): Promise<{ success: boolean; error?: string }> {
  const [signOff, user] = await Promise.all([
    getSignOffById(signOffId),
    getUserById(userId),
  ])

  if (!signOff) return { success: false, error: 'Sign-off not found' }
  if (!user) return { success: false, error: 'User not found' }

  // For submit action, check auto-approve logic
  if (action === 'submit') {
    return handleSubmit(signOff, user, comment)
  }

  const check = canPerformAction(user, signOff, action)
  if (!check.allowed) return { success: false, error: check.reason }

  const nextStatus = getNextStatus(signOff, action)
  const now = new Date()

  const prisma = await getPrisma()
  await prisma.$transaction(async (tx) => {
    // 1. Update sign-off status
    await tx.signOff.update({
      where: { id: signOffId },
      data: { status: nextStatus },
    })

    // 2. Create status history entry (skip if status unchanged)
    if (nextStatus !== signOff.status) {
      await tx.signOffStatusChange.create({
        data: {
          signOffId,
          fromStatus: signOff.status,
          toStatus: nextStatus,
          changedById: userId,
          reason: comment,
          createdAt: now,
        },
      })
    }

    // 3. Create approval record for approval/rejection/comment actions
    if (action === 'approve') {
      await tx.signOffApproval.create({
        data: {
          signOffId,
          approverId: userId,
          decision: 'APPROVED' as ApprovalDecision,
          comment,
          contentVersion: signOff.contentVersion,
          createdAt: now,
        },
      })
    }

    if (action === 'reject') {
      await tx.signOffApproval.create({
        data: {
          signOffId,
          approverId: userId,
          decision: 'REJECTED' as ApprovalDecision,
          comment,
          contentVersion: signOff.contentVersion,
          createdAt: now,
        },
      })
    }

    if (action === 'comment') {
      await tx.signOffApproval.create({
        data: {
          signOffId,
          approverId: userId,
          decision: 'HAS_COMMENTS' as ApprovalDecision,
          comment,
          contentVersion: signOff.contentVersion,
          createdAt: now,
        },
      })
    }

    // 4. Also create a visible comment for actions that include comment text
    if (comment && (action === 'comment' || action === 'reject')) {
      await tx.signOffComment.create({
        data: {
          signOffId,
          authorId: userId,
          content: comment,
          createdAt: now,
        },
      })
    }
  })

  return { success: true }
}

// ---------------------------------------------------------------------------
// handleSubmit (with auto-approve for submitter who is fixed approver)
// ---------------------------------------------------------------------------

async function handleSubmit(
  signOff: SignOffRequest,
  user: User,
  comment?: string,
): Promise<{ success: boolean; error?: string }> {
  const check = canPerformAction(user, signOff, 'submit')
  if (!check.allowed) return { success: false, error: check.reason }

  const now = new Date()
  const prisma = await getPrisma()

  await prisma.$transaction(async (tx) => {
    // Auto-approve if the submitter is a fixed approver
    const isAutoApproved = shouldAutoApprove(user.id, signOff.approvers)

    if (isAutoApproved) {
      await tx.signOffApproval.create({
        data: {
          signOffId: signOff.id,
          approverId: user.id,
          decision: 'APPROVED' as ApprovalDecision,
          comment: 'Auto-approved (submitter is a fixed approver)',
          contentVersion: signOff.contentVersion,
          createdAt: now,
        },
      })
    }

    // Determine if all approvers are now satisfied
    const activeApprovalCount = signOff.approvals.filter(
      (a) => a.decision === 'APPROVED' && !a.revokedAt,
    ).length + (isAutoApproved ? 1 : 0)
    const allApproved = activeApprovalCount >= signOff.approvers.length

    const nextStatus = allApproved ? 'APPROVED' : 'SUBMITTED'

    await tx.signOff.update({
      where: { id: signOff.id },
      data: { status: nextStatus },
    })

    await tx.signOffStatusChange.create({
      data: {
        signOffId: signOff.id,
        fromStatus: signOff.status,
        toStatus: nextStatus,
        changedById: user.id,
        reason: comment,
        createdAt: now,
      },
    })
  })

  return { success: true }
}

// ---------------------------------------------------------------------------
// addComment (general comment, not status-changing)
// ---------------------------------------------------------------------------

export async function addComment(
  signOffId: string,
  userId: string,
  content: string,
  parentId?: string,
): Promise<void> {
  const prisma = await getPrisma()
  await prisma.signOffComment.create({
    data: {
      signOffId,
      authorId: userId,
      content,
      parentId,
    },
  })
}

// ---------------------------------------------------------------------------
// addApprover
// ---------------------------------------------------------------------------

export async function addApprover(
  signOffId: string,
  approverUserId: string,
): Promise<void> {
  const prisma = await getPrisma()
  await prisma.signOffApprover.create({
    data: {
      signOffId,
      userId: approverUserId,
      isFixed: false,
    },
  })
}

// ---------------------------------------------------------------------------
// createRolloutFromTrial
// ---------------------------------------------------------------------------

export async function createRolloutFromTrial(
  trialSignOffId: string,
  userId: string,
): Promise<SignOffRequest> {
  const trial = await getSignOffById(trialSignOffId)
  if (!trial) throw new Error('Trial sign-off not found')
  if (trial.status !== 'APPROVED') throw new Error('Trial must be approved to create rollout')
  if (!trial.isTrial) throw new Error('Sign-off is not a trial')
  if (trial.trialOutcome && trial.trialOutcome !== 'PENDING') {
    throw new Error('Trial has already been resolved')
  }

  const prisma = await getPrisma()
  const fixedApprovers = await prisma.user.findMany({
    where: { isFixedApprover: true },
  })

  const now = new Date()

  const rollout = await prisma.$transaction(async (tx) => {
    const created = await tx.signOff.create({
      data: {
        status: 'DRAFT',
        title: `Rollout: ${trial.title}`,
        departmentId: trial.department.id,
        categories: trial.categories,
        vendorName: trial.vendorName,
        vendorWebsite: trial.vendorWebsite,
        description: trial.description,
        dueDiligence: trial.dueDiligence,
        rollOutPlan: trial.trialGoLiveRolloutPlan ?? trial.rollOutPlan,
        cost: trial.cost,
        isTrial: false,
        parentSignOffId: trialSignOffId,
        submittedById: userId,
        contentVersion: 1,
        statusHistory: {
          create: {
            fromStatus: null,
            toStatus: 'DRAFT',
            changedById: userId,
            createdAt: now,
          },
        },
      },
    })

    // Auto-assign fixed approvers
    if (fixedApprovers.length > 0) {
      await tx.signOffApprover.createMany({
        data: fixedApprovers.map((fa) => ({
          signOffId: created.id,
          userId: fa.id,
          isFixed: true,
        })),
      })
    }

    // Mark the trial as ROLLED_OUT
    await tx.signOff.update({
      where: { id: trialSignOffId },
      data: { trialOutcome: 'ROLLED_OUT' },
    })

    // Copy custom sections
    if (trial.customSections.length > 0) {
      await tx.signOffCustomSection.createMany({
        data: trial.customSections.map((s) => ({
          signOffId: created.id,
          title: s.title,
          content: s.content,
          sortOrder: s.sortOrder,
        })),
      })
    }

    // Copy supporting docs
    if (trial.supportingDocs.length > 0) {
      await tx.signOffSupportingDoc.createMany({
        data: trial.supportingDocs.map((d) => ({
          signOffId: created.id,
          title: d.title,
          url: d.url,
          addedById: userId,
        })),
      })
    }

    // Copy risk assessment
    if (trial.riskAssessment) {
      const ra = trial.riskAssessment
      await tx.riskAssessment.create({
        data: {
          signOffId: created.id,
          dataClassification: ra.dataClassification,
          dataClassificationUnknown: ra.dataClassificationUnknown,
          personalDataInvolved: ra.personalDataInvolved,
          personalDataInvolvedUnknown: ra.personalDataInvolvedUnknown,
          personalDataDetails: ra.personalDataDetails,
          dataStorageLocation: ra.dataStorageLocation,
          dataStorageLocationUnknown: ra.dataStorageLocationUnknown,
          thirdPartyDataSharing: ra.thirdPartyDataSharing,
          thirdPartyDataSharingUnknown: ra.thirdPartyDataSharingUnknown,
          thirdPartyDataDetails: ra.thirdPartyDataDetails,
          likelihoodOfBreach: ra.likelihoodOfBreach,
          likelihoodOfBreachUnknown: ra.likelihoodOfBreachUnknown,
          impactOfBreach: ra.impactOfBreach,
          impactOfBreachUnknown: ra.impactOfBreachUnknown,
          overallRiskScore: ra.overallRiskScore,
          hasEncryptionAtRest: ra.hasEncryptionAtRest,
          hasEncryptionAtRestUnknown: ra.hasEncryptionAtRestUnknown,
          hasEncryptionInTransit: ra.hasEncryptionInTransit,
          hasEncryptionInTransitUnknown: ra.hasEncryptionInTransitUnknown,
          hasMfa: ra.hasMfa,
          hasMfaUnknown: ra.hasMfaUnknown,
          hasAuditLogging: ra.hasAuditLogging,
          hasAuditLoggingUnknown: ra.hasAuditLoggingUnknown,
          hasPenTestReport: ra.hasPenTestReport,
          hasPenTestReportUnknown: ra.hasPenTestReportUnknown,
          hasDisasterRecovery: ra.hasDisasterRecovery,
          hasDisasterRecoveryUnknown: ra.hasDisasterRecoveryUnknown,
          hasSso: ra.hasSso,
          hasSsoUnknown: ra.hasSsoUnknown,
          hasSla: ra.hasSla,
          hasSlaUnknown: ra.hasSlaUnknown,
          slaDetails: ra.slaDetails,
          complianceCertifications: ra.complianceCertifications,
          mitigationPlan: ra.mitigationPlan,
          residualRiskNotes: ra.residualRiskNotes,
          dataPrivacyNA: ra.dataPrivacyNA ?? false,
          riskScoringNA: ra.riskScoringNA ?? false,
          controlsNA: ra.controlsNA ?? false,
        },
      })
    }

    return created
  })

  const hydrated = await getSignOffById(rollout.id)
  if (!hydrated) throw new Error('Failed to create rollout sign-off')
  return hydrated
}

// ---------------------------------------------------------------------------
// closeTrialSignOff
// ---------------------------------------------------------------------------

export async function closeTrialSignOff(
  signOffId: string,
  userId: string,
  reason: string,
): Promise<void> {
  const [signOff, user] = await Promise.all([
    getSignOffById(signOffId),
    getUserById(userId),
  ])

  if (!signOff) throw new Error('Sign-off not found')
  if (!user) throw new Error('User not found')
  if (signOff.status !== 'APPROVED') throw new Error('Sign-off must be approved')
  if (!signOff.isTrial) throw new Error('Sign-off is not a trial')
  if (signOff.trialOutcome && signOff.trialOutcome !== 'PENDING') {
    throw new Error('Trial has already been resolved')
  }

  // Permission: submitter or admin (APPROVER/COUNCIL_MEMBER)
  const isSubmitter = signOff.submittedBy.id === userId
  const isAdmin = user.role === 'APPROVER' || user.role === 'COUNCIL_MEMBER'
  if (!isSubmitter && !isAdmin) {
    throw new Error('Only the submitter or an admin can close a trial')
  }

  const now = new Date()
  const prisma = await getPrisma()

  await prisma.$transaction(async (tx) => {
    await tx.signOff.update({
      where: { id: signOffId },
      data: {
        trialOutcome: 'CLOSED',
        trialClosureReason: reason,
        trialClosedAt: now,
      },
    })

    await tx.signOffStatusChange.create({
      data: {
        signOffId,
        fromStatus: 'APPROVED',
        toStatus: 'APPROVED',
        changedById: userId,
        reason: `Trial closed: ${reason}`,
        createdAt: now,
      },
    })
  })
}

// ---------------------------------------------------------------------------
// extendTrial
// ---------------------------------------------------------------------------

export async function extendTrial(
  signOffId: string,
  userId: string,
  newEndDate: string,
  reason: string,
): Promise<void> {
  const [signOff, user] = await Promise.all([
    getSignOffById(signOffId),
    getUserById(userId),
  ])

  if (!signOff) throw new Error('Sign-off not found')
  if (!user) throw new Error('User not found')
  if (signOff.status !== 'APPROVED') throw new Error('Sign-off must be approved')
  if (!signOff.isTrial) throw new Error('Sign-off is not a trial')
  if (signOff.trialOutcome && signOff.trialOutcome !== 'PENDING') {
    throw new Error('Trial has already been resolved')
  }

  const parsedNewEndDate = new Date(newEndDate)
  if (signOff.trialEndDate && parsedNewEndDate <= new Date(signOff.trialEndDate)) {
    throw new Error('New end date must be after the current trial end date')
  }

  // Permission: submitter or admin (APPROVER/COUNCIL_MEMBER)
  const isSubmitter = signOff.submittedBy.id === userId
  const isAdmin = user.role === 'APPROVER' || user.role === 'COUNCIL_MEMBER'
  if (!isSubmitter && !isAdmin) {
    throw new Error('Only the submitter or an admin can extend a trial')
  }

  const now = new Date()
  const prisma = await getPrisma()
  const formattedDate = parsedNewEndDate.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  await prisma.$transaction(async (tx) => {
    await tx.signOff.update({
      where: { id: signOffId },
      data: { trialEndDate: parsedNewEndDate },
    })

    await tx.signOffStatusChange.create({
      data: {
        signOffId,
        fromStatus: 'APPROVED',
        toStatus: 'APPROVED',
        changedById: userId,
        reason: `Trial extended to ${formattedDate}: ${reason}`,
        createdAt: now,
      },
    })
  })
}

// ---------------------------------------------------------------------------
// Department CRUD
// ---------------------------------------------------------------------------

export async function createDepartment(input: {
  name: string
  slug: string
}): Promise<Department> {
  const prisma = await getPrisma()
  const id = `dept-${input.slug}`
  const department = await prisma.department.create({
    data: { id, name: input.name, slug: input.slug },
  })
  return mapDepartment(department)
}

export async function updateDepartment(
  id: string,
  input: { name?: string; slug?: string },
): Promise<Department> {
  const prisma = await getPrisma()
  const department = await prisma.department.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.slug !== undefined ? { slug: input.slug } : {}),
    },
  })
  return mapDepartment(department)
}

export async function archiveDepartment(id: string): Promise<void> {
  const prisma = await getPrisma()
  await prisma.department.update({
    where: { id },
    data: { archivedAt: new Date() },
  })
}

export async function unarchiveDepartment(id: string): Promise<void> {
  const prisma = await getPrisma()
  await prisma.department.update({
    where: { id },
    data: { archivedAt: null },
  })
}

// ---------------------------------------------------------------------------
// User CRUD
// ---------------------------------------------------------------------------

export async function createUser(input: {
  name: string
  email: string
  role?: string
  isFixedApprover?: boolean
  departmentId?: string
}): Promise<User> {
  const prisma = await getPrisma()
  const slug = input.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  const id = `user-${slug}`
  const user = await prisma.user.create({
    data: {
      id,
      name: input.name,
      email: input.email,
      role: (input.role as 'APPROVER' | 'COUNCIL_MEMBER' | 'STAFF_MEMBER') ?? 'STAFF_MEMBER',
      isFixedApprover: input.isFixedApprover ?? false,
      departmentId: input.departmentId,
    },
  })
  return mapUser(user)
}

export async function updateUser(
  id: string,
  input: {
    name?: string
    email?: string
    role?: string
    isFixedApprover?: boolean
    departmentId?: string | null
  },
): Promise<User> {
  const prisma = await getPrisma()
  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.email !== undefined ? { email: input.email } : {}),
      ...(input.role !== undefined
        ? { role: input.role as 'APPROVER' | 'COUNCIL_MEMBER' | 'STAFF_MEMBER' }
        : {}),
      ...(input.isFixedApprover !== undefined ? { isFixedApprover: input.isFixedApprover } : {}),
      ...(input.departmentId !== undefined ? { departmentId: input.departmentId } : {}),
    },
  })
  return mapUser(user)
}

export async function deleteUser(id: string): Promise<void> {
  const prisma = await getPrisma()
  await prisma.user.delete({ where: { id } })
}

// ---------------------------------------------------------------------------
// Admin Audit Log
// ---------------------------------------------------------------------------

export async function createAuditLog(input: {
  action: string
  targetType: string
  targetId: string
  performedById: string
  previousValue?: unknown
  newValue?: unknown
}): Promise<void> {
  const prisma = await getPrisma()
  await prisma.adminAuditLog.create({
    data: {
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      performedById: input.performedById,
      previousValue: input.previousValue ? JSON.parse(JSON.stringify(input.previousValue)) : undefined,
      newValue: input.newValue ? JSON.parse(JSON.stringify(input.newValue)) : undefined,
    },
  })
}
