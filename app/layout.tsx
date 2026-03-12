export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { AppProviders } from '@/providers/app-providers'
import { getUsers, getDepartments, getSignOffSummaries } from '@/lib/db/queries'
import { getAuthenticatedUser } from '@/lib/auth'
import { createUser } from '@/lib/db/mutations'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Security Approvals',
  description: 'Security sign-off management for Equals',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [initialUsers, departments, signOffs, authenticatedUser] = await Promise.all([
    getUsers(),
    getDepartments(),
    getSignOffSummaries(),
    getAuthenticatedUser(),
  ])

  let users = initialUsers
  const authenticatedEmail = authenticatedUser?.email ?? null

  if (authenticatedUser) {
    const isExistingUser = users.some(
      (u) => u.email.toLowerCase() === authenticatedUser.email.toLowerCase(),
    )

    if (!isExistingUser) {
      const newUser = await createUser({
        name: authenticatedUser.name,
        email: authenticatedUser.email,
      })
      users = [...users, newUser]
    }
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased flex min-h-screen flex-col`}>
        <AppProviders
          initialUsers={users}
          initialDepartments={departments}
          initialSignOffs={signOffs}
          authenticatedEmail={authenticatedEmail}
        >
          {children}
        </AppProviders>
      </body>
    </html>
  )
}
