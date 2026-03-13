'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { WeeklySignOffCounts } from '@/lib/analytics/types'
import { format } from 'date-fns'
import { CHART } from './chart-theme'

interface SignOffVelocityChartProps {
  data: WeeklySignOffCounts[]
}

function formatWeek(week: unknown): string {
  return format(new Date(String(week)), 'd MMM')
}

export function SignOffVelocityChart({ data }: SignOffVelocityChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Sign-Off Velocity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" tickFormatter={formatWeek} tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip labelFormatter={formatWeek} cursor={false} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="approved" name="Approved" stackId="a" fill={CHART.green} radius={[0, 0, 0, 0]} activeBar={false} />
              <Bar dataKey="rejected" name="Rejected" stackId="a" fill={CHART.navy} activeBar={false} />
              <Bar dataKey="withdrawn" name="Withdrawn" stackId="a" fill={CHART.blue} activeBar={false} />
              <Bar dataKey="pending" name="In Progress" stackId="a" fill={CHART.gold} radius={[4, 4, 0, 0]} activeBar={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
