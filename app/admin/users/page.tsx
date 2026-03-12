import { getUsers, getDepartments } from '@/lib/db/queries'
import { UserManager } from './user-manager'

export default async function UsersPage() {
  const [users, departments] = await Promise.all([getUsers(), getDepartments()])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Users</h1>
        <p className="text-muted-foreground text-sm">
          Manage users, roles, and approver assignments.
        </p>
      </div>
      <UserManager users={users} departments={departments} />
    </div>
  )
}
