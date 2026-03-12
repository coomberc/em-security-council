'use client'

import { useState } from 'react'
import { Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

export interface CustomSection {
  title: string
  content: string
  sortOrder: number
}

interface CustomSectionsEditorProps {
  sections: CustomSection[]
  onChange: (sections: CustomSection[]) => void
}

export function CustomSectionsEditor({ sections, onChange }: CustomSectionsEditorProps) {
  const [newTitle, setNewTitle] = useState('')

  function handleAdd() {
    const title = newTitle.trim()
    if (!title) return

    const nextOrder = sections.length > 0
      ? Math.max(...sections.map((s) => s.sortOrder)) + 1
      : 0

    onChange([...sections, { title, content: '', sortOrder: nextOrder }])
    setNewTitle('')
  }

  function handleRemove(index: number) {
    const updated = sections.filter((_, i) => i !== index)
    // Re-normalize sort orders
    onChange(updated.map((s, i) => ({ ...s, sortOrder: i })))
  }

  function handleTitleChange(index: number, title: string) {
    onChange(sections.map((s, i) => (i === index ? { ...s, title } : s)))
  }

  function handleContentChange(index: number, content: string) {
    onChange(sections.map((s, i) => (i === index ? { ...s, content } : s)))
  }

  function handleMoveUp(index: number) {
    if (index === 0) return
    const updated = [...sections]
    const temp = updated[index - 1]
    updated[index - 1] = { ...updated[index], sortOrder: index - 1 }
    updated[index] = { ...temp, sortOrder: index }
    onChange(updated)
  }

  function handleMoveDown(index: number) {
    if (index === sections.length - 1) return
    const updated = [...sections]
    const temp = updated[index + 1]
    updated[index + 1] = { ...updated[index], sortOrder: index + 1 }
    updated[index] = { ...temp, sortOrder: index }
    onChange(updated)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd()
    }
  }

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Custom Sections</Label>
      <p className="text-xs text-muted-foreground">
        Add additional sections with custom titles and markdown content.
      </p>

      {sections.length > 0 && (
        <div className="space-y-4">
          {sections.map((section, index) => (
            <div
              key={index}
              className="rounded-lg border bg-muted/20 p-4 space-y-3"
            >
              <div className="flex items-center gap-2">
                <Input
                  value={section.title}
                  onChange={(e) => handleTitleChange(index, e.target.value)}
                  placeholder="Section title"
                  className="h-8 text-sm font-medium flex-1"
                />
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => handleMoveDown(index)}
                    disabled={index === sections.length - 1}
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </Button>
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
              </div>
              <Textarea
                value={section.content}
                onChange={(e) => handleContentChange(index, e.target.value)}
                placeholder="Markdown content..."
                rows={4}
                className="text-sm"
              />
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2">
        <div className="flex-1 space-y-1">
          <Label htmlFor="section-title" className="text-xs">
            New section title
          </Label>
          <Input
            id="section-title"
            placeholder="Enter section title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
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
          disabled={!newTitle.trim()}
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          Add Section
        </Button>
      </div>
    </div>
  )
}
