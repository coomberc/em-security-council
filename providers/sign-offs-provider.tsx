'use client'

import { createContext, useContext, useCallback, useMemo, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useCurrentUser } from '@/providers/user-provider'
import type { SignOffSummary } from '@/types'

interface SignOffsContextValue {
  signOffs: SignOffSummary[]
  refresh: () => void
}

const SignOffsContext = createContext<SignOffsContextValue | null>(null)

interface SignOffsProviderProps {
  children: ReactNode
  initialSignOffs: SignOffSummary[]
}

export function SignOffsProvider({ children, initialSignOffs }: SignOffsProviderProps) {
  const router = useRouter()
  const { currentUser } = useCurrentUser()

  const signOffs = useMemo(() => {
    // Staff members can only see their own sign-offs
    if (currentUser.role === 'STAFF_MEMBER') {
      return initialSignOffs.filter((s) => s.submittedBy.id === currentUser.id)
    }
    // Council members and approvers see all
    return initialSignOffs
  }, [initialSignOffs, currentUser.id, currentUser.role])

  const refresh = useCallback(() => {
    router.refresh()
  }, [router])

  return (
    <SignOffsContext.Provider value={{ signOffs, refresh }}>
      {children}
    </SignOffsContext.Provider>
  )
}

export function useSignOffs(): SignOffsContextValue {
  const context = useContext(SignOffsContext)
  if (!context) {
    throw new Error('useSignOffs must be used within a SignOffsProvider')
  }
  return context
}
