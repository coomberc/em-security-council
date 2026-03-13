'use client'

import { SignOffFilters } from '@/components/sign-offs/sign-off-filters'
import { SignOffViewTabs } from '@/components/sign-offs/sign-off-view-tabs'
import { SignOffTable } from '@/components/sign-offs/sign-off-table'
import { SignOffCard } from '@/components/sign-offs/sign-off-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useSignOffs } from '@/providers/sign-offs-provider'
import { useCurrentUser } from '@/providers/user-provider'
import { useSignOffFilters } from '@/hooks/use-sign-off-filters'
import { exportSignOffsToCSV } from '@/lib/export-csv'
import { Download, Search } from 'lucide-react'

export function SignOffList() {
  const { signOffs } = useSignOffs()
  const { currentUser } = useCurrentUser()
  const {
    filters,
    searchInput,
    filtered,
    hasActiveFilters,
    viewCounts,
    setView,
    setSearch,
    setStatuses,
    setDepartment,
    setCategories,
    setSort,
    clearFilters,
  } = useSignOffFilters(signOffs, currentUser.id)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Sign-Offs</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {filtered.length} {filtered.length === 1 ? 'sign-off' : 'sign-offs'}
            {hasActiveFilters ? ' matching filters' : ''}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={filtered.length === 0}
          onClick={() => {
            const csv = exportSignOffsToCSV(filtered)
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
            const url = URL.createObjectURL(blob)
            const date = new Date().toISOString().slice(0, 10)
            const a = document.createElement('a')
            a.href = url
            a.download = `sign-offs-export-${date}.csv`
            a.click()
            URL.revokeObjectURL(url)
          }}
        >
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline ml-2">Export CSV</span>
        </Button>
      </div>

      {/* Mobile search */}
      <div className="md:hidden relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search sign-offs..."
          value={searchInput}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <SignOffViewTabs
        currentView={filters.view}
        counts={viewCounts}
        onViewChange={setView}
        isApprover={currentUser.role === 'APPROVER' || currentUser.role === 'COUNCIL_MEMBER'}
      />

      <div className="hidden md:block">
        <SignOffFilters
          searchInput={searchInput}
          statuses={filters.statuses}
          department={filters.department}
          categories={filters.categories}
          sort={filters.sort}
          hasActiveFilters={hasActiveFilters}
          onSearchChange={setSearch}
          onStatusesChange={setStatuses}
          onDepartmentChange={setDepartment}
          onCategoriesChange={setCategories}
          onSortChange={setSort}
          onClear={clearFilters}
        />
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
            <p className="text-muted-foreground text-sm">No sign-offs found</p>
            <p className="text-muted-foreground text-xs mt-1">
              Try adjusting your filters or create a new sign-off.
            </p>
          </div>
        ) : (
          filtered.map((s) => <SignOffCard key={s.id} signOff={s} />)
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block">
        <SignOffTable signOffs={filtered} showTrialEndDate={filters.view === 'trials'} />
      </div>
    </div>
  )
}
