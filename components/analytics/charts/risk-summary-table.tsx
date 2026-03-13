'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { DataClassificationRow } from '@/lib/analytics/types'

interface RiskSummaryTableProps {
  dataClassification: DataClassificationRow[]
}

export function RiskSummaryTable({ dataClassification }: RiskSummaryTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Data Classification Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        {dataClassification.length === 0 ? (
          <p className="text-sm text-muted-foreground">No data classification data available.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Classification</TableHead>
                <TableHead className="text-right">Count</TableHead>
                <TableHead className="text-right">% of Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dataClassification.map((row) => (
                <TableRow key={row.classification} className="hover:bg-transparent">
                  <TableCell className="font-medium">{row.classification}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.count}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.percentage}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
