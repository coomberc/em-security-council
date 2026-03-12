import pg from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/lib/generated/prisma/client'
import { getSecret } from '@/lib/secrets'

const globalForPrisma = globalThis as unknown as { prisma: InstanceType<typeof PrismaClient> }

let prismaInstance: InstanceType<typeof PrismaClient> | null = null

export async function getPrisma(): Promise<InstanceType<typeof PrismaClient>> {
  if (globalForPrisma.prisma) return globalForPrisma.prisma
  if (prismaInstance) return prismaInstance

  const url = await getSecret('DATABASE_URL')
  const pool = new pg.Pool({ connectionString: url })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adapter = new PrismaPg(pool as any)
  prismaInstance = new PrismaClient({ adapter })

  if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prismaInstance

  return prismaInstance
}
