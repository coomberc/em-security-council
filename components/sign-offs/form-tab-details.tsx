'use client'

import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  SupportingDocsEditor,
  type SupportingDoc,
} from '@/components/sign-offs/supporting-docs-editor'
import {
  CustomSectionsEditor,
  type CustomSection,
} from '@/components/sign-offs/custom-sections-editor'

export interface DetailsFormData {
  description: string
  dueDiligence: string
  rollOutPlan: string
  cost: string
  trialDuration: string
  trialEndDate: string
  trialDataAccessScope: string
  trialSuccessCriteria: string
  trialGoLiveRolloutPlan: string
  supportingDocs: SupportingDoc[]
  customSections: CustomSection[]
}

interface FormTabDetailsProps {
  data: DetailsFormData
  isTrial: boolean
  onChange: (data: DetailsFormData) => void
}

export function FormTabDetails({ data, isTrial, onChange }: FormTabDetailsProps) {
  function update(partial: Partial<DetailsFormData>) {
    onChange({ ...data, ...partial })
  }

  return (
    <div className="space-y-8">
      {/* Trial fields */}
      {isTrial && (
        <div className="rounded-lg border-2 border-[#FFB900] bg-[#fef3c7]/50 p-5 space-y-4 dark:border-[#fbbf24]/30 dark:bg-[#fbbf24]/10/30">
          <h3 className="text-sm font-semibold text-[#92400e] dark:text-[#fcd34d]">
            Trial / Pilot Details
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="trialDuration" className="text-sm font-medium">
                Trial Duration
              </Label>
              <Input
                id="trialDuration"
                placeholder="e.g. 3 months"
                value={data.trialDuration}
                onChange={(e) => update({ trialDuration: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="trialEndDate" className="text-sm font-medium">
                Trial End Date
              </Label>
              <Input
                id="trialEndDate"
                type="date"
                value={data.trialEndDate}
                onChange={(e) => update({ trialEndDate: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="trialDataAccessScope" className="text-sm font-medium">
              Data Access Scope
            </Label>
            <p className="text-xs text-muted-foreground">
              Describe what data the trial will have access to and any restrictions.
            </p>
            <Textarea
              id="trialDataAccessScope"
              placeholder="Describe data access scope during the trial..."
              value={data.trialDataAccessScope}
              onChange={(e) => update({ trialDataAccessScope: e.target.value })}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="trialSuccessCriteria" className="text-sm font-medium">
              Success Criteria
            </Label>
            <p className="text-xs text-muted-foreground">
              Define measurable criteria that will determine if the trial is successful.
            </p>
            <Textarea
              id="trialSuccessCriteria"
              placeholder="Define what success looks like for this trial..."
              value={data.trialSuccessCriteria}
              onChange={(e) => update({ trialSuccessCriteria: e.target.value })}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="trialGoLiveRolloutPlan" className="text-sm font-medium">
              Go-Live Rollout Plan
            </Label>
            <p className="text-xs text-muted-foreground">
              Outline the plan for transitioning from trial to full rollout if
              the trial succeeds.
            </p>
            <Textarea
              id="trialGoLiveRolloutPlan"
              placeholder="Describe the go-live rollout plan..."
              value={data.trialGoLiveRolloutPlan}
              onChange={(e) => update({ trialGoLiveRolloutPlan: e.target.value })}
              rows={3}
            />
          </div>
        </div>
      )}

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description" className="text-sm font-medium">
          Description
        </Label>
        <p className="text-xs text-muted-foreground">
          Provide a clear overview of what is being requested and why. Supports markdown.
        </p>
        <Textarea
          id="description"
          placeholder="Describe the request in detail..."
          value={data.description}
          onChange={(e) => update({ description: e.target.value })}
          rows={6}
        />
      </div>

      <Separator />

      {/* Due Diligence */}
      <div className="space-y-2">
        <Label htmlFor="dueDiligence" className="text-sm font-medium">
          Due Diligence
        </Label>
        <p className="text-xs text-muted-foreground">
          Document the research and evaluation performed. Include alternatives
          considered, reference checks, and any proof-of-concept results. Supports markdown.
        </p>
        <Textarea
          id="dueDiligence"
          placeholder="Describe the due diligence performed..."
          value={data.dueDiligence}
          onChange={(e) => update({ dueDiligence: e.target.value })}
          rows={5}
        />
      </div>

      <Separator />

      {/* Roll Out Plan */}
      <div className="space-y-2">
        <Label htmlFor="rollOutPlan" className="text-sm font-medium">
          Roll Out Plan
        </Label>
        <p className="text-xs text-muted-foreground">
          Describe the implementation timeline, phases, affected teams, and any
          rollback procedures. Supports markdown.
        </p>
        <Textarea
          id="rollOutPlan"
          placeholder="Outline the rollout plan..."
          value={data.rollOutPlan}
          onChange={(e) => update({ rollOutPlan: e.target.value })}
          rows={5}
        />
      </div>

      <Separator />

      {/* Cost */}
      <div className="space-y-2">
        <Label htmlFor="cost" className="text-sm font-medium">
          Cost
        </Label>
        <p className="text-xs text-muted-foreground">
          Provide cost details including licensing fees, implementation costs,
          ongoing maintenance, and any budget codes. Supports markdown.
        </p>
        <Textarea
          id="cost"
          placeholder="Describe costs and budget impact..."
          value={data.cost}
          onChange={(e) => update({ cost: e.target.value })}
          rows={4}
        />
      </div>

      <Separator />

      {/* Supporting Documents/Links */}
      <SupportingDocsEditor
        docs={data.supportingDocs}
        onChange={(supportingDocs) => update({ supportingDocs })}
      />

      <Separator />

      {/* Custom Sections */}
      <CustomSectionsEditor
        sections={data.customSections}
        onChange={(customSections) => update({ customSections })}
      />
    </div>
  )
}
