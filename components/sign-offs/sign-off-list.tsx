'use client'

import { SignOffFilters } from '@/components/sign-offs/sign-off-filters'
import { SignOffTable } from '@/components/sign-offs/sign-off-table'
import { useSignOffs } from '@/providers/sign-offs-provider'
import { useCurrentUser } from '@/providers/user-provider'
import { useSignOffFilters } from '@/hooks/use-sign-off-filters'

export function SignOffList() {
  const { signOffs } = useSignOffs()
  const { currentUser } = useCurrentUser()
  const {
    filters,
    searchInput,
    filtered,
    hasActiveFilters,
    setSearch,
    setStatuses,
    setDepartment,
    setCategories,
    setSort,
    clearFilters,
  } = useSignOffFilters(signOffs)


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Sign-Offs</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {filtered.length} {filtered.length === 1 ? 'sign-off' : 'sign-offs'}
            {hasActiveFilters ? ' matching filters' : ' total'}
          </p>
        </div>
      </div>

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

      <SignOffTable signOffs={filtered} />
    </div>
  )
}
