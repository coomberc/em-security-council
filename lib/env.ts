import { z } from 'zod'

const envSchema = z.object({
  SLACK_CHANNEL_ID: z.string().min(1).optional(),
  APP_BASE_URL: z.string().url().default('http://localhost:3000'),
})

function parseEnv() {
  const result = envSchema.safeParse(process.env)
  if (!result.success) {
    const formatted = result.error.issues
      .map((i) => `  ${i.path.join('.')}: ${i.message}`)
      .join('\n')
    throw new Error(`Missing or invalid environment variables:\n${formatted}`)
  }
  return result.data
}

export const env = parseEnv()
