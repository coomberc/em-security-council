import { redirect } from 'next/navigation'
import { getAnalyticsData } from '@/lib/db/analytics-queries'
import { getAuthenticatedUser } from '@/lib/auth'
import { getUsers } from '@/lib/db/queries'
import { AnalyticsDashboard } from '@/components/analytics/analytics-dashboard'
import { subDays, startOfDay, endOfDay } from 'date-fns'

interface AnalyticsPageProps {
  searchParams: Promise<{ from?: string; to?: string; tab?: string }>
}

export default async function AnalyticsPage({ searchParams }: AnalyticsPageProps) {
  const params = await searchParams
  const now = new Date()
  const from = params.from ? startOfDay(new Date(params.from)) : startOfDay(subDays(now, 90))
  const to = params.to ? endOfDay(new Date(params.to)) : endOfDay(now)

  // Resolve current user and check role
  const [authenticatedUser, users] = await Promise.all([
    getAuthenticatedUser(),
    getUsers(),
  ])

  const currentUser = authenticatedUser
    ? users.find((u) => u.email.toLowerCase() === authenticatedUser.email.toLowerCase())
    : users[0]

  if (!currentUser || (currentUser.role !== 'APPROVER' && currentUser.role !== 'COUNCIL_MEMBER')) {
    redirect('/sign-offs')
  }

  const data = await getAnalyticsData({ from, to })

  return (
    <div className="flex-1 px-4 py-6">
      <AnalyticsDashboard
        data={data}
        initialFrom={from.toISOString().split('T')[0]}
        initialTo={to.toISOString().split('T')[0]}
      />
    </div>
  )
}
