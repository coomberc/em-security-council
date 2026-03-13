'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import type { DepartmentComparisonRow } from '@/lib/analytics/types'

interface DepartmentComparisonTableProps {
  data: DepartmentComparisonRow[]
}

type SortKey = keyof DepartmentComparisonRow
type SortDir = 'asc' | 'desc'

const COLUMNS: { key: SortKey; label: string; format?: (v: number) => string }[] = [
  { key: 'department', label: 'Department' },
  { key: 'signOffs', label: 'Sign-Offs' },
  { key: 'avgCycleTimeDays', label: 'Avg Cycle (days)', format: (v) => v.toFixed(1) },
  { key: 'approvalRate', label: 'Approval Rate', format: (v) => `${v}%` },
  { key: 'trialRate', label: 'Trial Rate', format: (v) => `${v}%` },
]

export function DepartmentComparisonTable({ data }: DepartmentComparisonTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('signOffs')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const sorted = useMemo(() => {
    return [...data].sort((a, b) => {
      const aVal = a[sortKey]
      const bVal = b[sortKey]
      let cmp = 0
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        cmp = aVal - bVal
      } else {
        cmp = String(aVal).localeCompare(String(bVal))
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [data, sortKey, sortDir])

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  function SortIcon({ column }: { column: SortKey }) {
    if (sortKey !== column) return <ArrowUpDown className="h-3 w-3" />
    return sortDir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Department Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              {COLUMNS.map((col) => (
                <TableHead
                  key={col.key}
                  className="cursor-pointer select-none"
                  onClick={() => toggleSort(col.key)}
                >
                  <span className="flex items-center gap-1">
                    {col.label}
                    <SortIcon column={col.key} />
                  </span>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((row) => (
              <TableRow key={row.department} className="hover:bg-transparent">
                {COLUMNS.map((col) => {
                  const val = row[col.key]
                  return (
                    <TableCell key={col.key}>
                      {col.format && typeof val === 'number' ? col.format(val) : val}
                    </TableCell>
                  )
                })}
              </TableRow>
            ))}
            {sorted.length === 0 && (
              <TableRow>
                <TableCell colSpan={COLUMNS.length} className="text-center py-8 text-muted-foreground">
                  No department data available
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
