'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { User, Department, UserRole } from '@/types'
import { USER_ROLES } from '@/types'
import {
  createUserAction,
  updateUserAction,
  deleteUserAction,
} from '@/app/actions/admin'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { PlusIcon, PencilIcon, Trash2Icon } from 'lucide-react'

const ROLE_LABELS: Record<UserRole, string> = {
  APPROVER: 'Approver',
  COUNCIL_MEMBER: 'Council Member',
  STAFF_MEMBER: 'Staff Member',
}

// ---------------------------------------------------------------------------
// Add User Dialog
// ---------------------------------------------------------------------------

function AddUserDialog({ departments }: { departments: Department[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<UserRole>('STAFF_MEMBER')
  const [departmentId, setDepartmentId] = useState<string>('')
  const [isFixedApprover, setIsFixedApprover] = useState(false)
  const [error, setError] = useState<string | undefined>()
  const [loading, setLoading] = useState(false)

  const activeDepartments = departments.filter((d) => !d.archivedAt)

  function resetForm() {
    setName('')
    setEmail('')
    setRole('STAFF_MEMBER')
    setDepartmentId('')
    setIsFixedApprover(false)
    setError(undefined)
  }

  async function handleSubmit() {
    setError(undefined)
    setLoading(true)
    const result = await createUserAction({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role,
      isFixedApprover,
      departmentId: departmentId || undefined,
    })
    setLoading(false)

    if (!result.success) {
      setError(result.error)
      return
    }

    setOpen(false)
    resetForm()
    router.refresh()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen)
        if (isOpen) resetForm()
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">
          <PlusIcon /> Add User
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add User</DialogTitle>
          <DialogDescription>Create a new user account.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="add-user-name">Name</Label>
            <Input
              id="add-user-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Jane Smith"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="add-user-email">Email</Label>
            <Input
              id="add-user-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. jane.smith@equalsmoney.com"
            />
          </div>
          <div className="grid gap-2">
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {USER_ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Department</Label>
            <Select value={departmentId} onValueChange={setDepartmentId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No department</SelectItem>
                {activeDepartments.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-3">
            <Switch
              id="add-user-fixed-approver"
              checked={isFixedApprover}
              onCheckedChange={setIsFixedApprover}
            />
            <Label htmlFor="add-user-fixed-approver">Fixed Approver</Label>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !name.trim() || !email.trim()}>
            {loading ? 'Creating...' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Edit User Dialog
// ---------------------------------------------------------------------------

function EditUserDialog({
  user,
  departments,
}: {
  user: User
  departments: Department[]
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [role, setRole] = useState<UserRole>(user.role)
  const [departmentId, setDepartmentId] = useState(user.departmentId ?? '')
  const [isFixedApprover, setIsFixedApprover] = useState(user.isFixedApprover)
  const [error, setError] = useState<string | undefined>()
  const [loading, setLoading] = useState(false)

  const activeDepartments = departments.filter((d) => !d.archivedAt)

  function handleOpen(isOpen: boolean) {
    setOpen(isOpen)
    if (isOpen) {
      setName(user.name)
      setEmail(user.email)
      setRole(user.role)
      setDepartmentId(user.departmentId ?? '')
      setIsFixedApprover(user.isFixedApprover)
      setError(undefined)
    }
  }

  async function handleSubmit() {
    setError(undefined)
    setLoading(true)
    const result = await updateUserAction(user.id, {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role,
      isFixedApprover,
      departmentId: departmentId && departmentId !== 'none' ? departmentId : null,
    })
    setLoading(false)

    if (!result.success) {
      setError(result.error)
      return
    }

    setOpen(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon-xs">
          <PencilIcon />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>Update user details and role.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor={`edit-user-name-${user.id}`}>Name</Label>
            <Input
              id={`edit-user-name-${user.id}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`edit-user-email-${user.id}`}>Email</Label>
            <Input
              id={`edit-user-email-${user.id}`}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {USER_ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Department</Label>
            <Select value={departmentId || 'none'} onValueChange={setDepartmentId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No department</SelectItem>
                {activeDepartments.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-3">
            <Switch
              id={`edit-user-fixed-approver-${user.id}`}
              checked={isFixedApprover}
              onCheckedChange={setIsFixedApprover}
            />
            <Label htmlFor={`edit-user-fixed-approver-${user.id}`}>Fixed Approver</Label>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !name.trim() || !email.trim()}>
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Delete User Dialog
// ---------------------------------------------------------------------------

function DeleteUserDialog({ user }: { user: User }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | undefined>()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setError(undefined)
    setLoading(true)
    const result = await deleteUserAction(user.id)
    setLoading(false)

    if (!result.success) {
      setError(result.error)
      return
    }

    setOpen(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon-xs">
          <Trash2Icon className="text-destructive" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete User</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <strong>{user.name}</strong>? This action cannot be
            undone.
          </DialogDescription>
        </DialogHeader>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={loading}>
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// UserManager
// ---------------------------------------------------------------------------

export function UserManager({
  users,
  departments,
}: {
  users: User[]
  departments: Department[]
}) {
  const departmentMap = new Map(departments.map((d) => [d.id, d]))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <AddUserDialog departments={departments} />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Fixed Approver</TableHead>
              <TableHead className="w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No users yet.
                </TableCell>
              </TableRow>
            )}
            {users.map((user) => {
              const dept = user.departmentId ? departmentMap.get(user.departmentId) : undefined
              return (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        user.role === 'APPROVER'
                          ? 'default'
                          : user.role === 'COUNCIL_MEMBER'
                            ? 'secondary'
                            : 'outline'
                      }
                    >
                      {ROLE_LABELS[user.role]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {dept ? dept.name : '-'}
                  </TableCell>
                  <TableCell>
                    {user.isFixedApprover ? (
                      <Badge variant="default">Yes</Badge>
                    ) : (
                      <span className="text-muted-foreground">No</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <EditUserDialog user={user} departments={departments} />
                      <DeleteUserDialog user={user} />
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
