import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/db'
import { formatSequenceNumber } from '@/lib/format'
import { CATEGORY_LABELS, STATUS_LABELS } from '@/lib/constants'
import type { SignOffStatus, SignOffCategory } from '@/types'

function escapeCsv(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function toCsvRow(values: string[]): string {
  return values.map(escapeCsv).join(',')
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl

  const status = searchParams.get('status') as SignOffStatus | null
  const category = searchParams.get('category') as SignOffCategory | null
  const department = searchParams.get('department')
  const dateFrom = searchParams.get('dateFrom')
  const dateTo = searchParams.get('dateTo')

  const prisma = await getPrisma()

  const where: Record<string, unknown> = {}

  if (status) {
    where.status = status
  }
  if (category) {
    where.categories = { has: category }
  }
  if (department) {
    where.departmentId = department
  }
  if (dateFrom || dateTo) {
    where.createdAt = {
      ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
      ...(dateTo ? { lte: new Date(dateTo) } : {}),
    }
  }

  const signOffs = await prisma.signOff.findMany({
    where,
    include: {
      submittedBy: { select: { name: true } },
      department: { select: { name: true } },
      riskAssessment: { select: { overallRiskScore: true } },
    },
    orderBy: { sequenceNumber: 'desc' },
  })

  const headers = [
    'Sequence',
    'Title',
    'Department',
    'Categories',
    'Status',
    'Submitted By',
    'Created',
    'Risk Score',
  ]

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = signOffs.map((so: any) =>
    toCsvRow([
      formatSequenceNumber(so.sequenceNumber),
      so.title,
      so.department.name,
      so.categories.map((c: string) => CATEGORY_LABELS[c as SignOffCategory] ?? c).join('; '),
      STATUS_LABELS[so.status] ?? so.status,
      so.submittedBy.name,
      so.createdAt.toISOString().split('T')[0],
      so.riskAssessment?.overallRiskScore?.toString() ?? '',
    ]),
  )

  const csv = [toCsvRow(headers), ...rows].join('\n')

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="security-approvals-export-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  })
}
