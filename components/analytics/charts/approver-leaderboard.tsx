'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { ApproverWorkload, ApproverResponseTime, ApproverCommentCount } from '@/lib/analytics/types'

interface ApproverLeaderboardProps {
  workload: ApproverWorkload[]
  responseTimes: ApproverResponseTime[]
  commentCounts: ApproverCommentCount[]
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-base" title="1st">🥇</span>
  if (rank === 2) return <span className="text-base" title="2nd">🥈</span>
  if (rank === 3) return <span className="text-base" title="3rd">🥉</span>
  return <span className="text-xs font-medium text-muted-foreground">{rank}</span>
}

export function ApproverLeaderboard({ workload, responseTimes, commentCounts }: ApproverLeaderboardProps) {
  const topReviewers = workload.slice(0, 10)

  const fastestResponders = [...responseTimes]
    .filter((r) => r.avgHours > 0)
    .sort((a, b) => a.avgHours - b.avgHours)
    .slice(0, 10)

  const topCommenters = commentCounts.slice(0, 10)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Top Reviewers</CardTitle>
        </CardHeader>
        <CardContent>
          {topReviewers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No review activity yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-8">#</TableHead>
                  <TableHead>Approver</TableHead>
                  <TableHead className="text-right">Decisions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topReviewers.map((row, i) => (
                  <TableRow key={row.approver} className="hover:bg-transparent">
                    <TableCell><RankBadge rank={i + 1} /></TableCell>
                    <TableCell className="font-medium">{row.approver}</TableCell>
                    <TableCell className="text-right">
                      <span className="tabular-nums">{row.approvals + row.rejections + row.comments}</span>
                      <span className="ml-1.5 text-xs text-muted-foreground">
                        ({row.approvals}A {row.rejections}R)
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Fastest Responders</CardTitle>
        </CardHeader>
        <CardContent>
          {fastestResponders.length === 0 ? (
            <p className="text-sm text-muted-foreground">No response time data yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-8">#</TableHead>
                  <TableHead>Approver</TableHead>
                  <TableHead className="text-right">Avg Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fastestResponders.map((row, i) => (
                  <TableRow key={row.approver} className="hover:bg-transparent">
                    <TableCell><RankBadge rank={i + 1} /></TableCell>
                    <TableCell className="font-medium">{row.approver}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.avgHours < 1
                        ? `${Math.round(row.avgHours * 60)}m`
                        : `${row.avgHours}h`}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Most Comments</CardTitle>
        </CardHeader>
        <CardContent>
          {topCommenters.length === 0 ? (
            <p className="text-sm text-muted-foreground">No comments yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-8">#</TableHead>
                  <TableHead>Person</TableHead>
                  <TableHead className="text-right">Comments</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topCommenters.map((row, i) => (
                  <TableRow key={row.approver} className="hover:bg-transparent">
                    <TableCell><RankBadge rank={i + 1} /></TableCell>
                    <TableCell className="font-medium">{row.approver}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
