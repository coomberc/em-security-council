'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { MarkdownContent } from '@/components/shared/markdown-content'
import { useCurrentUser } from '@/providers/user-provider'
import { addCommentAction } from '@/app/actions/sign-offs'
import { formatTimeAgo } from '@/lib/format'
import { toast } from 'sonner'
import type { SignOffComment } from '@/types'

interface SignOffCommentsProps {
  comments: SignOffComment[]
  signOffId: string
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

interface CommentNodeProps {
  comment: SignOffComment
  replies: SignOffComment[]
  allComments: SignOffComment[]
  signOffId: string
}

function CommentNode({ comment, replies, allComments, signOffId }: CommentNodeProps) {
  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <Avatar size="sm" className="mt-0.5">
          {comment.author.avatarUrl && (
            <AvatarImage src={comment.author.avatarUrl} alt={comment.author.name} />
          )}
          <AvatarFallback>{getInitials(comment.author.name)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{comment.author.name}</span>
            <span className="text-xs text-muted-foreground">
              {formatTimeAgo(comment.createdAt)}
            </span>
          </div>
          <div className="mt-1">
            <MarkdownContent content={comment.content} className="text-sm" />
          </div>
        </div>
      </div>

      {/* Threaded replies */}
      {replies.length > 0 && (
        <div className="ml-9 space-y-3 border-l-2 border-border pl-4">
          {replies.map((reply) => {
            const nestedReplies = allComments.filter((c) => c.parentId === reply.id)
            return (
              <CommentNode
                key={reply.id}
                comment={reply}
                replies={nestedReplies}
                allComments={allComments}
                signOffId={signOffId}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

export function SignOffComments({ comments, signOffId }: SignOffCommentsProps) {
  const { currentUser } = useCurrentUser()
  const router = useRouter()
  const [content, setContent] = useState('')
  const [isPending, startTransition] = useTransition()

  const topLevelComments = comments
    .filter((c) => !c.parentId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

  function handleSubmit() {
    if (!content.trim()) return

    startTransition(async () => {
      const result = await addCommentAction(signOffId, currentUser.id, content.trim())
      if (result.success) {
        setContent('')
        router.refresh()
        toast.success('Comment added')
      } else {
        toast.error(result.error ?? 'Failed to add comment')
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Existing comments */}
      {topLevelComments.length > 0 ? (
        <div className="space-y-4">
          {topLevelComments.map((comment) => {
            const replies = comments.filter((c) => c.parentId === comment.id)
            return (
              <CommentNode
                key={comment.id}
                comment={comment}
                replies={replies}
                allComments={comments}
                signOffId={signOffId}
              />
            )
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No comments yet.</p>
      )}

      {/* New comment form */}
      <div className="space-y-3">
        <div className="flex gap-3">
          <Avatar size="sm" className="mt-0.5">
            {currentUser.avatarUrl && (
              <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} />
            )}
            <AvatarFallback>{getInitials(currentUser.name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <Textarea
              placeholder="Add a comment..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isPending}
              className="min-h-[80px]"
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={isPending || !content.trim()}
          >
            {isPending ? 'Posting...' : 'Add Comment'}
          </Button>
        </div>
      </div>
    </div>
  )
}
