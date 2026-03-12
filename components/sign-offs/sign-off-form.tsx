'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { useCurrentUser } from '@/providers/user-provider'
import { useFormAutosave } from '@/hooks/use-form-autosave'
import {
  createSignOffAction,
  updateSignOffAction,
  performSignOffAction,
} from '@/app/actions/sign-offs'
import { FormTabBasics, type BasicsFormData } from './form-tab-basics'
import { FormTabDetails, type DetailsFormData } from './form-tab-details'
import { FormTabRisk, type RiskFormData } from './form-tab-risk'
import { FormTabReview } from './form-tab-review'
import { computeRiskScore } from '@/lib/constants'
import type {
  SignOffRequest,
  CreateSignOffInput,
  UpdateSignOffInput,
  CreateRiskAssessmentInput,
  DataClassification,
  RiskLikelihood,
  RiskImpact,
} from '@/types'
import { Save, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SignOffFormProps {
  existingSignOff?: SignOffRequest
}

interface FormState {
  basics: BasicsFormData
  details: DetailsFormData
  risk: RiskFormData
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

function getInitialBasics(existing?: SignOffRequest): BasicsFormData {
  return {
    title: existing?.title ?? '',
    departmentId: existing?.department?.id ?? '',
    categories: existing?.categories ?? [],
    vendorName: existing?.vendorName ?? '',
    vendorWebsite: existing?.vendorWebsite ?? '',
    isTrial: existing?.isTrial ?? false,
  }
}

function getInitialDetails(existing?: SignOffRequest): DetailsFormData {
  return {
    description: existing?.description ?? '',
    dueDiligence: existing?.dueDiligence ?? '',
    rollOutPlan: existing?.rollOutPlan ?? '',
    cost: existing?.cost ?? '',
    trialDuration: existing?.trialDuration ?? '',
    trialEndDate: existing?.trialEndDate ?? '',
    trialDataAccessScope: existing?.trialDataAccessScope ?? '',
    trialSuccessCriteria: existing?.trialSuccessCriteria ?? '',
    trialGoLiveRolloutPlan: existing?.trialGoLiveRolloutPlan ?? '',
    supportingDocs: existing?.supportingDocs?.map((d) => ({ title: d.title, url: d.url })) ?? [],
    customSections:
      existing?.customSections?.map((s) => ({
        title: s.title,
        content: s.content,
        sortOrder: s.sortOrder,
      })) ?? [],
  }
}

function getInitialRisk(existing?: SignOffRequest): RiskFormData {
  const ra = existing?.riskAssessment
  return {
    dataClassification: (ra?.dataClassification as DataClassification) ?? '',
    dataClassificationUnknown: ra?.dataClassificationUnknown ?? false,
    personalDataInvolved: ra?.personalDataInvolved ?? false,
    personalDataInvolvedUnknown: ra?.personalDataInvolvedUnknown ?? false,
    personalDataDetails: ra?.personalDataDetails ?? '',
    dataStorageLocation: ra?.dataStorageLocation ?? '',
    dataStorageLocationUnknown: ra?.dataStorageLocationUnknown ?? false,
    thirdPartyDataSharing: ra?.thirdPartyDataSharing ?? false,
    thirdPartyDataSharingUnknown: ra?.thirdPartyDataSharingUnknown ?? false,
    thirdPartyDataDetails: ra?.thirdPartyDataDetails ?? '',
    likelihoodOfBreach: (ra?.likelihoodOfBreach as RiskLikelihood) ?? '',
    likelihoodOfBreachUnknown: ra?.likelihoodOfBreachUnknown ?? false,
    impactOfBreach: (ra?.impactOfBreach as RiskImpact) ?? '',
    impactOfBreachUnknown: ra?.impactOfBreachUnknown ?? false,
    hasEncryptionAtRest: ra?.hasEncryptionAtRest ?? false,
    hasEncryptionAtRestUnknown: ra?.hasEncryptionAtRestUnknown ?? false,
    hasEncryptionInTransit: ra?.hasEncryptionInTransit ?? false,
    hasEncryptionInTransitUnknown: ra?.hasEncryptionInTransitUnknown ?? false,
    hasMfa: ra?.hasMfa ?? false,
    hasMfaUnknown: ra?.hasMfaUnknown ?? false,
    hasAuditLogging: ra?.hasAuditLogging ?? false,
    hasAuditLoggingUnknown: ra?.hasAuditLoggingUnknown ?? false,
    hasPenTestReport: ra?.hasPenTestReport ?? false,
    hasPenTestReportUnknown: ra?.hasPenTestReportUnknown ?? false,
    hasDisasterRecovery: ra?.hasDisasterRecovery ?? false,
    hasDisasterRecoveryUnknown: ra?.hasDisasterRecoveryUnknown ?? false,
    hasSso: ra?.hasSso ?? false,
    hasSsoUnknown: ra?.hasSsoUnknown ?? false,
    hasSla: ra?.hasSla ?? false,
    hasSlaUnknown: ra?.hasSlaUnknown ?? false,
    slaDetails: ra?.slaDetails ?? '',
    complianceCertifications: ra?.complianceCertifications ?? [],
    mitigationPlan: ra?.mitigationPlan ?? '',
    residualRiskNotes: ra?.residualRiskNotes ?? '',
  }
}

// ---------------------------------------------------------------------------
// Serialisation helpers
// ---------------------------------------------------------------------------

function buildRiskInput(risk: RiskFormData): CreateRiskAssessmentInput | undefined {
  // Only include risk assessment if at least one field has been touched
  const hasAnyValue =
    risk.dataClassification ||
    risk.dataClassificationUnknown ||
    risk.personalDataInvolved ||
    risk.personalDataInvolvedUnknown ||
    risk.likelihoodOfBreach ||
    risk.likelihoodOfBreachUnknown ||
    risk.impactOfBreach ||
    risk.impactOfBreachUnknown ||
    risk.dataStorageLocation ||
    risk.dataStorageLocationUnknown ||
    risk.thirdPartyDataSharing ||
    risk.thirdPartyDataSharingUnknown ||
    risk.mitigationPlan ||
    risk.residualRiskNotes ||
    risk.complianceCertifications.length > 0

  if (!hasAnyValue) return undefined

  return {
    dataClassification: risk.dataClassification || undefined,
    dataClassificationUnknown: risk.dataClassificationUnknown,
    personalDataInvolved: risk.personalDataInvolved,
    personalDataInvolvedUnknown: risk.personalDataInvolvedUnknown,
    personalDataDetails: risk.personalDataDetails || undefined,
    dataStorageLocation: risk.dataStorageLocation || undefined,
    dataStorageLocationUnknown: risk.dataStorageLocationUnknown,
    thirdPartyDataSharing: risk.thirdPartyDataSharing,
    thirdPartyDataSharingUnknown: risk.thirdPartyDataSharingUnknown,
    thirdPartyDataDetails: risk.thirdPartyDataDetails || undefined,
    likelihoodOfBreach: risk.likelihoodOfBreach || undefined,
    likelihoodOfBreachUnknown: risk.likelihoodOfBreachUnknown,
    impactOfBreach: risk.impactOfBreach || undefined,
    impactOfBreachUnknown: risk.impactOfBreachUnknown,
    hasEncryptionAtRest: risk.hasEncryptionAtRest,
    hasEncryptionAtRestUnknown: risk.hasEncryptionAtRestUnknown,
    hasEncryptionInTransit: risk.hasEncryptionInTransit,
    hasEncryptionInTransitUnknown: risk.hasEncryptionInTransitUnknown,
    hasMfa: risk.hasMfa,
    hasMfaUnknown: risk.hasMfaUnknown,
    hasAuditLogging: risk.hasAuditLogging,
    hasAuditLoggingUnknown: risk.hasAuditLoggingUnknown,
    hasPenTestReport: risk.hasPenTestReport,
    hasPenTestReportUnknown: risk.hasPenTestReportUnknown,
    hasDisasterRecovery: risk.hasDisasterRecovery,
    hasDisasterRecoveryUnknown: risk.hasDisasterRecoveryUnknown,
    hasSso: risk.hasSso,
    hasSsoUnknown: risk.hasSsoUnknown,
    hasSla: risk.hasSla,
    hasSlaUnknown: risk.hasSlaUnknown,
    slaDetails: risk.slaDetails || undefined,
    complianceCertifications: risk.complianceCertifications,
    mitigationPlan: risk.mitigationPlan || undefined,
    residualRiskNotes: risk.residualRiskNotes || undefined,
  }
}

function buildCreateInput(state: FormState): CreateSignOffInput {
  return {
    title: state.basics.title,
    departmentId: state.basics.departmentId,
    categories: state.basics.categories,
    vendorName: state.basics.vendorName || undefined,
    vendorWebsite: state.basics.vendorWebsite || undefined,
    description: state.details.description,
    dueDiligence: state.details.dueDiligence,
    rollOutPlan: state.details.rollOutPlan,
    cost: state.details.cost,
    isTrial: state.basics.isTrial,
    trialDuration: state.basics.isTrial ? state.details.trialDuration || undefined : undefined,
    trialDataAccessScope: state.basics.isTrial
      ? state.details.trialDataAccessScope || undefined
      : undefined,
    trialSuccessCriteria: state.basics.isTrial
      ? state.details.trialSuccessCriteria || undefined
      : undefined,
    trialGoLiveRolloutPlan: state.basics.isTrial
      ? state.details.trialGoLiveRolloutPlan || undefined
      : undefined,
    trialEndDate: state.basics.isTrial
      ? state.details.trialEndDate || undefined
      : undefined,
    customSections: state.details.customSections,
    supportingDocs: state.details.supportingDocs,
    riskAssessment: buildRiskInput(state.risk),
  }
}

function buildUpdateInput(state: FormState): UpdateSignOffInput {
  return {
    title: state.basics.title,
    departmentId: state.basics.departmentId,
    categories: state.basics.categories,
    vendorName: state.basics.vendorName || null,
    vendorWebsite: state.basics.vendorWebsite || null,
    description: state.details.description,
    dueDiligence: state.details.dueDiligence,
    rollOutPlan: state.details.rollOutPlan,
    cost: state.details.cost,
    isTrial: state.basics.isTrial,
    trialDuration: state.basics.isTrial ? state.details.trialDuration || null : null,
    trialDataAccessScope: state.basics.isTrial
      ? state.details.trialDataAccessScope || null
      : null,
    trialSuccessCriteria: state.basics.isTrial
      ? state.details.trialSuccessCriteria || null
      : null,
    trialGoLiveRolloutPlan: state.basics.isTrial
      ? state.details.trialGoLiveRolloutPlan || null
      : null,
    trialEndDate: state.basics.isTrial ? state.details.trialEndDate || null : null,
    customSections: state.details.customSections,
    supportingDocs: state.details.supportingDocs,
    riskAssessment: buildRiskInput(state.risk) ?? null,
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SignOffForm({ existingSignOff }: SignOffFormProps) {
  const router = useRouter()
  const { currentUser } = useCurrentUser()
  const isEditing = !!existingSignOff

  // Form state
  const [basics, setBasics] = useState<BasicsFormData>(() =>
    getInitialBasics(existingSignOff),
  )
  const [details, setDetails] = useState<DetailsFormData>(() =>
    getInitialDetails(existingSignOff),
  )
  const [risk, setRisk] = useState<RiskFormData>(() =>
    getInitialRisk(existingSignOff),
  )

  const TAB_ORDER = ['basics', 'details', 'risk', 'review'] as const
  const TAB_LABELS: Record<string, string> = {
    basics: 'Basics',
    details: 'Details',
    risk: 'Risk Assessment',
    review: 'Review & Submit',
  }

  const [activeTab, setActiveTab] = useState('basics')
  const [isSaving, setIsSaving] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Track the server-side ID once created (for new sign-offs that get saved as draft)
  const [signOffId, setSignOffId] = useState<string | undefined>(existingSignOff?.id)

  const formState: FormState = { basics, details, risk }

  // Autosave
  const autosaveKey = signOffId ?? 'new'
  const { hasDraft, recoveredDraft, acceptDraft, dismissDraft, saveNow, clearDraft } =
    useFormAutosave<FormState>({
      key: autosaveKey,
      data: formState,
      enabled: !isSubmitting,
    })

  // Apply recovered draft
  function handleAcceptDraft() {
    if (!recoveredDraft) return
    setBasics(recoveredDraft.basics)
    setDetails(recoveredDraft.details)
    setRisk(recoveredDraft.risk)
    acceptDraft()
    toast.success('Draft restored from local storage')
  }

  // Save draft to DB
  const saveDraft = useCallback(
    async (showToast = true) => {
      setIsSaving(true)
      try {
        if (signOffId) {
          // Update existing
          const result = await updateSignOffAction(
            signOffId,
            buildUpdateInput(formState),
            currentUser.id,
          )
          if (!result.success) {
            toast.error(result.error ?? 'Failed to save draft')
            return false
          }
        } else {
          // Create new
          const result = await createSignOffAction(
            buildCreateInput(formState),
            currentUser.id,
          )
          if (!result.success) {
            toast.error(result.error ?? 'Failed to create draft')
            return false
          }
          if (result.signOff) {
            setSignOffId(result.signOff.id)
          }
        }
        if (showToast) {
          toast.success('Draft saved')
        }
        return true
      } catch {
        toast.error('An unexpected error occurred while saving')
        return false
      } finally {
        setIsSaving(false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [signOffId, currentUser.id, formState],
  )

  // Save on tab switch
  async function handleTabChange(tab: string) {
    setActiveTab(tab)
    // Fire-and-forget save on tab switch (don't show toast to avoid noise)
    if (basics.title.trim() && basics.departmentId && basics.categories.length > 0) {
      saveDraft(false)
    } else {
      // At minimum save to localStorage
      saveNow()
    }
  }

  // Submit flow
  async function handleSubmit() {
    setIsSubmitting(true)
    try {
      let id = signOffId

      if (id) {
        // Update then submit
        const updateResult = await updateSignOffAction(
          id,
          buildUpdateInput(formState),
          currentUser.id,
        )
        if (!updateResult.success) {
          toast.error(updateResult.error ?? 'Failed to save before submitting')
          return
        }
      } else {
        // Create then submit
        const createResult = await createSignOffAction(
          buildCreateInput(formState),
          currentUser.id,
        )
        if (!createResult.success) {
          toast.error(createResult.error ?? 'Failed to create sign-off')
          return
        }
        id = createResult.signOff?.id
        if (!id) {
          toast.error('Failed to get sign-off ID after creation')
          return
        }
        setSignOffId(id)
      }

      // Perform submit action
      const submitResult = await performSignOffAction(id, currentUser.id, 'submit')
      if (!submitResult.success) {
        toast.error(submitResult.error ?? 'Failed to submit sign-off')
        return
      }

      clearDraft()
      toast.success('Sign-off submitted for approval')
      router.push(`/sign-offs/${id}`)
    } catch {
      toast.error('An unexpected error occurred during submission')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Draft recovery banner */}
      {hasDraft && recoveredDraft && (
        <div className="rounded-md border border-[#c4b5fd] bg-[#ede9fe] p-4 dark:border-[#4c1d95] dark:bg-[#2e1065]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#5b21b6] dark:text-[#c4b5fd]">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span className="text-sm font-medium">
                An unsaved draft was found in your browser. Would you like to restore it?
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={dismissDraft}
              >
                Discard
              </Button>
              <Button size="sm" onClick={handleAcceptDraft}>
                Restore Draft
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header with save draft button */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">
          {isEditing ? 'Edit Sign-Off Request' : 'New Sign-Off Request'}
        </h1>
        <Button
          variant="outline"
          size="sm"
          onClick={() => saveDraft(true)}
          disabled={isSaving || isSubmitting}
        >
          <Save className="h-3.5 w-3.5 mr-1.5" />
          {isSaving ? 'Saving...' : 'Save Draft'}
        </Button>
      </div>

      {/* Tabbed form */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="w-full">
          <TabsTrigger value="basics">Basics</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="risk">Risk Assessment</TabsTrigger>
          <TabsTrigger value="review">Review &amp; Submit</TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="basics">
            <FormTabBasics data={basics} onChange={setBasics} />
          </TabsContent>

          <TabsContent value="details">
            <FormTabDetails
              data={details}
              isTrial={basics.isTrial}
              onChange={setDetails}
            />
          </TabsContent>

          <TabsContent value="risk">
            <FormTabRisk
              data={risk}
              categories={basics.categories}
              onChange={setRisk}
            />
          </TabsContent>

          <TabsContent value="review">
            <FormTabReview
              basics={basics}
              details={details}
              risk={risk}
              isSubmitting={isSubmitting}
              onSubmit={handleSubmit}
            />
          </TabsContent>

          {/* Tab navigation buttons */}
          <div className="flex items-center justify-between pt-6 border-t mt-8">
            {TAB_ORDER.indexOf(activeTab as typeof TAB_ORDER[number]) > 0 ? (
              <Button
                variant="outline"
                onClick={() => {
                  const idx = TAB_ORDER.indexOf(activeTab as typeof TAB_ORDER[number])
                  handleTabChange(TAB_ORDER[idx - 1])
                }}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous: {TAB_LABELS[TAB_ORDER[TAB_ORDER.indexOf(activeTab as typeof TAB_ORDER[number]) - 1]]}
              </Button>
            ) : (
              <div />
            )}
            {TAB_ORDER.indexOf(activeTab as typeof TAB_ORDER[number]) < TAB_ORDER.length - 1 ? (
              <Button
                onClick={() => {
                  const idx = TAB_ORDER.indexOf(activeTab as typeof TAB_ORDER[number])
                  handleTabChange(TAB_ORDER[idx + 1])
                }}
              >
                Next: {TAB_LABELS[TAB_ORDER[TAB_ORDER.indexOf(activeTab as typeof TAB_ORDER[number]) + 1]]}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <div />
            )}
          </div>
        </div>
      </Tabs>
    </div>
  )
}
