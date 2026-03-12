import { getDepartments } from '@/lib/db/queries'
import { DepartmentManager } from './department-manager'

export default async function DepartmentsPage() {
  const departments = await getDepartments()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Departments</h1>
        <p className="text-muted-foreground text-sm">
          Manage departments across the organisation.
        </p>
      </div>
      <DepartmentManager departments={departments} />
    </div>
  )
}
