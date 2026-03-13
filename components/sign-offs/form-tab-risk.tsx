'use client'

import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  RISK_LIKELIHOODS,
  RISK_IMPACTS,
  DATA_CLASSIFICATIONS,
  type RiskLikelihood,
  type RiskImpact,
  type DataClassification,
  type SignOffCategory,
} from '@/types'
import {
  RISK_LIKELIHOOD_LABELS,
  RISK_IMPACT_LABELS,
  DATA_CLASSIFICATION_LABELS,
  computeRiskScore,
  getRiskLevel,
  getRiskAssessmentRequirement,
} from '@/lib/constants'
import { ShieldAlert, AlertTriangle, Info, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

export interface RiskFormData {
  dataClassification: DataClassification | ''
  dataClassificationUnknown: boolean
  personalDataInvolved: boolean
  personalDataInvolvedUnknown: boolean
  personalDataDetails: string
  dataStorageLocation: string
  dataStorageLocationUnknown: boolean
  thirdPartyDataSharing: boolean
  thirdPartyDataSharingUnknown: boolean
  thirdPartyDataDetails: string
  likelihoodOfBreach: RiskLikelihood | ''
  likelihoodOfBreachUnknown: boolean
  impactOfBreach: RiskImpact | ''
  impactOfBreachUnknown: boolean
  hasEncryptionAtRest: boolean
  hasEncryptionAtRestUnknown: boolean
  hasEncryptionInTransit: boolean
  hasEncryptionInTransitUnknown: boolean
  hasMfa: boolean
  hasMfaUnknown: boolean
  hasAuditLogging: boolean
  hasAuditLoggingUnknown: boolean
  hasPenTestReport: boolean
  hasPenTestReportUnknown: boolean
  hasDisasterRecovery: boolean
  hasDisasterRecoveryUnknown: boolean
  hasSso: boolean
  hasSsoUnknown: boolean
  hasSla: boolean
  hasSlaUnknown: boolean
  slaDetails: string
  complianceCertifications: string[]
  mitigationPlan: string
  residualRiskNotes: string
}

interface FormTabRiskProps {
  data: RiskFormData
  categories: SignOffCategory[]
  onChange: (data: RiskFormData) => void
}

const RISK_LEVEL_CONFIG = {
  low: { label: 'Low', className: 'bg-[#d1fae5] text-[#065f46] dark:bg-[#064e3b] dark:text-[#6ee7b7]' },
  medium: { label: 'Medium', className: 'bg-[#fef3c7] text-[#92400e] dark:bg-[#78350f] dark:text-[#fcd34d]' },
  high: { label: 'High', className: 'bg-[#ffedd5] text-[#c2410c] dark:bg-[#7c2d12] dark:text-[#fdba74]' },
  critical: { label: 'Critical', className: 'bg-[#fee2e2] text-[#991b1b] dark:bg-[#7f1d1d] dark:text-[#fca5a5]' },
}

export function FormTabRisk({ data, categories, onChange }: FormTabRiskProps) {
  const requirement = getRiskAssessmentRequirement(categories)
  const riskScore = computeRiskScore(
    data.likelihoodOfBreach || null,
    data.impactOfBreach || null,
  )

  function update(partial: Partial<RiskFormData>) {
    onChange({ ...data, ...partial })
  }

  return (
    <div className="space-y-8">
      {/* Requirement banner */}
      <RequirementBanner requirement={requirement} />

      {/* Data Classification */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold">Data & Privacy</h3>

        <FieldWithUnknown
          label="Data Classification"
          unknown={data.dataClassificationUnknown}
          onUnknownChange={(v) =>
            update({ dataClassificationUnknown: v, ...(v ? { dataClassification: '' } : {}) })
          }
        >
          <p className="text-xs text-muted-foreground mb-2">
            How sensitive is the data this system will access or store?
            <strong> Public</strong> — freely available information.
            <strong> Internal</strong> — not sensitive but not for public sharing.
            <strong> Confidential</strong> — business-sensitive data (e.g. financials, customer lists).
            <strong> Restricted</strong> — highly sensitive data requiring strict controls (e.g. PII, credentials, health data).
          </p>
          <Select
            value={data.dataClassification}
            onValueChange={(v) => update({ dataClassification: v as DataClassification })}
            disabled={data.dataClassificationUnknown}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select classification" />
            </SelectTrigger>
            <SelectContent>
              {DATA_CLASSIFICATIONS.map((c) => (
                <SelectItem key={c} value={c}>
                  {DATA_CLASSIFICATION_LABELS[c]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldWithUnknown>

        <FieldWithUnknown
          label="Personal Data Involved?"
          unknown={data.personalDataInvolvedUnknown}
          onUnknownChange={(v) =>
            update({ personalDataInvolvedUnknown: v, ...(v ? { personalDataInvolved: false } : {}) })
          }
        >
          <p className="text-xs text-muted-foreground mb-2">
            Will this system access, store, or process any personal data? This includes names, email addresses, phone numbers, IP addresses, financial details, or any information that could identify an individual.
          </p>
          <div className="flex items-center gap-3">
            <Switch
              checked={data.personalDataInvolved}
              onCheckedChange={(checked) => update({ personalDataInvolved: checked === true })}
              disabled={data.personalDataInvolvedUnknown}
            />
            <span className="text-sm">
              {data.personalDataInvolved ? 'Yes' : 'No'}
            </span>
          </div>
        </FieldWithUnknown>

        {data.personalDataInvolved && !data.personalDataInvolvedUnknown && (
          <div className="space-y-2 ml-6">
            <Label htmlFor="personalDataDetails" className="text-xs font-medium">
              Personal Data Details
            </Label>
            <Textarea
              id="personalDataDetails"
              placeholder="Describe what personal data is involved..."
              value={data.personalDataDetails}
              onChange={(e) => update({ personalDataDetails: e.target.value })}
              rows={2}
              className="text-sm"
            />
          </div>
        )}

        <FieldWithUnknown
          label="Data Storage Location"
          unknown={data.dataStorageLocationUnknown}
          onUnknownChange={(v) =>
            update({ dataStorageLocationUnknown: v, ...(v ? { dataStorageLocation: '' } : {}) })
          }
        >
          <Input
            placeholder="e.g. AWS eu-west-1, vendor cloud (US)"
            value={data.dataStorageLocation}
            onChange={(e) => update({ dataStorageLocation: e.target.value })}
            disabled={data.dataStorageLocationUnknown}
            className="text-sm"
          />
        </FieldWithUnknown>

        <FieldWithUnknown
          label="Third-Party Data Sharing?"
          unknown={data.thirdPartyDataSharingUnknown}
          onUnknownChange={(v) =>
            update({ thirdPartyDataSharingUnknown: v, ...(v ? { thirdPartyDataSharing: false } : {}) })
          }
        >
          <p className="text-xs text-muted-foreground mb-2">
            Will personal data or company data be processed, accessed, or stored by a third party? This includes vendors, sub-processors, cloud providers, or any external organisation that handles data on our behalf.
          </p>
          <div className="flex items-center gap-3">
            <Switch
              checked={data.thirdPartyDataSharing}
              onCheckedChange={(checked) => update({ thirdPartyDataSharing: checked === true })}
              disabled={data.thirdPartyDataSharingUnknown}
            />
            <span className="text-sm">
              {data.thirdPartyDataSharing ? 'Yes' : 'No'}
            </span>
          </div>
        </FieldWithUnknown>

        {data.thirdPartyDataSharing && !data.thirdPartyDataSharingUnknown && (
          <div className="space-y-2 ml-6">
            <Label htmlFor="thirdPartyDataDetails" className="text-xs font-medium">
              Third-Party Sharing Details
            </Label>
            <Textarea
              id="thirdPartyDataDetails"
              placeholder="Describe what data is shared and with whom..."
              value={data.thirdPartyDataDetails}
              onChange={(e) => update({ thirdPartyDataDetails: e.target.value })}
              rows={2}
              className="text-sm"
            />
          </div>
        )}
      </div>

      <Separator />

      {/* Likelihood x Impact Matrix */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold">Risk Scoring</h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FieldWithUnknown
            label="Likelihood of Breach"
            unknown={data.likelihoodOfBreachUnknown}
            onUnknownChange={(v) =>
              update({ likelihoodOfBreachUnknown: v, ...(v ? { likelihoodOfBreach: '' } : {}) })
            }
          >
            <Select
              value={data.likelihoodOfBreach}
              onValueChange={(v) => update({ likelihoodOfBreach: v as RiskLikelihood })}
              disabled={data.likelihoodOfBreachUnknown}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select likelihood" />
              </SelectTrigger>
              <SelectContent>
                {RISK_LIKELIHOODS.map((l) => (
                  <SelectItem key={l} value={l}>
                    {RISK_LIKELIHOOD_LABELS[l]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldWithUnknown>

          <FieldWithUnknown
            label="Impact of Breach"
            unknown={data.impactOfBreachUnknown}
            onUnknownChange={(v) =>
              update({ impactOfBreachUnknown: v, ...(v ? { impactOfBreach: '' } : {}) })
            }
          >
            <Select
              value={data.impactOfBreach}
              onValueChange={(v) => update({ impactOfBreach: v as RiskImpact })}
              disabled={data.impactOfBreachUnknown}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select impact" />
              </SelectTrigger>
              <SelectContent>
                {RISK_IMPACTS.map((i) => (
                  <SelectItem key={i} value={i}>
                    {RISK_IMPACT_LABELS[i]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldWithUnknown>
        </div>

        {/* Computed risk score display */}
        {riskScore !== null && (
          <div className="rounded-lg border p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Computed Risk Score</p>
              <p className="text-xs text-muted-foreground">
                Likelihood x Impact = {riskScore} / 25
              </p>
            </div>
            <Badge
              variant="outline"
              className={`border-0 font-medium text-sm px-3 py-1 ${RISK_LEVEL_CONFIG[getRiskLevel(riskScore)].className}`}
            >
              {RISK_LEVEL_CONFIG[getRiskLevel(riskScore)].label} ({riskScore})
            </Badge>
          </div>
        )}
      </div>

      <Separator />

      {/* Security Controls */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold">Security Controls</h3>
        <p className="text-xs text-muted-foreground">
          Indicate which security controls are in place. Check &quot;I don&apos;t know&quot; if uncertain.
        </p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <SecurityControlField
            label="Encryption at Rest"
            checked={data.hasEncryptionAtRest}
            unknown={data.hasEncryptionAtRestUnknown}
            onCheckedChange={(v) => update({ hasEncryptionAtRest: v })}
            onUnknownChange={(v) =>
              update({ hasEncryptionAtRestUnknown: v, ...(v ? { hasEncryptionAtRest: false } : {}) })
            }
          />
          <SecurityControlField
            label="Multi-Factor Authentication"
            checked={data.hasMfa}
            unknown={data.hasMfaUnknown}
            onCheckedChange={(v) => update({ hasMfa: v })}
            onUnknownChange={(v) =>
              update({ hasMfaUnknown: v, ...(v ? { hasMfa: false } : {}) })
            }
          />
          <SecurityControlField
            label="Audit Logging"
            checked={data.hasAuditLogging}
            unknown={data.hasAuditLoggingUnknown}
            onCheckedChange={(v) => update({ hasAuditLogging: v })}
            onUnknownChange={(v) =>
              update({ hasAuditLoggingUnknown: v, ...(v ? { hasAuditLogging: false } : {}) })
            }
          />
          <SecurityControlField
            label="Penetration Test Report"
            checked={data.hasPenTestReport}
            unknown={data.hasPenTestReportUnknown}
            onCheckedChange={(v) => update({ hasPenTestReport: v })}
            onUnknownChange={(v) =>
              update({ hasPenTestReportUnknown: v, ...(v ? { hasPenTestReport: false } : {}) })
            }
          />
          <SecurityControlField
            label="Disaster Recovery Plan"
            checked={data.hasDisasterRecovery}
            unknown={data.hasDisasterRecoveryUnknown}
            onCheckedChange={(v) => update({ hasDisasterRecovery: v })}
            onUnknownChange={(v) =>
              update({ hasDisasterRecoveryUnknown: v, ...(v ? { hasDisasterRecovery: false } : {}) })
            }
          />
          <SecurityControlField
            label="Single Sign-On (SSO)"
            checked={data.hasSso}
            unknown={data.hasSsoUnknown}
            onCheckedChange={(v) => update({ hasSso: v })}
            onUnknownChange={(v) =>
              update({ hasSsoUnknown: v, ...(v ? { hasSso: false } : {}) })
            }
          />
        </div>

        {/* SLA */}
        <FieldWithUnknown
          label="Service Level Agreement (SLA)"
          unknown={data.hasSlaUnknown}
          onUnknownChange={(v) =>
            update({ hasSlaUnknown: v, ...(v ? { hasSla: false, slaDetails: '' } : {}) })
          }
        >
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Switch
                checked={data.hasSla}
                onCheckedChange={(checked) => update({ hasSla: checked === true })}
                disabled={data.hasSlaUnknown}
              />
              <span className="text-sm">{data.hasSla ? 'Yes' : 'No'}</span>
            </div>
            {data.hasSla && !data.hasSlaUnknown && (
              <Textarea
                placeholder="Describe the SLA terms..."
                value={data.slaDetails}
                onChange={(e) => update({ slaDetails: e.target.value })}
                rows={2}
                className="text-sm"
              />
            )}
          </div>
        </FieldWithUnknown>
      </div>

      <Separator />

      {/* Compliance Certifications */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Compliance Certifications</h3>
        <p className="text-xs text-muted-foreground">
          List any relevant compliance certifications (e.g. SOC 2, ISO 27001, GDPR).
        </p>
        <ComplianceCertsEditor
          certs={data.complianceCertifications}
          onChange={(complianceCertifications) => update({ complianceCertifications })}
        />
      </div>

      <Separator />

      {/* Mitigation Plan */}
      <div className="space-y-2">
        <Label htmlFor="mitigationPlan" className="text-sm font-medium">
          Mitigation Plan
        </Label>
        <p className="text-xs text-muted-foreground">
          Describe planned actions to reduce identified risks.
        </p>
        <Textarea
          id="mitigationPlan"
          placeholder="Describe your risk mitigation plan..."
          value={data.mitigationPlan}
          onChange={(e) => update({ mitigationPlan: e.target.value })}
          rows={4}
        />
      </div>

      {/* Residual Risk Notes */}
      <div className="space-y-2">
        <Label htmlFor="residualRiskNotes" className="text-sm font-medium">
          Residual Risk Notes
        </Label>
        <p className="text-xs text-muted-foreground">
          Document any remaining risks after mitigations are applied.
        </p>
        <Textarea
          id="residualRiskNotes"
          placeholder="Note any residual risks..."
          value={data.residualRiskNotes}
          onChange={(e) => update({ residualRiskNotes: e.target.value })}
          rows={3}
        />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function FieldWithUnknown({
  label,
  unknown,
  onUnknownChange,
  children,
}: {
  label: string
  unknown: boolean
  onUnknownChange: (v: boolean) => void
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <Checkbox
            checked={unknown}
            onCheckedChange={(v) => onUnknownChange(v === true)}
          />
          <span className="text-xs text-muted-foreground">I don&apos;t know</span>
        </label>
      </div>
      <div className={unknown ? 'pointer-events-none' : ''}>
        {children}
      </div>
    </div>
  )
}

function SecurityControlField({
  label,
  checked,
  unknown,
  onCheckedChange,
  onUnknownChange,
}: {
  label: string
  checked: boolean
  unknown: boolean
  onCheckedChange: (v: boolean) => void
  onUnknownChange: (v: boolean) => void
}) {
  return (
    <div className="rounded-md border p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <Checkbox
            checked={unknown}
            onCheckedChange={(v) => onUnknownChange(v === true)}
          />
          <span className="text-xs text-muted-foreground">Unknown</span>
        </label>
      </div>
      <div className={unknown ? 'pointer-events-none' : ''}>
        <div className="flex items-center gap-2">
          <Switch
            checked={checked}
            onCheckedChange={(v) => onCheckedChange(v === true)}
            disabled={unknown}
          />
          <span className="text-xs">{checked ? 'Yes' : 'No'}</span>
        </div>
      </div>
    </div>
  )
}

const PREDEFINED_CERTS = [
  'ISO 27001',
  'ISO 27017',
  'ISO 27018',
  'SOC 2 Type I',
  'SOC 2 Type II',
  'SOC 3',
  'PCI DSS',
  'GDPR Compliant',
  'HIPAA',
  'Cyber Essentials',
  'Cyber Essentials Plus',
  'CSA STAR',
  'FedRAMP',
  'NIST 800-53',
  'IASME Governance',
]

function ComplianceCertsEditor({
  certs,
  onChange,
}: {
  certs: string[]
  onChange: (certs: string[]) => void
}) {
  const [newCert, setNewCert] = useState('')

  function toggleCert(cert: string) {
    if (certs.includes(cert)) {
      onChange(certs.filter((c) => c !== cert))
    } else {
      onChange([...certs, cert])
    }
  }

  function handleAdd() {
    const cert = newCert.trim()
    if (!cert || certs.includes(cert)) return
    onChange([...certs, cert])
    setNewCert('')
  }

  function handleRemove(cert: string) {
    onChange(certs.filter((c) => c !== cert))
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd()
    }
  }

  const customCerts = certs.filter((c) => !PREDEFINED_CERTS.includes(c))

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {PREDEFINED_CERTS.map((cert) => (
          <label key={cert} className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={certs.includes(cert)}
              onCheckedChange={() => toggleCert(cert)}
            />
            <span className="text-sm">{cert}</span>
          </label>
        ))}
      </div>

      {customCerts.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {customCerts.map((cert) => (
            <Badge key={cert} variant="secondary" className="gap-1 pr-1">
              {cert}
              <button
                type="button"
                onClick={() => handleRemove(cert)}
                className="ml-0.5 rounded-full p-0.5 hover:bg-muted"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <Input
          placeholder="Add other certification..."
          value={newCert}
          onChange={(e) => setNewCert(e.target.value)}
          onKeyDown={handleKeyDown}
          className="h-8 text-sm flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8"
          onClick={handleAdd}
          disabled={!newCert.trim()}
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          Add
        </Button>
      </div>
    </div>
  )
}

function RequirementBanner({
  requirement,
}: {
  requirement: 'required' | 'recommended' | 'optional'
}) {
  if (requirement === 'required') {
    return (
      <div className="rounded-md border border-[#fca5a5] bg-[#fef2f2] px-3 py-2 text-sm text-[#b91c1c] dark:border-[#7f1d1d] dark:bg-[#450a0a] dark:text-[#fca5a5]">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span className="font-medium">Risk assessment is required</span>
        </div>
        <p className="mt-1 text-xs">
          You must complete this assessment before submitting based on the
          selected categories.
        </p>
      </div>
    )
  }

  if (requirement === 'recommended') {
    return (
      <div className="rounded-md border border-[#FFB900] bg-[#fef3c7] px-3 py-2 text-sm text-[#92400e] dark:border-[#b45309] dark:bg-[#78350f] dark:text-[#fcd34d]">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span className="font-medium">Risk assessment is recommended</span>
        </div>
        <p className="mt-1 text-xs">
          Completing this assessment is strongly encouraged for faster review.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-md border border-[#d1d5db] bg-[#f9fafb] px-3 py-2 text-sm text-foreground dark:border-[#4b5563] dark:bg-[#1f2937]">
      <div className="flex items-center gap-2">
        <Info className="h-4 w-4 shrink-0" />
        <span className="font-medium">Risk assessment is optional</span>
      </div>
      <p className="mt-1 text-xs">
        You may fill in this assessment if relevant, but it is not required.
      </p>
    </div>
  )
}
