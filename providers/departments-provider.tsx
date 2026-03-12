'use client'

import { createContext, useContext, type ReactNode } from 'react'
import type { Department } from '@/types'

interface DepartmentsContextValue {
  departments: Department[]
}

const DepartmentsContext = createContext<DepartmentsContextValue | null>(null)

interface DepartmentsProviderProps {
  children: ReactNode
  departments: Department[]
}

export function DepartmentsProvider({ children, departments }: DepartmentsProviderProps) {
  return (
    <DepartmentsContext.Provider value={{ departments }}>
      {children}
    </DepartmentsContext.Provider>
  )
}

export function useDepartments(): Department[] {
  const context = useContext(DepartmentsContext)
  if (!context) {
    throw new Error('useDepartments must be used within a DepartmentsProvider')
  }
  return context.departments
}
