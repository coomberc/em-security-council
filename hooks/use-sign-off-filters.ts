'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { SignOffCategory, SignOffStatus, SignOffSummary } from '@/types'

export type SignOffSortField = 'created' | 'updated' | 'sequence' | 'risk' | 'title'
export type SignOffSortDirection = 'asc' | 'desc'

export interface SignOffSort {
  field: SignOffSortField
  direction: SignOffSortDirection
}

export interface SignOffFiltersState {
  search: string
  statuses: SignOffStatus[]
  department: string | null
  categories: SignOffCategory[]
  sort: SignOffSort
}

const DEFAULT_SORT: SignOffSort = { field: 'created', direction: 'desc' }

function parseSort(value: string | null): SignOffSort {
  if (!value) return DEFAULT_SORT
  const [field, direction] = value.split(':')
  const validFields: SignOffSortField[] = ['created', 'updated', 'sequence', 'risk', 'title']
  const validDirections: SignOffSortDirection[] = ['asc', 'desc']
  if (
    validFields.includes(field as SignOffSortField) &&
    validDirections.includes(direction as SignOffSortDirection)
  ) {
    return { field: field as SignOffSortField, direction: direction as SignOffSortDirection }
  }
  return DEFAULT_SORT
}

function serializeSort(sort: SignOffSort): string {
  return `${sort.field}:${sort.direction}`
}

function parseFiltersFromParams(params: URLSearchParams): SignOffFiltersState {
  return {
    search: params.get('q') ?? '',
    statuses: (params.getAll('status') as SignOffStatus[]),
    department: params.get('department') ?? null,
    categories: (params.getAll('category') as SignOffCategory[]),
    sort: parseSort(params.get('sort')),
  }
}

function filtersToParams(filters: SignOffFiltersState): URLSearchParams {
  const params = new URLSearchParams()
  if (filters.search) params.set('q', filters.search)
  for (const s of filters.statuses) params.append('status', s)
  if (filters.department) params.set('department', filters.department)
  for (const c of filters.categories) params.append('category', c)
  const sortStr = serializeSort(filters.sort)
  if (sortStr !== serializeSort(DEFAULT_SORT)) params.set('sort', sortStr)
  return params
}

function sortSignOffs(signOffs: SignOffSummary[], sort: SignOffSort): SignOffSummary[] {
  const sorted = [...signOffs]
  const dir = sort.direction === 'asc' ? 1 : -1

  sorted.sort((a, b) => {
    switch (sort.field) {
      case 'created':
        return dir * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      case 'updated':
        return dir * (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime())
      case 'sequence':
        return dir * (a.sequenceNumber - b.sequenceNumber)
      case 'risk':
        return dir * ((a.riskScore ?? 0) - (b.riskScore ?? 0))
      case 'title':
        return dir * a.title.localeCompare(b.title)
      default:
        return 0
    }
  })

  return sorted
}

export function useSignOffFilters(signOffs: SignOffSummary[]) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const filters = useMemo(() => parseFiltersFromParams(searchParams), [searchParams])

  // Debounced search: local input state synced to URL after delay
  const [searchInput, setSearchInput] = useState(filters.search)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  // Keep local search in sync when URL changes externally
  useEffect(() => {
    setSearchInput(filters.search)
  }, [filters.search])

  const pushFilters = useCallback(
    (next: SignOffFiltersState) => {
      const params = filtersToParams(next)
      const qs = params.toString()
      router.push(qs ? `?${qs}` : '?', { scroll: false })
    },
    [router],
  )

  const setSearch = useCallback(
    (value: string) => {
      setSearchInput(value)
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        pushFilters({ ...filters, search: value })
      }, 300)
    },
    [filters, pushFilters],
  )

  const setStatuses = useCallback(
    (statuses: SignOffStatus[]) => {
      pushFilters({ ...filters, statuses })
    },
    [filters, pushFilters],
  )

  const setDepartment = useCallback(
    (department: string | null) => {
      pushFilters({ ...filters, department })
    },
    [filters, pushFilters],
  )

  const setCategories = useCallback(
    (categories: SignOffCategory[]) => {
      pushFilters({ ...filters, categories })
    },
    [filters, pushFilters],
  )

  const setSort = useCallback(
    (sort: SignOffSort) => {
      pushFilters({ ...filters, sort })
    },
    [filters, pushFilters],
  )

  const clearFilters = useCallback(() => {
    setSearchInput('')
    pushFilters({
      search: '',
      statuses: [],
      department: null,
      categories: [],
      sort: DEFAULT_SORT,
    })
  }, [pushFilters])

  const hasActiveFilters =
    filters.search !== '' ||
    filters.statuses.length > 0 ||
    filters.department !== null ||
    filters.categories.length > 0

  // Apply filters and sort client-side
  const filtered = useMemo(() => {
    let result = signOffs

    if (filters.search) {
      const q = filters.search.toLowerCase()
      result = result.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.vendorName?.toLowerCase().includes(q) ||
          s.submittedBy.name.toLowerCase().includes(q) ||
          String(s.sequenceNumber).includes(q),
      )
    }

    if (filters.statuses.length > 0) {
      result = result.filter((s) => filters.statuses.includes(s.status))
    }

    if (filters.department) {
      result = result.filter((s) => s.department.id === filters.department)
    }

    if (filters.categories.length > 0) {
      result = result.filter((s) =>
        s.categories.some((c) => filters.categories.includes(c)),
      )
    }

    return sortSignOffs(result, filters.sort)
  }, [signOffs, filters])

  return {
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
  }
}
