'use client'

import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MultiSelect } from '@/components/ui/multi-select'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { STATUS_LABELS, CATEGORY_LABELS } from '@/lib/constants'
import { useDepartments } from '@/providers/departments-provider'
import {
  SIGN_OFF_STATUSES,
  SIGN_OFF_CATEGORIES,
  type SignOffStatus,
  type SignOffCategory,
} from '@/types'
import type { SignOffSort } from '@/hooks/use-sign-off-filters'

interface SignOffFiltersProps {
  searchInput: string
  statuses: SignOffStatus[]
  department: string | null
  categories: SignOffCategory[]
  sort: SignOffSort
  hasActiveFilters: boolean
  onSearchChange: (value: string) => void
  onStatusesChange: (statuses: SignOffStatus[]) => void
  onDepartmentChange: (department: string | null) => void
  onCategoriesChange: (categories: SignOffCategory[]) => void
  onSortChange: (sort: SignOffSort) => void
  onClear: () => void
}

const STATUS_OPTIONS = SIGN_OFF_STATUSES.map((s) => ({
  value: s,
  label: STATUS_LABELS[s] ?? s,
}))

const CATEGORY_OPTIONS = SIGN_OFF_CATEGORIES.map((c) => ({
  value: c,
  label: CATEGORY_LABELS[c] ?? c,
})).sort((a, b) => a.label.localeCompare(b.label))

const SORT_OPTIONS = [
  { value: 'created:desc', label: 'Newest first' },
  { value: 'created:asc', label: 'Oldest first' },
  { value: 'updated:desc', label: 'Recently updated' },
  { value: 'sequence:desc', label: 'Sequence (high to low)' },
  { value: 'sequence:asc', label: 'Sequence (low to high)' },
  { value: 'risk:desc', label: 'Highest risk' },
  { value: 'risk:asc', label: 'Lowest risk' },
  { value: 'title:asc', label: 'Title A-Z' },
  { value: 'title:desc', label: 'Title Z-A' },
]

export function SignOffFilters({
  searchInput,
  statuses,
  department,
  categories,
  sort,
  hasActiveFilters,
  onSearchChange,
  onStatusesChange,
  onDepartmentChange,
  onCategoriesChange,
  onSortChange,
  onClear,
}: SignOffFiltersProps) {
  const departments = useDepartments()
  const activeDepartments = departments.filter((d) => !d.archivedAt)

  function handleSortChange(value: string) {
    const [field, direction] = value.split(':')
    onSortChange({
      field: field as SignOffSort['field'],
      direction: direction as SignOffSort['direction'],
    })
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
      <Input
        type="search"
        placeholder="Search sign-offs..."
        value={searchInput}
        onChange={(e) => onSearchChange(e.target.value)}
        className="h-8 w-full sm:w-[240px] text-sm"
      />

      <MultiSelect
        value={statuses}
        onChange={(values) => onStatusesChange(values as SignOffStatus[])}
        options={STATUS_OPTIONS}
        placeholder="Status"
      />

      <Select
        value={department ?? 'all'}
        onValueChange={(v) => onDepartmentChange(v === 'all' ? null : v)}
      >
        <SelectTrigger size="sm" className="h-8 w-fit min-w-[140px] text-xs font-normal">
          <SelectValue placeholder="Department" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All departments</SelectItem>
          {activeDepartments.map((d) => (
            <SelectItem key={d.id} value={d.id}>
              {d.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <MultiSelect
        value={categories}
        onChange={(values) => onCategoriesChange(values as SignOffCategory[])}
        options={CATEGORY_OPTIONS}
        placeholder="Category"
        searchable
      />

      <Select
        value={`${sort.field}:${sort.direction}`}
        onValueChange={handleSortChange}
      >
        <SelectTrigger size="sm" className="h-8 w-fit min-w-[160px] text-xs font-normal">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="h-8 px-2 text-xs text-muted-foreground"
        >
          <X className="mr-1 h-3 w-3" />
          Clear filters
        </Button>
      )}
    </div>
  )
}
