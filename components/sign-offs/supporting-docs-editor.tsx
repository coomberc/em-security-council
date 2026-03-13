'use client'

import { useState } from 'react'
import { Plus, Trash2, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export interface SupportingDoc {
  title: string
  url: string
}

interface SupportingDocsEditorProps {
  docs: SupportingDoc[]
  onChange: (docs: SupportingDoc[]) => void
}

export function SupportingDocsEditor({ docs, onChange }: SupportingDocsEditorProps) {
  const [newTitle, setNewTitle] = useState('')
  const [newUrl, setNewUrl] = useState('')

  function handleAdd() {
    const title = newTitle.trim()
    const url = newUrl.trim()
    if (!title || !url) return

    onChange([...docs, { title, url }])
    setNewTitle('')
    setNewUrl('')
  }

  function handleRemove(index: number) {
    onChange(docs.filter((_, i) => i !== index))
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd()
    }
  }

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Supporting Documents/Links</Label>
      <p className="text-xs text-muted-foreground">
        Add links to relevant documents, reports, or resources.
      </p>

      {docs.length > 0 && (
        <div className="space-y-2">
          {docs.map((doc, index) => (
            <div
              key={index}
              className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2"
            >
              <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-[#2563eb] dark:text-[#60a5fa] hover:underline truncate block"
                >
                  {doc.title}
                </a>
                <span className="text-xs text-muted-foreground truncate block">
                  {doc.url}
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                onClick={() => handleRemove(index)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2">
        <div className="flex-1 space-y-1">
          <Label htmlFor="doc-title" className="text-xs">
            Title
          </Label>
          <Input
            id="doc-title"
            placeholder="Document title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-8 text-sm"
          />
        </div>
        <div className="flex-1 space-y-1">
          <Label htmlFor="doc-url" className="text-xs">
            URL
          </Label>
          <Input
            id="doc-url"
            type="url"
            placeholder="https://..."
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-8 text-sm"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8"
          onClick={handleAdd}
          disabled={!newTitle.trim() || !newUrl.trim()}
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          Add
        </Button>
      </div>
    </div>
  )
}
