'use client'

import { useState } from 'react'
import { Check, ChevronDown, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface Option {
  value: string
  label: string
  description?: string
}

interface MultiSelectProps {
  value: string[]
  onChange: (values: string[]) => void
  options: Option[]
  placeholder: string
  className?: string
  searchable?: boolean
}

export function MultiSelect({
  value,
  onChange,
  options,
  placeholder,
  className,
  searchable,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  function getTriggerLabel(): string {
    if (value.length === 0) return placeholder
    if (value.length === 1) {
      return options.find((o) => o.value === value[0])?.label ?? value[0]
    }
    return `${placeholder} (${value.length})`
  }

  function toggleOption(optionValue: string) {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue))
    } else {
      onChange([...value, optionValue])
    }
  }

  function handleOpenChange(isOpen: boolean) {
    setOpen(isOpen)
    if (!isOpen) setSearch('')
  }

  const filteredOptions = searchable && search
    ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
    : options

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'h-9 text-sm justify-between font-normal',
            value.length > 0 && 'border-primary text-foreground',
            className,
          )}
        >
          <span className="truncate">{getTriggerLabel()}</span>
          <ChevronDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[420px] max-w-[calc(100vw-2rem)] p-2" align="start">
        {searchable && (
          <div className="flex items-center gap-1.5 border-b pb-2 mb-2">
            <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
            />
          </div>
        )}
        <div className="space-y-0.5 max-h-[320px] overflow-y-auto">
          {filteredOptions.length === 0 ? (
            <p className="px-2 py-1.5 text-sm text-muted-foreground">No results</p>
          ) : (
            filteredOptions.map((option) => {
              const checked = value.includes(option.value)
              return (
                <label
                  key={option.value}
                  className="flex items-start gap-2.5 rounded-md px-2.5 py-2 text-sm cursor-pointer hover:bg-muted"
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => toggleOption(option.value)}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="font-medium block">{option.label}</span>
                    {option.description && (
                      <span className="text-xs text-muted-foreground leading-relaxed block mt-0.5">{option.description}</span>
                    )}
                  </div>
                  {checked && <Check className="ml-auto h-4 w-4 text-primary shrink-0 mt-0.5" />}
                </label>
              )
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
