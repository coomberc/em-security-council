import { getSlackClient } from '@/lib/slack/client'

const emailToSlackId = new Map<string, string | null>()

/**
 * Looks up a Slack user ID by email address. Results are cached for the
 * lifetime of the process to avoid repeated API calls.
 */
export async function lookupSlackUserId(email: string): Promise<string | null> {
  if (emailToSlackId.has(email)) return emailToSlackId.get(email) ?? null

  try {
    const slack = await getSlackClient()
    const result = await slack.users.lookupByEmail({ email })
    const userId = result.user?.id ?? null
    emailToSlackId.set(email, userId)
    return userId
  } catch (error) {
    // users.lookupByEmail throws if the user is not found
    console.warn(`[Slack] Could not resolve Slack user for email: ${email}`, error)
    emailToSlackId.set(email, null)
    return null
  }
}
