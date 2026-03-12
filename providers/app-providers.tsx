'use client'

import { Suspense, type ReactNode } from 'react'
import { ThemeProvider } from 'next-themes'
import type { User, Department, SignOffSummary } from '@/types'
import { UserProvider } from '@/providers/user-provider'
import { DepartmentsProvider } from '@/providers/departments-provider'
import { SignOffsProvider } from '@/providers/sign-offs-provider'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'
import { Header } from '@/components/layout/header'

interface AppProvidersProps {
  children: ReactNode
  initialUsers: User[]
  initialDepartments: Department[]
  initialSignOffs: SignOffSummary[]
  authenticatedEmail: string | null
}

export function AppProviders({
  children,
  initialUsers,
  initialDepartments,
  initialSignOffs,
  authenticatedEmail,
}: AppProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <Suspense>
        <UserProvider users={initialUsers} authenticatedEmail={authenticatedEmail}>
          <DepartmentsProvider departments={initialDepartments}>
            <SignOffsProvider initialSignOffs={initialSignOffs}>
              <TooltipProvider>
                <Header />
                <main className="flex-1 p-4 md:p-6">{children}</main>
                <Toaster />
              </TooltipProvider>
            </SignOffsProvider>
          </DepartmentsProvider>
        </UserProvider>
      </Suspense>
    </ThemeProvider>
  )
}
