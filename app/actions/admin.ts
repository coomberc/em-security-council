'use server'

import { revalidatePath } from 'next/cache'
import {
  createDepartment as dbCreateDepartment,
  updateDepartment as dbUpdateDepartment,
  archiveDepartment as dbArchiveDepartment,
  unarchiveDepartment as dbUnarchiveDepartment,
  createUser as dbCreateUser,
  updateUser as dbUpdateUser,
  deleteUser as dbDeleteUser,
  createAuditLog,
} from '@/lib/db/mutations'
import { getAuthenticatedUser } from '@/lib/auth'
import { getUsers } from '@/lib/db/queries'

// ---------------------------------------------------------------------------
// Authorisation
// ---------------------------------------------------------------------------

async function assertAdminRole(): Promise<string | undefined> {
  const authedUser = await getAuthenticatedUser()

  // In local dev (no OIDC header), skip the check
  if (!authedUser) return undefined

  const users = await getUsers()
  const caller = users.find(
    (u) => u.email.toLowerCase() === authedUser.email.toLowerCase(),
  )

  if (!caller || (caller.role !== 'APPROVER' && caller.role !== 'COUNCIL_MEMBER')) {
    throw new Error('Forbidden: only approvers and council members can perform admin actions')
  }

  return caller.id
}

// ---------------------------------------------------------------------------
// Department actions
// ---------------------------------------------------------------------------

export async function createDepartmentAction(input: {
  name: string
  slug: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const performedById = await assertAdminRole()
    const dept = await dbCreateDepartment(input)

    if (performedById) {
      await createAuditLog({
        action: 'CREATE_DEPARTMENT',
        targetType: 'Department',
        targetId: dept.id,
        performedById,
        newValue: input,
      })
    }

    revalidatePath('/admin/departments')
    revalidatePath('/sign-offs')
    return { success: true }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

export async function updateDepartmentAction(
  id: string,
  input: { name?: string; slug?: string },
): Promise<{ success: boolean; error?: string }> {
  try {
    const performedById = await assertAdminRole()
    await dbUpdateDepartment(id, input)

    if (performedById) {
      await createAuditLog({
        action: 'UPDATE_DEPARTMENT',
        targetType: 'Department',
        targetId: id,
        performedById,
        newValue: input,
      })
    }

    revalidatePath('/admin/departments')
    revalidatePath('/sign-offs')
    return { success: true }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

export async function archiveDepartmentAction(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const performedById = await assertAdminRole()
    await dbArchiveDepartment(id)

    if (performedById) {
      await createAuditLog({
        action: 'ARCHIVE_DEPARTMENT',
        targetType: 'Department',
        targetId: id,
        performedById,
      })
    }

    revalidatePath('/admin/departments')
    revalidatePath('/sign-offs')
    return { success: true }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

export async function unarchiveDepartmentAction(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const performedById = await assertAdminRole()
    await dbUnarchiveDepartment(id)

    if (performedById) {
      await createAuditLog({
        action: 'UNARCHIVE_DEPARTMENT',
        targetType: 'Department',
        targetId: id,
        performedById,
      })
    }

    revalidatePath('/admin/departments')
    revalidatePath('/sign-offs')
    return { success: true }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

// ---------------------------------------------------------------------------
// User actions
// ---------------------------------------------------------------------------

export async function createUserAction(input: {
  name: string
  email: string
  role: string
  isFixedApprover: boolean
  departmentId?: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const performedById = await assertAdminRole()
    const user = await dbCreateUser(input)

    if (performedById) {
      await createAuditLog({
        action: 'CREATE_USER',
        targetType: 'User',
        targetId: user.id,
        performedById,
        newValue: input,
      })
    }

    revalidatePath('/admin/users')
    revalidatePath('/sign-offs')
    return { success: true }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

export async function updateUserAction(
  id: string,
  input: {
    name?: string
    email?: string
    role?: string
    isFixedApprover?: boolean
    departmentId?: string | null
  },
): Promise<{ success: boolean; error?: string }> {
  try {
    const performedById = await assertAdminRole()
    await dbUpdateUser(id, input)

    if (performedById) {
      await createAuditLog({
        action: 'UPDATE_USER',
        targetType: 'User',
        targetId: id,
        performedById,
        newValue: input,
      })
    }

    revalidatePath('/admin/users')
    revalidatePath('/sign-offs')
    return { success: true }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

export async function deleteUserAction(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const performedById = await assertAdminRole()

    if (performedById) {
      await createAuditLog({
        action: 'DELETE_USER',
        targetType: 'User',
        targetId: id,
        performedById,
      })
    }

    await dbDeleteUser(id)
    revalidatePath('/admin/users')
    revalidatePath('/sign-offs')
    return { success: true }
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}
