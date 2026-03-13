'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { SignOffCategory, SignOffStatus, SignOffSummary } from '@/types'

export type SignOffSortField = 'created' | 'updated' | 'sequence' | 'risk' | 'title' | 'trialEndDate'
export type SignOffSortDirection = 'asc' | 'desc'

export interface SignOffSort {
  field: SignOffSortField
  direction: SignOffSortDirection
}

export const SIGN_OFF_VIEWS = ['all', 'needs-my-review', 'my-requests', 'awaiting-approval', 'approved', 'trials'] as const
export type SignOffView = (typeof SIGN_OFF_VIEWS)[number]

export const VIEW_LABELS: Record<SignOffView, string> = {
  all: 'All',
  'needs-my-review': 'Needs My Review',
  'my-requests': 'My Open Requests',
  'awaiting-approval': 'Awaiting Approval',
  approved: 'Approved',
  trials: 'Trials',
}

export interface SignOffFiltersState {
  view: SignOffView
  search: string
  statuses: SignOffStatus[]
  department: string | null
  categories: SignOffCategory[]
  sort: SignOffSort
}

const DEFAULT_SORT: SignOffSort = { field: 'created', direction: 'desc' }

function parseView(value: string | null): SignOffView {
  if (value && (SIGN_OFF_VIEWS as readonly string[]).includes(value)) {
    return value as SignOffView
  }
  return 'all'
}

function parseSort(value: string | null): SignOffSort {
  if (!value) return DEFAULT_SORT
  const [field, direction] = value.split(':')
  const validFields: SignOffSortField[] = ['created', 'updated', 'sequence', 'risk', 'title', 'trialEndDate']
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

const TRIALS_DEFAULT_SORT: SignOffSort = { field: 'trialEndDate', direction: 'asc' }

function parseFiltersFromParams(params: URLSearchParams): SignOffFiltersState {
  const view = parseView(params.get('view'))
  const explicitSort = params.get('sort')
  return {
    view,
    search: params.get('q') ?? '',
    statuses: (params.getAll('status') as SignOffStatus[]),
    department: params.get('department') ?? null,
    categories: (params.getAll('category') as SignOffCategory[]),
    sort: explicitSort ? parseSort(explicitSort) : (view === 'trials' ? TRIALS_DEFAULT_SORT : DEFAULT_SORT),
  }
}

function filtersToParams(filters: SignOffFiltersState): URLSearchParams {
  const params = new URLSearchParams()
  if (filters.view !== 'all') params.set('view', filters.view)
  if (filters.search) params.set('q', filters.search)
  for (const s of filters.statuses) params.append('status', s)
  if (filters.department) params.set('department', filters.department)
  for (const c of filters.categories) params.append('category', c)
  const sortStr = serializeSort(filters.sort)
  if (sortStr !== serializeSort(DEFAULT_SORT)) params.set('sort', sortStr)
  return params
}

function applyView(
  signOffs: SignOffSummary[],
  view: SignOffView,
  userId: string,
): SignOffSummary[] {
  switch (view) {
    case 'needs-my-review': {
      // Sign-offs where user is an assigned approver and hasn't given a current (non-revoked) approval/rejection
      return signOffs.filter((s) => {
        if (s.status !== 'SUBMITTED' && s.status !== 'HAS_COMMENTS') return false
        const isAssigned = s.approvers.some((a) => a.userId === userId)
        if (!isAssigned) return false
        const hasActioned = s.approvals.some(
          (a) => a.approverId === userId && !a.revokedAt,
        )
        return !hasActioned
      })
    }
    case 'my-requests': {
      // Sign-offs submitted by the current user that are still open
      return signOffs.filter(
        (s) =>
          s.submittedBy.id === userId &&
          s.status !== 'APPROVED' &&
          s.status !== 'REJECTED' &&
          s.status !== 'WITHDRAWN',
      )
    }
    case 'awaiting-approval': {
      // All sign-offs in SUBMITTED or HAS_COMMENTS status
      return signOffs.filter(
        (s) => s.status === 'SUBMITTED' || s.status === 'HAS_COMMENTS',
      )
    }
    case 'approved': {
      return signOffs.filter((s) => s.status === 'APPROVED')
    }
    case 'trials': {
      return signOffs.filter((s) => s.isTrial)
    }
    default:
      return signOffs
  }
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
      case 'trialEndDate': {
        const aDate = a.trialEndDate ? new Date(a.trialEndDate).getTime() : Infinity
        const bDate = b.trialEndDate ? new Date(b.trialEndDate).getTime() : Infinity
        return dir * (aDate - bDate)
      }
      default:
        return 0
    }
  })

  return sorted
}

export function useSignOffFilters(signOffs: SignOffSummary[], userId: string) {
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

  const setView = useCallback(
    (view: SignOffView) => {
      pushFilters({ ...filters, view })
    },
    [filters, pushFilters],
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
      view: filters.view,
      search: '',
      statuses: [],
      department: null,
      categories: [],
      sort: DEFAULT_SORT,
    })
  }, [filters.view, pushFilters])

  const hasActiveFilters =
    filters.search !== '' ||
    filters.statuses.length > 0 ||
    filters.department !== null ||
    filters.categories.length > 0

  // Compute counts for each view (based on full unfiltered list)
  const viewCounts = useMemo(
    () => ({
      all: signOffs.length,
      'needs-my-review': applyView(signOffs, 'needs-my-review', userId).length,
      'my-requests': applyView(signOffs, 'my-requests', userId).length,
      'awaiting-approval': applyView(signOffs, 'awaiting-approval', userId).length,
      approved: applyView(signOffs, 'approved', userId).length,
      trials: applyView(signOffs, 'trials', userId).length,
    }),
    [signOffs, userId],
  )

  // Apply view first, then filters, then sort
  const filtered = useMemo(() => {
    let result = applyView(signOffs, filters.view, userId)

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
  }, [signOffs, filters, userId])

  return {
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
  }
}
