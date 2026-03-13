'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { CycleTimeTrend } from '@/lib/analytics/types'
import { format } from 'date-fns'
import { CHART } from './chart-theme'

interface CycleTimeTrendChartProps {
  data: CycleTimeTrend[]
}

function formatWeek(week: unknown): string {
  return format(new Date(String(week)), 'd MMM')
}

export function CycleTimeTrendChart({ data }: CycleTimeTrendChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Cycle Time Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" tickFormatter={formatWeek} tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} label={{ value: 'Days', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }} />
              <Tooltip labelFormatter={formatWeek} cursor={false} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Line type="monotone" dataKey="avgDays" name="Average" stroke={CHART.gold} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="medianDays" name="Median" stroke={CHART.blue} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="p90Days" name="P90" stroke={CHART.green} strokeWidth={2} strokeDasharray="5 5" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
