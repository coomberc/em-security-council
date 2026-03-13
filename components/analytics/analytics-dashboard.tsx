'use client'

import { useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { subDays, startOfDay, endOfDay } from 'date-fns'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { AnalyticsFilters } from '@/components/analytics/analytics-filters'
import { MetricCard } from '@/components/analytics/metric-card'
import { SignOffVelocityChart } from '@/components/analytics/charts/sign-off-velocity-chart'
import { CycleTimeTrendChart } from '@/components/analytics/charts/cycle-time-trend-chart'
import { ApproverLeaderboard } from '@/components/analytics/charts/approver-leaderboard'
import { SubmitterLeaderboard } from '@/components/analytics/charts/submitter-leaderboard'
import { DepartmentComparisonTable } from '@/components/analytics/charts/department-comparison-table'
import { CategoryDistributionTable } from '@/components/analytics/charts/category-distribution-table'
import { RiskSummaryTable } from '@/components/analytics/charts/risk-summary-table'
import type { AnalyticsData, MetricCardData } from '@/lib/analytics/types'

interface AnalyticsDashboardProps {
  data: AnalyticsData
  initialFrom: string
  initialTo: string
}

function computeTrend(
  current: number,
  previous: number,
  higherIsBetter: boolean = true,
): Pick<MetricCardData, 'trend' | 'trendLabel'> {
  if (previous === 0) return { trend: 'neutral', trendLabel: 'No prior data' }
  const diff = current - previous
  const pct = Math.round((diff / previous) * 100)
  if (pct === 0) return { trend: 'neutral', trendLabel: 'No change' }

  const isUp = pct > 0
  const trend = higherIsBetter ? (isUp ? 'up' : 'down') : isUp ? 'down' : 'up'
  return { trend, trendLabel: `${isUp ? '+' : ''}${pct}% vs prior` }
}

export function AnalyticsDashboard({ data, initialFrom, initialTo }: AnalyticsDashboardProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [dateRange, setDateRange] = useState(() => ({
    from: initialFrom ? new Date(initialFrom) : startOfDay(subDays(new Date(), 90)),
    to: initialTo ? new Date(initialTo) : endOfDay(new Date()),
  }))

  const activeTab = searchParams.get('tab') ?? 'overview'

  const handleDateRangeChange = useCallback(
    (range: { from: Date; to: Date }) => {
      setDateRange(range)
      const params = new URLSearchParams(searchParams.toString())
      params.set('from', range.from.toISOString().split('T')[0])
      params.set('to', range.to.toISOString().split('T')[0])
      router.replace(`/analytics?${params.toString()}`, { scroll: false })
    },
    [router, searchParams],
  )

  const handleTabChange = useCallback(
    (tab: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('tab', tab)
      router.replace(`/analytics?${params.toString()}`, { scroll: false })
    },
    [router, searchParams],
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Analytics</h1>
      </div>

      <AnalyticsFilters dateRange={dateRange} onDateRangeChange={handleDateRangeChange} />

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList variant="line">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="approvals">Approvals</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="risk">Risk</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <OverviewTab data={data} />
        </TabsContent>

        <TabsContent value="approvals" className="mt-4">
          <ApprovalsTab data={data} />
        </TabsContent>

        <TabsContent value="departments" className="mt-4">
          <DepartmentsTab data={data} />
        </TabsContent>

        <TabsContent value="risk" className="mt-4">
          <RiskTab data={data} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tab components
// ---------------------------------------------------------------------------

function OverviewTab({ data }: { data: AnalyticsData }) {
  const { metrics, velocity, cycleTimeTrend, topSubmitters } = data.overview

  const cards: MetricCardData[] = [
    {
      label: 'Total Sign-Offs',
      value: metrics.totalSignOffs,
      ...computeTrend(metrics.totalSignOffs, metrics.previousTotalSignOffs),
    },
    {
      label: 'Avg Cycle Time',
      value: metrics.avgCycleTimeDays > 0 ? `${metrics.avgCycleTimeDays}d` : '-',
      ...computeTrend(metrics.avgCycleTimeDays, metrics.previousAvgCycleTimeDays, false),
    },
    {
      label: 'Approval Rate',
      value: metrics.approvalRate > 0 ? `${metrics.approvalRate}%` : '-',
      ...computeTrend(metrics.approvalRate, metrics.previousApprovalRate),
    },
    {
      label: 'Active in Pipeline',
      value: metrics.activeInPipeline,
    },
    {
      label: 'Trial Rate',
      value: `${metrics.trialRate}%`,
      ...computeTrend(metrics.trialRate, metrics.previousTrialRate, false),
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <MetricCard key={card.label} data={card} />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SignOffVelocityChart data={velocity} />
        <CycleTimeTrendChart data={cycleTimeTrend} />
      </div>
      <SubmitterLeaderboard data={topSubmitters} />
    </div>
  )
}

function ApprovalsTab({ data }: { data: AnalyticsData }) {
  const { metrics, approverWorkload, approverResponseTimes, approverCommentCounts } =
    data.approvals

  const cards: MetricCardData[] = [
    {
      label: 'Queue Depth',
      value: metrics.queueDepth,
    },
    {
      label: 'Avg Response Time',
      value: metrics.avgResponseTimeHours > 0 ? `${metrics.avgResponseTimeHours}h` : '-',
      ...computeTrend(metrics.avgResponseTimeHours, metrics.previousAvgResponseTimeHours, false),
    },
    {
      label: 'Decisions This Period',
      value: metrics.decisionsThisPeriod,
      ...computeTrend(metrics.decisionsThisPeriod, metrics.previousDecisionsThisPeriod),
    },
    {
      label: 'Active Approvers',
      value: metrics.activeApprovers,
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <MetricCard key={card.label} data={card} />
        ))}
      </div>
      <ApproverLeaderboard
        workload={approverWorkload}
        responseTimes={approverResponseTimes}
        commentCounts={approverCommentCounts}
      />
    </div>
  )
}

function DepartmentsTab({ data }: { data: AnalyticsData }) {
  const { metrics, comparison } = data.departments

  const cards: MetricCardData[] = [
    {
      label: 'Active Departments',
      value: metrics.activeDepartments,
    },
    {
      label: 'Avg Per Department',
      value: metrics.avgPerDepartment,
    },
    {
      label: 'Highest Volume',
      value: metrics.highestVolumeDept,
    },
    {
      label: 'Overall Approval Rate',
      value: `${metrics.overallApprovalRate}%`,
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <MetricCard key={card.label} data={card} />
        ))}
      </div>
      <DepartmentComparisonTable data={comparison} />
    </div>
  )
}

function RiskTab({ data }: { data: AnalyticsData }) {
  const { metrics, categoryDistribution, dataClassification } = data.risk

  const cards: MetricCardData[] = [
    {
      label: 'Avg Risk Score',
      value: metrics.avgRiskScore > 0 ? metrics.avgRiskScore : '-',
    },
    {
      label: 'High Risk Count',
      value: metrics.highRiskCount,
    },
    {
      label: 'Assessment Coverage',
      value: `${metrics.assessmentCoverage}%`,
    },
    {
      label: 'Personal Data Rate',
      value: `${metrics.personalDataRate}%`,
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <MetricCard key={card.label} data={card} />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CategoryDistributionTable data={categoryDistribution} />
        <RiskSummaryTable dataClassification={dataClassification} />
      </div>
    </div>
  )
}
