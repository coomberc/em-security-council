'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { performSignOffAction } from '@/app/actions/sign-offs'
import { getAvailableActions } from '@/lib/state-machine'
import { formatSequenceNumber } from '@/lib/format'
import { toast } from 'sonner'
import {
  CheckCircle2,
  XCircle,
  MessageCircle,
  Send,
  RotateCcw,
  Archive,
  FolderOpen,
} from 'lucide-react'
import type { SignOffRequest, SignOffAction, User } from '@/types'

interface SignOffActionsProps {
  signOff: SignOffRequest
  user: User
}

const ACTION_CONFIG: Record<
  SignOffAction,
  {
    label: string
    variant: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost'
    icon: React.ReactNode
  }
> = {
  submit: { label: 'Submit for Approval', variant: 'default', icon: <Send className="h-4 w-4" /> },
  approve: { label: 'Approve', variant: 'default', icon: <CheckCircle2 className="h-4 w-4" /> },
  reject: { label: 'Reject', variant: 'destructive', icon: <XCircle className="h-4 w-4" /> },
  comment: { label: 'Request Changes', variant: 'outline', icon: <MessageCircle className="h-4 w-4" /> },
  withdraw: { label: 'Withdraw', variant: 'outline', icon: <Archive className="h-4 w-4" /> },
  resubmit: { label: 'Resubmit', variant: 'default', icon: <RotateCcw className="h-4 w-4" /> },
  reopen: { label: 'Reopen', variant: 'secondary', icon: <FolderOpen className="h-4 w-4" /> },
}

function SimpleActionButton({
  signOff,
  user,
  action,
}: {
  signOff: SignOffRequest
  user: User
  action: SignOffAction
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const config = ACTION_CONFIG[action]

  function handleClick() {
    startTransition(async () => {
      const result = await performSignOffAction(signOff.id, user.id, action)
      if (result.success) {
        router.refresh()
        toast.success(`Sign-off ${action === 'submit' ? 'submitted' : action === 'withdraw' ? 'withdrawn' : action === 'resubmit' ? 'resubmitted' : 'reopened'}`)
      } else {
        toast.error(result.error ?? `Failed to ${action}`)
      }
    })
  }

  return (
    <Button
      variant={config.variant}
      onClick={handleClick}
      disabled={isPending}
      className="w-full justify-start"
    >
      {config.icon}
      {isPending ? 'Processing...' : config.label}
    </Button>
  )
}

function ApproveDialog({
  signOff,
  user,
}: {
  signOff: SignOffRequest
  user: User
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [comment, setComment] = useState('')
  const [isPending, startTransition] = useTransition()
  const config = ACTION_CONFIG.approve

  function handleApprove() {
    startTransition(async () => {
      const result = await performSignOffAction(
        signOff.id,
        user.id,
        'approve',
        comment.trim() || undefined,
      )
      if (result.success) {
        setOpen(false)
        setComment('')
        router.refresh()
        toast.success('Sign-off approved')
      } else {
        toast.error(result.error ?? 'Failed to approve')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={config.variant} className="w-full justify-start">
          {config.icon}
          {config.label}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Approve Sign-Off</DialogTitle>
          <DialogDescription>
            You are approving {formatSequenceNumber(signOff.sequenceNumber)} &mdash; {signOff.title}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Attestation summary */}
          <div className="rounded-lg border bg-muted/50 p-3 text-sm space-y-1">
            <p className="font-medium">Attestation</p>
            <p className="text-muted-foreground">
              By approving, you attest that you have reviewed the content at version{' '}
              <span className="font-mono font-medium text-foreground">v{signOff.contentVersion}</span>{' '}
              and are satisfied it meets the required standards.
            </p>
          </div>

          {/* Optional comment */}
          <div className="space-y-2">
            <Label htmlFor="approve-comment">Comment (optional)</Label>
            <Textarea
              id="approve-comment"
              placeholder="Add an optional comment with your approval..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={isPending}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleApprove}
            disabled={isPending}
          >
            {isPending ? 'Approving...' : 'Confirm Approval'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function RejectDialog({
  signOff,
  user,
}: {
  signOff: SignOffRequest
  user: User
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [comment, setComment] = useState('')
  const [isPending, startTransition] = useTransition()
  const config = ACTION_CONFIG.reject

  function handleReject() {
    if (!comment.trim()) return

    startTransition(async () => {
      const result = await performSignOffAction(
        signOff.id,
        user.id,
        'reject',
        comment.trim(),
      )
      if (result.success) {
        setOpen(false)
        setComment('')
        router.refresh()
        toast.success('Sign-off rejected')
      } else {
        toast.error(result.error ?? 'Failed to reject')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={config.variant} className="w-full justify-start">
          {config.icon}
          {config.label}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject Sign-Off</DialogTitle>
          <DialogDescription>
            You are rejecting {formatSequenceNumber(signOff.sequenceNumber)} &mdash; {signOff.title}.
            A reason is required.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="reject-comment">Reason for rejection</Label>
          <Textarea
            id="reject-comment"
            placeholder="Explain why this sign-off is being rejected..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={isPending}
            className="min-h-[100px]"
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleReject}
            disabled={isPending || !comment.trim()}
          >
            {isPending ? 'Rejecting...' : 'Confirm Rejection'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function CommentDialog({
  signOff,
  user,
}: {
  signOff: SignOffRequest
  user: User
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [comment, setComment] = useState('')
  const [isPending, startTransition] = useTransition()
  const config = ACTION_CONFIG.comment

  function handleComment() {
    if (!comment.trim()) return

    startTransition(async () => {
      const result = await performSignOffAction(
        signOff.id,
        user.id,
        'comment',
        comment.trim(),
      )
      if (result.success) {
        setOpen(false)
        setComment('')
        router.refresh()
        toast.success('Changes requested')
      } else {
        toast.error(result.error ?? 'Failed to request changes')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={config.variant} className="w-full justify-start">
          {config.icon}
          {config.label}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request Changes</DialogTitle>
          <DialogDescription>
            Your feedback will move {formatSequenceNumber(signOff.sequenceNumber)} back to &ldquo;Has Comments&rdquo;
            so the submitter can address your concerns.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="changes-comment">What changes are needed?</Label>
          <Textarea
            id="changes-comment"
            placeholder="Describe the changes you'd like to see..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={isPending}
            className="min-h-[100px]"
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleComment}
            disabled={isPending || !comment.trim()}
          >
            {isPending ? 'Submitting...' : 'Request Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function SignOffActions({ signOff, user }: SignOffActionsProps) {
  const availableActions = getAvailableActions(user, signOff)

  if (availableActions.length === 0) return null

  return (
    <div className="space-y-2">
      {availableActions.map((action) => {
        switch (action) {
          case 'approve':
            return <ApproveDialog key={action} signOff={signOff} user={user} />
          case 'reject':
            return <RejectDialog key={action} signOff={signOff} user={user} />
          case 'comment':
            return <CommentDialog key={action} signOff={signOff} user={user} />
          case 'submit':
          case 'withdraw':
          case 'resubmit':
          case 'reopen':
            return (
              <SimpleActionButton
                key={action}
                signOff={signOff}
                user={user}
                action={action}
              />
            )
          default:
            return null
        }
      })}
    </div>
  )
}
