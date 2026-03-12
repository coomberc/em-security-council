'use client'

import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { StatusBadge } from '@/components/shared/status-badge'
import { CategoryBadge } from '@/components/shared/category-badge'
import { RiskBadge } from '@/components/shared/risk-badge'
import { TrialBadge } from '@/components/shared/trial-badge'
import { ApprovalProgress } from '@/components/shared/approval-progress'
import { formatRelativeDate, formatSequenceNumber, signOffUrl } from '@/lib/format'
import type { SignOffSummary } from '@/types'

interface SignOffTableProps {
  signOffs: SignOffSummary[]
}

export function SignOffTable({ signOffs }: SignOffTableProps) {
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
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[90px]">Seq #</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Categories</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[70px]">Trial</TableHead>
            <TableHead>Risk</TableHead>
            <TableHead>Approvals</TableHead>
            <TableHead className="w-[110px]">Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {signOffs.map((signOff) => (
            <TableRow key={signOff.id} className="group">
              <TableCell className="font-mono text-xs text-muted-foreground">
                <Link
                  href={signOffUrl(signOff)}
                  className="block group-hover:text-foreground transition-colors"
                >
                  {formatSequenceNumber(signOff.sequenceNumber)}
                </Link>
              </TableCell>
              <TableCell className="max-w-[300px]">
                <Link
                  href={signOffUrl(signOff)}
                  className="block font-medium hover:underline truncate"
                >
                  {signOff.title}
                </Link>
                {signOff.vendorName && (
                  <span className="text-xs text-muted-foreground">{signOff.vendorName}</span>
                )}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {signOff.department.name}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {signOff.categories.slice(0, 2).map((cat) => (
                    <CategoryBadge key={cat} category={cat} />
                  ))}
                  {signOff.categories.length > 2 && (
                    <span className="text-xs text-muted-foreground">
                      +{signOff.categories.length - 2}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <StatusBadge status={signOff.status} />
              </TableCell>
              <TableCell>
                {signOff.isTrial && <TrialBadge />}
              </TableCell>
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
  )
}
