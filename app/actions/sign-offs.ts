'use server'

import { revalidatePath } from 'next/cache'
import {
  createSignOff as dbCreateSignOff,
  updateSignOff as dbUpdateSignOff,
  performAction as dbPerformAction,
  addComment as dbAddComment,
  addApprover as dbAddApprover,
  createRolloutFromTrial as dbCreateRolloutFromTrial,
  closeTrialSignOff as dbCloseTrialSignOff,
  extendTrial as dbExtendTrial,
} from '@/lib/db/mutations'
import { getSignOffById } from '@/lib/db/queries'
import { resolveActingUserId } from '@/lib/auth'
import type {
  CreateSignOffInput,
  UpdateSignOffInput,
  SignOffAction,
  SignOffRequest,
} from '@/types'

export async function fetchSignOffAction(
  id: string,
): Promise<SignOffRequest | null> {
  return getSignOffById(id)
}

export async function createSignOffAction(
  input: CreateSignOffInput,
  userId: string,
): Promise<{ success: boolean; signOff?: SignOffRequest; error?: string }> {
  try {
    const actingUserId = await resolveActingUserId(userId)
    const signOff = await dbCreateSignOff(input, actingUserId)
    revalidatePath('/sign-offs')
    return { success: true, signOff }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

export async function updateSignOffAction(
  signOffId: string,
  input: UpdateSignOffInput,
  userId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const actingUserId = await resolveActingUserId(userId)
    await dbUpdateSignOff(signOffId, input, actingUserId)
    revalidatePath('/sign-offs')
    revalidatePath(`/sign-offs/${signOffId}`)
    return { success: true }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

export async function performSignOffAction(
  signOffId: string,
  userId: string,
  action: SignOffAction,
  comment?: string,
): Promise<{ success: boolean; error?: string }> {
  const actingUserId = await resolveActingUserId(userId)
  const result = await dbPerformAction(signOffId, actingUserId, action, comment)
  if (result.success) {
    revalidatePath('/sign-offs')
    revalidatePath(`/sign-offs/${signOffId}`)
  }
  return result
}

export async function addCommentAction(
  signOffId: string,
  userId: string,
  content: string,
  parentId?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const actingUserId = await resolveActingUserId(userId)
    await dbAddComment(signOffId, actingUserId, content, parentId)
    revalidatePath(`/sign-offs/${signOffId}`)
    return { success: true }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

export async function addApproverAction(
  signOffId: string,
  approverUserId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await dbAddApprover(signOffId, approverUserId)
    revalidatePath(`/sign-offs/${signOffId}`)
    return { success: true }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

export async function createRolloutAction(
  trialSignOffId: string,
  userId: string,
): Promise<{ success: boolean; signOff?: SignOffRequest; error?: string }> {
  try {
    const actingUserId = await resolveActingUserId(userId)
    const signOff = await dbCreateRolloutFromTrial(trialSignOffId, actingUserId)
    revalidatePath('/sign-offs')
    return { success: true, signOff }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

export async function closeTrialAction(
  signOffId: string,
  userId: string,
  reason: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const actingUserId = await resolveActingUserId(userId)
    await dbCloseTrialSignOff(signOffId, actingUserId, reason)
    revalidatePath('/sign-offs')
    revalidatePath(`/sign-offs/${signOffId}`)
    return { success: true }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

export async function extendTrialAction(
  signOffId: string,
  userId: string,
  newEndDate: string,
  reason: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const actingUserId = await resolveActingUserId(userId)
    await dbExtendTrial(signOffId, actingUserId, newEndDate, reason)
    revalidatePath('/sign-offs')
    revalidatePath(`/sign-offs/${signOffId}`)
    return { success: true }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}
