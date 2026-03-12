import { WebClient } from '@slack/web-api'
import { getSecret } from '@/lib/secrets'

let client: WebClient | null = null

export async function getSlackClient(): Promise<WebClient> {
  if (client) return client
  const token = await getSecret('SLACK_BOT_TOKEN')
  client = new WebClient(token)
  return client
}
