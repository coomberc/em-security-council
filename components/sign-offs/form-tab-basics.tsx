'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useDepartments } from '@/providers/departments-provider'
import { SIGN_OFF_CATEGORIES, type SignOffCategory } from '@/types'
import {
  CATEGORY_LABELS,
  CATEGORY_DESCRIPTIONS,
  getRiskAssessmentRequirement,
} from '@/lib/constants'
import { AlertTriangle, Check, Info, ShieldAlert } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface BasicsFormData {
  title: string
  departmentId: string
  categories: SignOffCategory[]
  vendorName: string
  vendorWebsite: string
  isTrial: boolean
}

interface FormTabBasicsProps {
  data: BasicsFormData
  onChange: (data: BasicsFormData) => void
}

const categoryOptions = SIGN_OFF_CATEGORIES.map((c) => ({
  value: c,
  label: CATEGORY_LABELS[c],
  description: CATEGORY_DESCRIPTIONS[c],
})).sort((a, b) => a.label.localeCompare(b.label))

export function FormTabBasics({ data, onChange }: FormTabBasicsProps) {
  const departments = useDepartments()
  const activeDepartments = departments.filter((d) => !d.archivedAt)

  const riskRequirement = data.categories.length > 0
    ? getRiskAssessmentRequirement(data.categories)
    : null

  function update(partial: Partial<BasicsFormData>) {
    onChange({ ...data, ...partial })
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title" className="text-sm font-medium">
          Title <span className="text-destructive">*</span>
        </Label>
        <Input
          id="title"
          placeholder="Give your sign-off request a clear, descriptive title"
          value={data.title}
          onChange={(e) => update({ title: e.target.value })}
        />
      </div>

      {/* Department */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Department <span className="text-destructive">*</span>
        </Label>
        <Select
          value={data.departmentId}
          onValueChange={(v) => update({ departmentId: v })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select department" />
          </SelectTrigger>
          <SelectContent>
            {activeDepartments.map((dept) => (
              <SelectItem key={dept.id} value={dept.id}>
                {dept.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Categories */}
      <div className="space-y-3">
        <div>
          <Label className="text-sm font-medium">
            Categories <span className="text-destructive">*</span>
          </Label>
          <p className="text-xs text-muted-foreground mt-1">
            Select all categories that apply to this request.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {categoryOptions.map((option) => {
            const selected = data.categories.includes(option.value as SignOffCategory)
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  const cats = selected
                    ? data.categories.filter((c) => c !== option.value)
                    : [...data.categories, option.value as SignOffCategory]
                  update({ categories: cats })
                }}
                className={cn(
                  'relative text-left rounded-lg border p-3 transition-all',
                  selected
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border hover:border-muted-foreground/30 hover:bg-muted/50',
                )}
              >
                {selected && (
                  <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
                <span className="text-sm font-medium block pr-6">{option.label}</span>
                <span className="text-xs text-muted-foreground leading-relaxed block mt-1">
                  {option.description}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Risk assessment banner */}
      {riskRequirement && (
        <RiskAssessmentBanner requirement={riskRequirement} />
      )}

      {/* Vendor Name */}
      <div className="space-y-2">
        <Label htmlFor="vendorName" className="text-sm font-medium">
          Vendor Name
        </Label>
        <p className="text-xs text-muted-foreground">
          If this involves an external vendor or supplier, enter their name.
        </p>
        <Input
          id="vendorName"
          placeholder="e.g. Acme Corp"
          value={data.vendorName}
          onChange={(e) => update({ vendorName: e.target.value })}
        />
      </div>

      {/* Vendor Website — only visible when vendor name is entered */}
      {data.vendorName.trim() && (
        <div className="space-y-2">
          <Label htmlFor="vendorWebsite" className="text-sm font-medium">
            Vendor Website
          </Label>
          <Input
            id="vendorWebsite"
            type="url"
            placeholder="https://vendor.com"
            value={data.vendorWebsite}
            onChange={(e) => update({ vendorWebsite: e.target.value })}
          />
        </div>
      )}

      {/* Trial toggle */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Switch
            id="isTrial"
            checked={data.isTrial}
            onCheckedChange={(checked) =>
              update({ isTrial: checked === true })
            }
            className={data.isTrial ? 'data-[state=checked]:bg-[#f59e0b]' : ''}
          />
          <Label htmlFor="isTrial" className="text-sm font-medium cursor-pointer">
            Is this a trial/pilot?
          </Label>
        </div>
        {data.isTrial && (
          <div className="rounded-md border border-[#FFB900] bg-[#fef3c7] px-3 py-2 text-xs text-[#92400e] dark:border-[#fbbf24]/30 dark:bg-[#fbbf24]/10 dark:text-[#fcd34d]">
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              <span>
                Trial/pilot mode enabled. You will be asked for additional details
                on the Details tab, including trial duration and success criteria.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function RiskAssessmentBanner({
  requirement,
}: {
  requirement: 'required' | 'optional'
}) {
  if (requirement === 'required') {
    return (
      <div className="rounded-md border border-[#fca5a5] bg-[#fef2f2] px-3 py-2 text-sm text-[#b91c1c] dark:border-[#7f1d1d] dark:bg-[#450a0a] dark:text-[#fca5a5]">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span className="font-medium">Risk assessment required</span>
        </div>
        <p className="mt-1 text-xs">
          Based on the selected categories, a risk assessment must be completed
          before this request can be submitted.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-md border border-[#d1d5db] bg-[#f9fafb] px-3 py-2 text-sm text-foreground dark:border-[#4b5563] dark:bg-[#1f2937]">
      <div className="flex items-center gap-2">
        <Info className="h-4 w-4 shrink-0" />
        <span className="font-medium">Risk assessment optional</span>
      </div>
      <p className="mt-1 text-xs">
        A risk assessment is available but not required for the selected
        categories. You can complete one on the Risk Assessment tab.
      </p>
    </div>
  )
}
