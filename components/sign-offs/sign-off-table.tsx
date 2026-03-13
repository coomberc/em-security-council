'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/shared/status-badge'
import { RiskBadge } from '@/components/shared/risk-badge'
import { TrialStateBadge } from '@/components/shared/trial-badge'
import { ApprovalProgress } from '@/components/shared/approval-progress'
import { formatRelativeDate, formatSequenceNumber, signOffUrl } from '@/lib/format'
import { CATEGORY_LABELS } from '@/lib/constants'
import type { SignOffSummary } from '@/types'

const PAGE_SIZE = 50

type SortKey = 'sequence' | 'title' | 'department' | 'status' | 'risk' | 'created' | 'trialEnd'
type SortDir = 'asc' | 'desc'

interface ColumnSort {
  key: SortKey
  dir: SortDir
}

interface SignOffTableProps {
  signOffs: SignOffSummary[]
  showTrialEndDate?: boolean
}

function compareBy(a: SignOffSummary, b: SignOffSummary, key: SortKey): number {
  switch (key) {
    case 'sequence':
      return a.sequenceNumber - b.sequenceNumber
    case 'title':
      return a.title.localeCompare(b.title)
    case 'department':
      return a.department.name.localeCompare(b.department.name)
    case 'status':
      return a.status.localeCompare(b.status)
    case 'risk':
      return (a.riskScore ?? 0) - (b.riskScore ?? 0)
    case 'created':
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    case 'trialEnd': {
      const aDate = a.trialEndDate ? new Date(a.trialEndDate).getTime() : Infinity
      const bDate = b.trialEndDate ? new Date(b.trialEndDate).getTime() : Infinity
      return aDate - bDate
    }
    default:
      return 0
  }
}

function SortIcon({ columnKey, sort }: { columnKey: SortKey; sort: ColumnSort | null }) {
  if (!sort || sort.key !== columnKey) {
    return <ArrowUpDown className="ml-1 h-3 w-3 opacity-40" />
  }
  return sort.dir === 'asc' ? (
    <ArrowUp className="ml-1 h-3 w-3" />
  ) : (
    <ArrowDown className="ml-1 h-3 w-3" />
  )
}

export function SignOffTable({ signOffs, showTrialEndDate = false }: SignOffTableProps) {
  const [sort, setSort] = useState<ColumnSort | null>(null)
  const [page, setPage] = useState(0)

  function toggleSort(key: SortKey) {
    setSort((prev) => {
      if (prev?.key === key) {
        if (prev.dir === 'asc') return { key, dir: 'desc' }
        // Third click: clear sort
        return null
      }
      return { key, dir: 'asc' }
    })
    setPage(0)
  }

  const sorted = useMemo(() => {
    if (!sort) return signOffs
    const dir = sort.dir === 'asc' ? 1 : -1
    return [...signOffs].sort((a, b) => dir * compareBy(a, b, sort.key))
  }, [signOffs, sort])

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE)
  const paginated = sorted.length > PAGE_SIZE ? sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE) : sorted
  const showPagination = sorted.length > PAGE_SIZE

  // Reset page when data changes
  if (page > 0 && page >= totalPages) {
    setPage(Math.max(0, totalPages - 1))
  }

  if (signOffs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
        <p className="text-muted-foreground text-sm">No sign-offs found</p>
        <p className="text-muted-foreground text-xs mt-1">
          Try adjusting your filters or create a new sign-off.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHead sortKey="sequence" sort={sort} onSort={toggleSort} className="w-[90px]">
                Seq #
              </SortableHead>
              <SortableHead sortKey="title" sort={sort} onSort={toggleSort}>
                Title
              </SortableHead>
              <SortableHead sortKey="department" sort={sort} onSort={toggleSort}>
                Department
              </SortableHead>
              <SortableHead sortKey="status" sort={sort} onSort={toggleSort}>
                Status
              </SortableHead>
              <TableHead className="w-[70px]">Trial</TableHead>
              {showTrialEndDate && (
                <SortableHead sortKey="trialEnd" sort={sort} onSort={toggleSort} className="w-[110px]">
                  Trial End
                </SortableHead>
              )}
              <SortableHead sortKey="risk" sort={sort} onSort={toggleSort}>
                Risk
              </SortableHead>
              <TableHead>Approvals</TableHead>
              <SortableHead sortKey="created" sort={sort} onSort={toggleSort} className="w-[110px]">
                Created
              </SortableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.map((signOff) => (
              <TableRow key={signOff.id} className="group">
                <TableCell className="font-mono text-xs text-muted-foreground">
                  <Link
                    href={signOffUrl(signOff)}
                    className="block group-hover:text-foreground transition-colors"
                  >
                    {formatSequenceNumber(signOff.sequenceNumber)}
                  </Link>
                </TableCell>
                <TableCell className="max-w-[350px]">
                  <Link
                    href={signOffUrl(signOff)}
                    className="block font-medium hover:underline truncate"
                  >
                    {signOff.title}
                  </Link>
                  <div className="text-xs text-muted-foreground truncate">
                    {signOff.vendorName && <>{signOff.vendorName} · </>}
                    {signOff.categories.map((c) => CATEGORY_LABELS[c] ?? c).join(', ')}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {signOff.department.name}
                </TableCell>
                <TableCell>
                  <StatusBadge status={signOff.status} />
                </TableCell>
                <TableCell>
                  <TrialStateBadge signOff={signOff} />
                </TableCell>
                {showTrialEndDate && (
                  <TableCell className="text-xs text-muted-foreground">
                    {signOff.trialEndDate ? formatRelativeDate(signOff.trialEndDate) : '--'}
                  </TableCell>
                )}
                <TableCell>
                  {signOff.riskScore != null ? (
                    <RiskBadge score={signOff.riskScore} />
                  ) : (
                    <span className="text-xs text-muted-foreground">--</span>
                  )}
                </TableCell>
                <TableCell>
                  <ApprovalProgress
                    approvers={signOff.approvers}
                    approvals={signOff.approvals}
                  />
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {formatRelativeDate(signOff.createdAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {showPagination && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, sorted.length)} of {sorted.length}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="text-xs text-muted-foreground px-2">
              Page {page + 1} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function SortableHead({
  sortKey,
  sort,
  onSort,
  className,
  children,
}: {
  sortKey: SortKey
  sort: ColumnSort | null
  onSort: (key: SortKey) => void
  className?: string
  children: React.ReactNode
}) {
  return (
    <TableHead className={className}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="inline-flex items-center hover:text-foreground transition-colors -ml-1 px-1 py-0.5 rounded"
      >
        {children}
        <SortIcon columnKey={sortKey} sort={sort} />
      </button>
    </TableHead>
  )
}
