import { getPrisma } from '@/lib/db'
import { computeRiskScore } from '@/lib/constants'
import { CATEGORY_LABELS, DATA_CLASSIFICATION_LABELS } from '@/lib/constants'
import {
  computeCycleTimeDays,
  median,
  percentile,
  getWeekStart,
  getResponseHours,
  round,
} from '@/lib/analytics/compute'
import type {
  DateRange,
  AnalyticsData,
  OverviewData,
  OverviewMetrics,
  WeeklySignOffCounts,
  CycleTimeTrend,
  SubmitterEntry,
  ApprovalsData,
  ApprovalMetrics,
  ApproverWorkload,
  ApproverResponseTime,
  ApproverCommentCount,
  DepartmentsData,
  DepartmentMetrics,
  DepartmentComparisonRow,
  RiskData,
  RiskMetrics,
  CategoryDistributionRow,
  DataClassificationRow,
  StatusChangeRecord,
} from '@/lib/analytics/types'
import type { SignOffStatus, SignOffCategory } from '@/types'

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export async function getAnalyticsData(
  dateRange: DateRange,
): Promise<AnalyticsData> {
  const prisma = await getPrisma()

  // Previous period for trend comparisons (same duration, immediately before)
  const durationMs = dateRange.to.getTime() - dateRange.from.getTime()
  const previousRange: DateRange = {
    from: new Date(dateRange.from.getTime() - durationMs),
    to: new Date(dateRange.from.getTime()),
  }

  const [signOffs, previousSignOffs, departments] = await Promise.all([
    prisma.signOff.findMany({
      where: { createdAt: { gte: dateRange.from, lte: dateRange.to } },
      include: {
        submittedBy: true,
        department: true,
        approvals: { include: { approver: true }, orderBy: { createdAt: 'asc' } },
        comments: { include: { author: true }, orderBy: { createdAt: 'asc' } },
        statusHistory: { include: { changedBy: true }, orderBy: { createdAt: 'asc' } },
        riskAssessment: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.signOff.findMany({
      where: { createdAt: { gte: previousRange.from, lte: previousRange.to } },
      include: {
        department: true,
        approvals: { include: { approver: true } },
        statusHistory: { orderBy: { createdAt: 'asc' } },
        riskAssessment: true,
      },
    }),
    prisma.department.findMany({ where: { archivedAt: null }, orderBy: { name: 'asc' } }),
  ])

  const overview = buildOverviewData(signOffs, previousSignOffs, dateRange)
  const approvals = buildApprovalsData(signOffs, previousSignOffs)
  const departmentsData = buildDepartmentsData(signOffs, departments)
  const risk = buildRiskData(signOffs)

  return { overview, approvals, departments: departmentsData, risk }
}

// ---------------------------------------------------------------------------
// Types for Prisma results
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SignOffWithRelations = any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PreviousSignOff = any

// ---------------------------------------------------------------------------
// Overview tab
// ---------------------------------------------------------------------------

function buildOverviewData(
  signOffs: SignOffWithRelations[],
  previousSignOffs: PreviousSignOff[],
  dateRange: DateRange,
): OverviewData {
  const cycleTimes = signOffs
    .map((r: SignOffWithRelations) => computeCycleTimeDays(mapStatusChanges(r.statusHistory)))
    .filter((ct: number | null): ct is number => ct !== null)

  const prevCycleTimes = previousSignOffs
    .map((r: PreviousSignOff) => computeCycleTimeDays(mapStatusChanges(r.statusHistory)))
    .filter((ct: number | null): ct is number => ct !== null)

  const approvedCount = signOffs.filter((r: SignOffWithRelations) => r.status === 'APPROVED').length
  const prevApprovedCount = previousSignOffs.filter((r: PreviousSignOff) => r.status === 'APPROVED').length

  const terminalCurrent = signOffs.filter((r: SignOffWithRelations) =>
    ['APPROVED', 'REJECTED', 'WITHDRAWN'].includes(r.status),
  ).length
  const terminalPrev = previousSignOffs.filter((r: PreviousSignOff) =>
    ['APPROVED', 'REJECTED', 'WITHDRAWN'].includes(r.status),
  ).length

  const activeInPipeline = signOffs.filter((r: SignOffWithRelations) =>
    ['SUBMITTED', 'HAS_COMMENTS'].includes(r.status),
  ).length

  const trialCount = signOffs.filter((r: SignOffWithRelations) => r.isTrial).length
  const prevTrialCount = previousSignOffs.filter((r: PreviousSignOff) => r.isTrial).length

  const metrics: OverviewMetrics = {
    totalSignOffs: signOffs.length,
    avgCycleTimeDays: cycleTimes.length > 0 ? round(avg(cycleTimes)) : 0,
    approvalRate: terminalCurrent > 0 ? round((approvedCount / terminalCurrent) * 100) : 0,
    activeInPipeline,
    trialRate: signOffs.length > 0 ? round((trialCount / signOffs.length) * 100) : 0,
    previousTotalSignOffs: previousSignOffs.length,
    previousAvgCycleTimeDays: prevCycleTimes.length > 0 ? round(avg(prevCycleTimes)) : 0,
    previousApprovalRate: terminalPrev > 0 ? round((prevApprovedCount / terminalPrev) * 100) : 0,
    previousTrialRate: previousSignOffs.length > 0
      ? round((prevTrialCount / previousSignOffs.length) * 100)
      : 0,
  }

  const velocity = buildWeeklyVelocity(signOffs)
  const cycleTimeTrend = buildCycleTimeTrend(signOffs)
  const topSubmitters = buildTopSubmitters(signOffs)

  return { metrics, velocity, cycleTimeTrend, topSubmitters }
}

function buildWeeklyVelocity(signOffs: SignOffWithRelations[]): WeeklySignOffCounts[] {
  const weeks = new Map<string, WeeklySignOffCounts>()

  for (const r of signOffs) {
    const week = getWeekStart(r.createdAt.toISOString())
    if (!weeks.has(week)) {
      weeks.set(week, { week, approved: 0, rejected: 0, withdrawn: 0, pending: 0 })
    }
    const entry = weeks.get(week)!
    if (r.status === 'APPROVED') entry.approved++
    else if (r.status === 'REJECTED') entry.rejected++
    else if (r.status === 'WITHDRAWN') entry.withdrawn++
    else entry.pending++
  }

  return [...weeks.values()].sort((a, b) => a.week.localeCompare(b.week))
}

function buildCycleTimeTrend(signOffs: SignOffWithRelations[]): CycleTimeTrend[] {
  const weeks = new Map<string, number[]>()

  for (const r of signOffs) {
    const ct = computeCycleTimeDays(mapStatusChanges(r.statusHistory))
    if (ct === null) continue
    const week = getWeekStart(r.createdAt.toISOString())
    if (!weeks.has(week)) weeks.set(week, [])
    weeks.get(week)!.push(ct)
  }

  return [...weeks.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, values]) => {
      const sorted = [...values].sort((a, b) => a - b)
      return {
        week,
        avgDays: round(avg(values)),
        medianDays: round(median(values)),
        p90Days: round(percentile(sorted, 90)),
      }
    })
}

function buildTopSubmitters(signOffs: SignOffWithRelations[]): SubmitterEntry[] {
  const counts = new Map<string, { name: string; count: number }>()
  for (const r of signOffs) {
    const name = r.submittedBy.name
    if (!counts.has(name)) counts.set(name, { name, count: 0 })
    counts.get(name)!.count++
  }
  return [...counts.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
}

// ---------------------------------------------------------------------------
// Approvals tab
// ---------------------------------------------------------------------------

function buildApprovalsData(
  signOffs: SignOffWithRelations[],
  previousSignOffs: PreviousSignOff[],
): ApprovalsData {
  const queueDepth = signOffs.filter((r: SignOffWithRelations) =>
    r.status === 'SUBMITTED' || r.status === 'HAS_COMMENTS',
  ).length

  // All approval decisions in this period
  const allApprovals = signOffs.flatMap((r: SignOffWithRelations) => r.approvals)
  const prevApprovals = previousSignOffs.flatMap((r: PreviousSignOff) => r.approvals)

  // Response times
  const responseTimes: number[] = []
  for (const r of signOffs) {
    const hours = getResponseHours(mapStatusChanges(r.statusHistory))
    if (hours !== null && hours > 0) responseTimes.push(hours)
  }
  const prevResponseTimes: number[] = []
  for (const r of previousSignOffs) {
    const hours = getResponseHours(mapStatusChanges(r.statusHistory))
    if (hours !== null && hours > 0) prevResponseTimes.push(hours)
  }

  const approverIds = new Set(allApprovals.map((a: { approverId: string }) => a.approverId))

  const decisionsCount = allApprovals.length
  const prevDecisionsCount = prevApprovals.length

  const metrics: ApprovalMetrics = {
    queueDepth,
    avgResponseTimeHours: responseTimes.length > 0 ? round(avg(responseTimes)) : 0,
    decisionsThisPeriod: decisionsCount,
    activeApprovers: approverIds.size,
    previousAvgResponseTimeHours: prevResponseTimes.length > 0 ? round(avg(prevResponseTimes)) : 0,
    previousDecisionsThisPeriod: prevDecisionsCount,
  }

  // Per-approver workload
  const approverMap = new Map<string, { name: string; approvals: number; rejections: number; comments: number }>()
  for (const a of allApprovals) {
    const name = a.approver.name
    if (!approverMap.has(name)) {
      approverMap.set(name, { name, approvals: 0, rejections: 0, comments: 0 })
    }
    const entry = approverMap.get(name)!
    if (a.decision === 'APPROVED') entry.approvals++
    else if (a.decision === 'REJECTED') entry.rejections++
    else if (a.decision === 'HAS_COMMENTS') entry.comments++
  }
  const approverWorkload: ApproverWorkload[] = [...approverMap.values()]
    .map(({ name, ...rest }) => ({ approver: name, ...rest }))
    .sort((a, b) => (b.approvals + b.rejections + b.comments) - (a.approvals + a.rejections + a.comments))

  // Per-approver response time
  const approverResponseMap = new Map<string, number[]>()
  for (const r of signOffs) {
    for (const a of r.approvals) {
      const name = a.approver.name
      const submittedChange = r.statusHistory.find(
        (s: { toStatus: string }) => s.toStatus === 'SUBMITTED',
      )
      if (submittedChange) {
        const hours = (new Date(a.createdAt).getTime() - submittedChange.createdAt.getTime()) / (1000 * 60 * 60)
        if (hours > 0) {
          if (!approverResponseMap.has(name)) approverResponseMap.set(name, [])
          approverResponseMap.get(name)!.push(hours)
        }
      }
    }
  }
  const approverResponseTimes: ApproverResponseTime[] = [...approverResponseMap.entries()]
    .map(([approver, times]) => ({ approver, avgHours: round(avg(times)) }))
    .sort((a, b) => a.avgHours - b.avgHours)

  // Top commenters
  const commenterMap = new Map<string, { name: string; count: number }>()
  for (const r of signOffs) {
    for (const c of r.comments) {
      const name = c.author.name
      if (!commenterMap.has(name)) commenterMap.set(name, { name, count: 0 })
      commenterMap.get(name)!.count++
    }
  }
  const approverCommentCounts: ApproverCommentCount[] = [...commenterMap.values()]
    .map(({ name, count }) => ({ approver: name, count }))
    .sort((a, b) => b.count - a.count)

  return { metrics, approverWorkload, approverResponseTimes, approverCommentCounts }
}

// ---------------------------------------------------------------------------
// Departments tab
// ---------------------------------------------------------------------------

function buildDepartmentsData(
  signOffs: SignOffWithRelations[],
  departments: { id: string; name: string }[],
): DepartmentsData {
  const comparison: DepartmentComparisonRow[] = departments
    .map((d) => {
      const deptSignOffs = signOffs.filter((r: SignOffWithRelations) => r.departmentId === d.id)
      if (deptSignOffs.length === 0) return null

      const cycleTimes = deptSignOffs
        .map((r: SignOffWithRelations) => computeCycleTimeDays(mapStatusChanges(r.statusHistory)))
        .filter((ct: number | null): ct is number => ct !== null)

      const approved = deptSignOffs.filter((r: SignOffWithRelations) => r.status === 'APPROVED').length
      const terminal = deptSignOffs.filter((r: SignOffWithRelations) =>
        ['APPROVED', 'REJECTED', 'WITHDRAWN'].includes(r.status),
      ).length
      const trials = deptSignOffs.filter((r: SignOffWithRelations) => r.isTrial).length

      return {
        department: d.name,
        signOffs: deptSignOffs.length,
        avgCycleTimeDays: cycleTimes.length > 0 ? round(avg(cycleTimes)) : 0,
        approvalRate: terminal > 0 ? round((approved / terminal) * 100) : 0,
        trialRate: deptSignOffs.length > 0 ? round((trials / deptSignOffs.length) * 100) : 0,
      }
    })
    .filter((row): row is DepartmentComparisonRow => row !== null)
    .sort((a, b) => b.signOffs - a.signOffs)

  const activeDepts = comparison.length
  const totalSignOffs = signOffs.length
  const approvedCount = signOffs.filter((r: SignOffWithRelations) => r.status === 'APPROVED').length
  const terminalCount = signOffs.filter((r: SignOffWithRelations) =>
    ['APPROVED', 'REJECTED', 'WITHDRAWN'].includes(r.status),
  ).length

  const metrics: DepartmentMetrics = {
    activeDepartments: activeDepts,
    avgPerDepartment: activeDepts > 0 ? round(totalSignOffs / activeDepts) : 0,
    highestVolumeDept: comparison[0]?.department ?? '-',
    overallApprovalRate: terminalCount > 0 ? round((approvedCount / terminalCount) * 100) : 0,
  }

  return { metrics, comparison }
}

// ---------------------------------------------------------------------------
// Risk tab
// ---------------------------------------------------------------------------

function buildRiskData(signOffs: SignOffWithRelations[]): RiskData {
  // Risk scores
  const riskScores: number[] = []
  let assessmentCount = 0
  let personalDataCount = 0

  for (const r of signOffs) {
    if (r.riskAssessment) {
      assessmentCount++
      const score = r.riskAssessment.overallRiskScore ??
        computeRiskScore(r.riskAssessment.likelihoodOfBreach, r.riskAssessment.impactOfBreach)
      if (score !== null) riskScores.push(score)
      if (r.riskAssessment.personalDataInvolved) personalDataCount++
    }
  }

  const highRiskCount = riskScores.filter((s) => s >= 15).length

  const metrics: RiskMetrics = {
    avgRiskScore: riskScores.length > 0 ? round(avg(riskScores)) : 0,
    highRiskCount,
    assessmentCoverage: signOffs.length > 0 ? round((assessmentCount / signOffs.length) * 100) : 0,
    personalDataRate: assessmentCount > 0 ? round((personalDataCount / assessmentCount) * 100) : 0,
  }

  // Category distribution
  const categoryCounts = new Map<SignOffCategory, number>()
  for (const r of signOffs) {
    for (const cat of r.categories) {
      categoryCounts.set(cat, (categoryCounts.get(cat) ?? 0) + 1)
    }
  }
  const totalCategoryEntries = [...categoryCounts.values()].reduce((sum, c) => sum + c, 0)
  const categoryDistribution: CategoryDistributionRow[] = [...categoryCounts.entries()]
    .map(([cat, count]) => ({
      category: CATEGORY_LABELS[cat] ?? cat,
      count,
      percentage: totalCategoryEntries > 0 ? round((count / totalCategoryEntries) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count)

  // Data classification breakdown
  const classificationCounts = new Map<string, number>()
  for (const r of signOffs) {
    if (r.riskAssessment?.dataClassification) {
      const cls = r.riskAssessment.dataClassification
      classificationCounts.set(cls, (classificationCounts.get(cls) ?? 0) + 1)
    }
  }
  const totalClassifications = [...classificationCounts.values()].reduce((sum, c) => sum + c, 0)
  const dataClassification: DataClassificationRow[] = [...classificationCounts.entries()]
    .map(([cls, count]) => ({
      classification: DATA_CLASSIFICATION_LABELS[cls] ?? cls,
      count,
      percentage: totalClassifications > 0 ? round((count / totalClassifications) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count)

  return { metrics, categoryDistribution, dataClassification }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mapStatusChanges(
  history: { fromStatus: SignOffStatus | null; toStatus: SignOffStatus; createdAt: Date }[],
): StatusChangeRecord[] {
  return history.map((s) => ({
    fromStatus: s.fromStatus,
    toStatus: s.toStatus,
    createdAt: s.createdAt.toISOString(),
  }))
}

function avg(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((sum, v) => sum + v, 0) / values.length
}
