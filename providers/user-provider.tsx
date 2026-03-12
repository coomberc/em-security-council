'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'
import { useSearchParams } from 'next/navigation'
import { User } from '@/types'

interface UserContextValue {
  currentUser: User
  setCurrentUser: (user: User) => void
  allUsers: User[]
  authenticatedEmail: string | null
}

const UserContext = createContext<UserContextValue | null>(null)

interface UserProviderProps {
  children: ReactNode
  users: User[]
  authenticatedEmail: string | null
}

function getInitialUser(users: User[], searchParams: URLSearchParams, authenticatedEmail: string | null): User {
  if (authenticatedEmail) {
    const found = users.find((u) => u.email.toLowerCase() === authenticatedEmail.toLowerCase())
    if (found) return found
    throw new Error(`Authenticated user not found in users list: ${authenticatedEmail}`)
  }
  const userParam = searchParams.get('user')
  if (userParam) {
    const found = users.find((u) => u.id === userParam)
    if (found) return found
  }
  return users[0]
}

export function UserProvider({ children, users, authenticatedEmail }: UserProviderProps) {
  const searchParams = useSearchParams()
  const [currentUser, setCurrentUser] = useState<User>(() => getInitialUser(users, searchParams, authenticatedEmail))

  return (
    <UserContext.Provider value={{ currentUser, setCurrentUser, allUsers: users, authenticatedEmail }}>
      {children}
    </UserContext.Provider>
  )
}

export function useCurrentUser(): UserContextValue {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useCurrentUser must be used within a UserProvider')
  }
  return context
}
