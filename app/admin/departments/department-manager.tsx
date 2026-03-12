'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Department } from '@/types'
import {
  createDepartmentAction,
  updateDepartmentAction,
  archiveDepartmentAction,
  unarchiveDepartmentAction,
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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { PlusIcon, PencilIcon, ArchiveIcon, ArchiveRestoreIcon } from 'lucide-react'

// ---------------------------------------------------------------------------
// Add Department Dialog
// ---------------------------------------------------------------------------

function AddDepartmentDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [error, setError] = useState<string | undefined>()
  const [loading, setLoading] = useState(false)

  function handleNameChange(value: string) {
    setName(value)
    setSlug(
      value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, ''),
    )
  }

  async function handleSubmit() {
    setError(undefined)
    setLoading(true)
    const result = await createDepartmentAction({ name: name.trim(), slug: slug.trim() })
    setLoading(false)

    if (!result.success) {
      setError(result.error)
      return
    }

    setOpen(false)
    setName('')
    setSlug('')
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <PlusIcon /> Add Department
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Department</DialogTitle>
          <DialogDescription>Create a new department.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="add-dept-name">Name</Label>
            <Input
              id="add-dept-name"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Engineering"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="add-dept-slug">Slug</Label>
            <Input
              id="add-dept-slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="e.g. engineering"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !name.trim() || !slug.trim()}>
            {loading ? 'Creating...' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Edit Department Dialog
// ---------------------------------------------------------------------------

function EditDepartmentDialog({ department }: { department: Department }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(department.name)
  const [slug, setSlug] = useState(department.slug)
  const [error, setError] = useState<string | undefined>()
  const [loading, setLoading] = useState(false)

  function handleOpen(isOpen: boolean) {
    setOpen(isOpen)
    if (isOpen) {
      setName(department.name)
      setSlug(department.slug)
      setError(undefined)
    }
  }

  async function handleSubmit() {
    setError(undefined)
    setLoading(true)
    const result = await updateDepartmentAction(department.id, {
      name: name.trim(),
      slug: slug.trim(),
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
          <DialogTitle>Edit Department</DialogTitle>
          <DialogDescription>Update the department details.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor={`edit-dept-name-${department.id}`}>Name</Label>
            <Input
              id={`edit-dept-name-${department.id}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`edit-dept-slug-${department.id}`}>Slug</Label>
            <Input
              id={`edit-dept-slug-${department.id}`}
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !name.trim() || !slug.trim()}>
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Archive / Unarchive Button
// ---------------------------------------------------------------------------

function ArchiveToggleButton({ department }: { department: Department }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const isArchived = !!department.archivedAt

  async function handleToggle() {
    setLoading(true)
    if (isArchived) {
      await unarchiveDepartmentAction(department.id)
    } else {
      await archiveDepartmentAction(department.id)
    }
    setLoading(false)
    router.refresh()
  }

  return (
    <Button
      variant="ghost"
      size="icon-xs"
      onClick={handleToggle}
      disabled={loading}
      title={isArchived ? 'Unarchive' : 'Archive'}
    >
      {isArchived ? <ArchiveRestoreIcon /> : <ArchiveIcon />}
    </Button>
  )
}

// ---------------------------------------------------------------------------
// DepartmentManager
// ---------------------------------------------------------------------------

export function DepartmentManager({ departments }: { departments: Department[] }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <AddDepartmentDialog />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {departments.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  No departments yet.
                </TableCell>
              </TableRow>
            )}
            {departments.map((dept) => (
              <TableRow
                key={dept.id}
                className={dept.archivedAt ? 'opacity-60' : undefined}
              >
                <TableCell className="font-medium">{dept.name}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {dept.slug}
                </TableCell>
                <TableCell>
                  {dept.archivedAt ? (
                    <Badge variant="secondary">Archived</Badge>
                  ) : (
                    <Badge variant="outline">Active</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <EditDepartmentDialog department={dept} />
                    <ArchiveToggleButton department={dept} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
