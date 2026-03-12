'use client'

import ReactMarkdown from 'react-markdown'
import type { Components } from 'react-markdown'

const components: Components = {
  // Open links in new tab
  a: ({ children, href, ...props }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
      {children}
    </a>
  ),
  // Prevent images from being too large
  img: ({ alt, src, ...props }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt ?? ''} src={src} className="max-w-full rounded" {...props} />
  ),
  // Render code blocks with monospace
  code: ({ children, className, ...props }) => {
    const isBlock = className?.includes('language-')
    if (isBlock) {
      return (
        <code className={className} {...props}>
          {children}
        </code>
      )
    }
    return (
      <code className="rounded bg-muted px-1.5 py-0.5 text-sm" {...props}>
        {children}
      </code>
    )
  },
  pre: ({ children, ...props }) => (
    <pre className="overflow-x-auto rounded-lg bg-muted p-4" {...props}>
      {children}
    </pre>
  ),
}

interface MarkdownContentProps {
  content: string
  className?: string
}

export function MarkdownContent({ content, className }: MarkdownContentProps) {
  if (!content.trim()) return null

  return (
    <div className={`prose prose-sm dark:prose-invert max-w-none text-foreground ${className ?? ''}`}>
      <ReactMarkdown components={components}>{content}</ReactMarkdown>
    </div>
  )
}
