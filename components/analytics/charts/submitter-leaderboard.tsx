'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { SubmitterEntry } from '@/lib/analytics/types'

interface SubmitterLeaderboardProps {
  data: SubmitterEntry[]
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-base" title="1st">🥇</span>
  if (rank === 2) return <span className="text-base" title="2nd">🥈</span>
  if (rank === 3) return <span className="text-base" title="3rd">🥉</span>
  return <span className="text-xs font-medium text-muted-foreground">{rank}</span>
}

export function SubmitterLeaderboard({ data }: SubmitterLeaderboardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Top Submitters</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground">No submissions yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-8">#</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Sign-Offs</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, i) => (
                <TableRow key={row.name} className="hover:bg-transparent">
                  <TableCell><RankBadge rank={i + 1} /></TableCell>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.count}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
