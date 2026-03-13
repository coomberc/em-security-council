import type { SignOffStatus } from '@/types'

// ---------------------------------------------------------------------------
// Date range
// ---------------------------------------------------------------------------

export interface DateRange {
  from: Date
  to: Date
}

// ---------------------------------------------------------------------------
// Metric cards
// ---------------------------------------------------------------------------

export interface MetricCardData {
  label: string
  value: string | number
  previousValue?: number
  trend?: 'up' | 'down' | 'neutral'
  trendLabel?: string
}

// ---------------------------------------------------------------------------
// Overview tab
// ---------------------------------------------------------------------------

export interface WeeklySignOffCounts {
  week: string // ISO date of week start
  approved: number
  rejected: number
  withdrawn: number
  pending: number
}

export interface CycleTimeTrend {
  week: string
  avgDays: number
  medianDays: number
  p90Days: number
}

export interface SubmitterEntry {
  name: string
  count: number
}

export interface OverviewMetrics {
  totalSignOffs: number
  avgCycleTimeDays: number
  approvalRate: number
  activeInPipeline: number
  trialRate: number
  previousTotalSignOffs: number
  previousAvgCycleTimeDays: number
  previousApprovalRate: number
  previousTrialRate: number
}

export interface OverviewData {
  metrics: OverviewMetrics
  velocity: WeeklySignOffCounts[]
  cycleTimeTrend: CycleTimeTrend[]
  topSubmitters: SubmitterEntry[]
}

// ---------------------------------------------------------------------------
// Approvals tab
// ---------------------------------------------------------------------------

export interface ApprovalMetrics {
  queueDepth: number
  avgResponseTimeHours: number
  decisionsThisPeriod: number
  activeApprovers: number
  previousAvgResponseTimeHours: number
  previousDecisionsThisPeriod: number
}

export interface ApproverWorkload {
  approver: string
  approvals: number
  rejections: number
  comments: number
}

export interface ApproverResponseTime {
  approver: string
  avgHours: number
}

export interface ApproverCommentCount {
  approver: string
  count: number
}

export interface ApprovalsData {
  metrics: ApprovalMetrics
  approverWorkload: ApproverWorkload[]
  approverResponseTimes: ApproverResponseTime[]
  approverCommentCounts: ApproverCommentCount[]
}

// ---------------------------------------------------------------------------
// Departments tab
// ---------------------------------------------------------------------------

export interface DepartmentMetrics {
  activeDepartments: number
  avgPerDepartment: number
  highestVolumeDept: string
  overallApprovalRate: number
}

export interface DepartmentComparisonRow {
  department: string
  signOffs: number
  avgCycleTimeDays: number
  approvalRate: number
  trialRate: number
}

export interface DepartmentsData {
  metrics: DepartmentMetrics
  comparison: DepartmentComparisonRow[]
}

// ---------------------------------------------------------------------------
// Risk tab
// ---------------------------------------------------------------------------

export interface RiskMetrics {
  avgRiskScore: number
  highRiskCount: number
  assessmentCoverage: number
  personalDataRate: number
}

export interface CategoryDistributionRow {
  category: string
  count: number
  percentage: number
}

export interface DataClassificationRow {
  classification: string
  count: number
  percentage: number
}

export interface RiskData {
  metrics: RiskMetrics
  categoryDistribution: CategoryDistributionRow[]
  dataClassification: DataClassificationRow[]
}

// ---------------------------------------------------------------------------
// Combined analytics data (passed from server to client)
// ---------------------------------------------------------------------------

export interface AnalyticsData {
  overview: OverviewData
  approvals: ApprovalsData
  departments: DepartmentsData
  risk: RiskData
}

// ---------------------------------------------------------------------------
// Status change record (for compute functions)
// ---------------------------------------------------------------------------

export interface StatusChangeRecord {
  fromStatus: SignOffStatus | null
  toStatus: SignOffStatus
  createdAt: string
}
