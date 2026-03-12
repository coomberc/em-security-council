import { headers } from 'next/headers'
import { getUsers } from '@/lib/db/queries'

export interface AuthenticatedUser {
  email: string
  name: string
}

export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  const headersList = await headers()
  const oidcData = headersList.get('x-amzn-oidc-data')
  if (!oidcData) return null

  try {
    const payload = oidcData.split('.')[1]
    const decoded = JSON.parse(Buffer.from(payload, 'base64').toString())

    const email: string | undefined = decoded.email
    if (!email) return null

    const name =
      decoded.name ??
      ([decoded.given_name, decoded.family_name].filter(Boolean).join(' ') ||
      email.split('@')[0])

    return { email, name }
  } catch {
    return null
  }
}

/**
 * Resolves the real acting user ID from the OIDC header.
 * In production: ignores the client-supplied userId and uses the authenticated identity.
 * In local dev (no OIDC header): falls back to the client-supplied userId.
 */
export async function resolveActingUserId(clientUserId: string): Promise<string> {
  const authedUser = await getAuthenticatedUser()

  // Local dev — no OIDC header, trust the client (user-switcher)
  if (!authedUser) return clientUserId

  const users = await getUsers()
  const caller = users.find(
    (u) => u.email.toLowerCase() === authedUser.email.toLowerCase(),
  )

  if (!caller) {
    throw new Error(`Authenticated user not found: ${authedUser.email}`)
  }

  return caller.id
}
