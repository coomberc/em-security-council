'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
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
  const [signOffs] = useState<SignOffSummary[]>(initialSignOffs)
  const router = useRouter()

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
