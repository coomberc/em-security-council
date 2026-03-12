import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager'

const SECRET_NAME = 'em-security-council/prod'

let cached: Record<string, string> | null = null

async function fetchSecrets(): Promise<Record<string, string>> {
  if (cached) return cached

  const client = new SecretsManagerClient({ region: process.env.AWS_REGION ?? 'eu-west-2' })
  const res = await client.send(
    new GetSecretValueCommand({ SecretId: SECRET_NAME }),
  )

  if (!res.SecretString) {
    throw new Error(`Secret ${SECRET_NAME} has no string value`)
  }

  cached = JSON.parse(res.SecretString)
  return cached!
}

export async function getSecret(key: string): Promise<string | undefined> {
  if (process.env.NODE_ENV !== 'production') {
    return process.env[key]
  }

  const secrets = await fetchSecrets()
  return secrets[key]
}
