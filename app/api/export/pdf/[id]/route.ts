import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/db'
import { formatSequenceNumber, formatDateTime } from '@/lib/format'
import {
  CATEGORY_LABELS,
  STATUS_LABELS,
  RISK_LIKELIHOOD_LABELS,
  RISK_IMPACT_LABELS,
  DATA_CLASSIFICATION_LABELS,
  getRiskLevel,
} from '@/lib/constants'
import type { SignOffCategory } from '@/types'

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function boolLabel(value: boolean | null | undefined, unknown: boolean): string {
  if (unknown) return 'Unknown'
  if (value === true) return 'Yes'
  if (value === false) return 'No'
  return 'Not specified'
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params
  const prisma = await getPrisma()

  const signOff = await prisma.signOff.findUnique({
    where: { id },
    include: {
      submittedBy: true,
      department: true,
      customSections: { orderBy: { sortOrder: 'asc' } },
      supportingDocs: { include: { addedBy: { select: { name: true } } } },
      approvers: { include: { user: { select: { name: true, email: true } } } },
      approvals: {
        include: { approver: { select: { name: true } } },
        orderBy: { createdAt: 'asc' },
      },
      comments: {
        include: { author: { select: { name: true } } },
        orderBy: { createdAt: 'asc' },
      },
      statusHistory: {
        include: { changedBy: { select: { name: true } } },
        orderBy: { createdAt: 'asc' },
      },
      riskAssessment: true,
    },
  })

  if (!signOff) {
    return NextResponse.json({ error: 'Sign-off not found' }, { status: 404 })
  }

  const seq = formatSequenceNumber(signOff.sequenceNumber)
  const risk = signOff.riskAssessment

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(seq)} – ${escapeHtml(signOff.title)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 900px; margin: 0 auto; padding: 40px 20px; color: #1a1a1a; font-size: 14px; line-height: 1.6; }
    h1 { font-size: 24px; margin-bottom: 4px; }
    h2 { font-size: 18px; border-bottom: 2px solid #e5e7eb; padding-bottom: 6px; margin-top: 32px; }
    h3 { font-size: 15px; margin-top: 20px; }
    .meta { color: #6b7280; font-size: 13px; margin-bottom: 24px; }
    .badge { display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; }
    .badge-approved { background: #d1fae5; color: #065f46; }
    .badge-rejected { background: #fee2e2; color: #991b1b; }
    .badge-submitted { background: #dbeafe; color: #1e40af; }
    .badge-draft { background: #f3f4f6; color: #374151; }
    .badge-has-comments { background: #fef3c7; color: #92400e; }
    .badge-withdrawn { background: #f3f4f6; color: #6b7280; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0; }
    th, td { text-align: left; padding: 8px 12px; border: 1px solid #e5e7eb; font-size: 13px; }
    th { background: #f9fafb; font-weight: 600; }
    .section-content { white-space: pre-wrap; }
    .risk-low { color: #065f46; } .risk-medium { color: #92400e; } .risk-high { color: #c2410c; } .risk-critical { color: #991b1b; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <h1>${escapeHtml(seq)} – ${escapeHtml(signOff.title)}</h1>
  <p class="meta">
    <span class="badge badge-${signOff.status.toLowerCase().replace('_', '-')}">${STATUS_LABELS[signOff.status] ?? signOff.status}</span>
    &nbsp;&middot;&nbsp; ${escapeHtml(signOff.department.name)}
    &nbsp;&middot;&nbsp; Submitted by ${escapeHtml(signOff.submittedBy.name)}
    &nbsp;&middot;&nbsp; ${formatDateTime(signOff.createdAt.toISOString())}
  </p>

  <h2>Overview</h2>
  <table>
    <tr><th>Categories</th><td>${signOff.categories.map((c: string) => CATEGORY_LABELS[c as SignOffCategory] ?? c).join(', ')}</td></tr>
    ${signOff.vendorName ? `<tr><th>Vendor</th><td>${escapeHtml(signOff.vendorName)}${signOff.vendorWebsite ? ` (${escapeHtml(signOff.vendorWebsite)})` : ''}</td></tr>` : ''}
    <tr><th>Trial</th><td>${signOff.isTrial ? 'Yes' : 'No'}${signOff.trialEndDate ? ` — ends ${formatDateTime(signOff.trialEndDate.toISOString())}` : ''}</td></tr>
    <tr><th>Cost</th><td>${escapeHtml(signOff.cost || 'Not specified')}</td></tr>
  </table>

  <h2>Description</h2>
  <div class="section-content">${escapeHtml(signOff.description)}</div>

  <h2>Due Diligence</h2>
  <div class="section-content">${escapeHtml(signOff.dueDiligence)}</div>

  <h2>Roll-Out Plan</h2>
  <div class="section-content">${escapeHtml(signOff.rollOutPlan)}</div>

  ${signOff.isTrial ? `
  <h2>Trial Details</h2>
  <table>
    ${signOff.trialDuration ? `<tr><th>Duration</th><td>${escapeHtml(signOff.trialDuration)}</td></tr>` : ''}
    ${signOff.trialDataAccessScope ? `<tr><th>Data Access Scope</th><td>${escapeHtml(signOff.trialDataAccessScope)}</td></tr>` : ''}
    ${signOff.trialSuccessCriteria ? `<tr><th>Success Criteria</th><td>${escapeHtml(signOff.trialSuccessCriteria)}</td></tr>` : ''}
    ${signOff.trialGoLiveRolloutPlan ? `<tr><th>Go-Live Roll-Out Plan</th><td>${escapeHtml(signOff.trialGoLiveRolloutPlan)}</td></tr>` : ''}
  </table>
  ` : ''}

  ${signOff.customSections.length > 0 ? signOff.customSections.map((s: any) => `
  <h2>${escapeHtml(s.title)}</h2>
  <div class="section-content">${escapeHtml(s.content)}</div>
  `).join('') : ''}

  ${risk ? `
  <h2>Risk Assessment</h2>
  <table>
    ${risk.dataClassification ? `<tr><th>Data Classification</th><td>${DATA_CLASSIFICATION_LABELS[risk.dataClassification] ?? risk.dataClassification}</td></tr>` : ''}
    <tr><th>Personal Data Involved</th><td>${boolLabel(risk.personalDataInvolved, risk.personalDataInvolvedUnknown)}${risk.personalDataDetails ? ` — ${escapeHtml(risk.personalDataDetails)}` : ''}</td></tr>
    ${risk.dataStorageLocation ? `<tr><th>Data Storage Location</th><td>${escapeHtml(risk.dataStorageLocation)}</td></tr>` : ''}
    <tr><th>Third-Party Data Sharing</th><td>${boolLabel(risk.thirdPartyDataSharing, risk.thirdPartyDataSharingUnknown)}${risk.thirdPartyDataDetails ? ` — ${escapeHtml(risk.thirdPartyDataDetails)}` : ''}</td></tr>
    ${risk.likelihoodOfBreach ? `<tr><th>Likelihood of Breach</th><td>${RISK_LIKELIHOOD_LABELS[risk.likelihoodOfBreach] ?? risk.likelihoodOfBreach}</td></tr>` : ''}
    ${risk.impactOfBreach ? `<tr><th>Impact of Breach</th><td>${RISK_IMPACT_LABELS[risk.impactOfBreach] ?? risk.impactOfBreach}</td></tr>` : ''}
    ${risk.overallRiskScore != null ? `<tr><th>Overall Risk Score</th><td><span class="risk-${getRiskLevel(risk.overallRiskScore)}">${risk.overallRiskScore}/25 (${getRiskLevel(risk.overallRiskScore)})</span></td></tr>` : ''}
    <tr><th>Encryption at Rest</th><td>${boolLabel(risk.hasEncryptionAtRest, risk.hasEncryptionAtRestUnknown)}</td></tr>
<tr><th>MFA</th><td>${boolLabel(risk.hasMfa, risk.hasMfaUnknown)}</td></tr>
    <tr><th>Audit Logging</th><td>${boolLabel(risk.hasAuditLogging, risk.hasAuditLoggingUnknown)}</td></tr>
    <tr><th>Pen Test Report</th><td>${boolLabel(risk.hasPenTestReport, risk.hasPenTestReportUnknown)}</td></tr>
    <tr><th>Disaster Recovery</th><td>${boolLabel(risk.hasDisasterRecovery, risk.hasDisasterRecoveryUnknown)}</td></tr>
    <tr><th>SSO</th><td>${boolLabel(risk.hasSso, risk.hasSsoUnknown)}</td></tr>
    <tr><th>SLA</th><td>${boolLabel(risk.hasSla, risk.hasSlaUnknown)}${risk.slaDetails ? ` — ${escapeHtml(risk.slaDetails)}` : ''}</td></tr>
    ${risk.complianceCertifications.length > 0 ? `<tr><th>Compliance Certifications</th><td>${risk.complianceCertifications.map(escapeHtml).join(', ')}</td></tr>` : ''}
    ${risk.mitigationPlan ? `<tr><th>Mitigation Plan</th><td>${escapeHtml(risk.mitigationPlan)}</td></tr>` : ''}
    ${risk.residualRiskNotes ? `<tr><th>Residual Risk Notes</th><td>${escapeHtml(risk.residualRiskNotes)}</td></tr>` : ''}
  </table>
  ` : ''}

  <h2>Approvers</h2>
  <table>
    <tr><th>Name</th><th>Type</th></tr>
    ${signOff.approvers.map((a: any) => `<tr><td>${escapeHtml(a.user.name)}</td><td>${a.isFixed ? 'Fixed' : 'Assigned'}</td></tr>`).join('')}
  </table>

  <h2>Approvals</h2>
  ${signOff.approvals.length > 0 ? `
  <table>
    <tr><th>Approver</th><th>Decision</th><th>Comment</th><th>Date</th><th>Revoked</th></tr>
    ${signOff.approvals.map((a: any) => `
    <tr>
      <td>${escapeHtml(a.approver.name)}</td>
      <td>${a.decision}</td>
      <td>${a.comment ? escapeHtml(a.comment) : '—'}</td>
      <td>${formatDateTime(a.createdAt.toISOString())}</td>
      <td>${a.revokedAt ? formatDateTime(a.revokedAt.toISOString()) : '—'}</td>
    </tr>`).join('')}
  </table>
  ` : '<p>No approvals recorded.</p>'}

  ${signOff.comments.length > 0 ? `
  <h2>Comments</h2>
  <table>
    <tr><th>Author</th><th>Comment</th><th>Date</th></tr>
    ${signOff.comments.map((c: any) => `
    <tr>
      <td>${escapeHtml(c.author.name)}</td>
      <td>${escapeHtml(c.content)}</td>
      <td>${formatDateTime(c.createdAt.toISOString())}</td>
    </tr>`).join('')}
  </table>
  ` : ''}

  ${signOff.supportingDocs.length > 0 ? `
  <h2>Supporting Documents/Links</h2>
  <table>
    <tr><th>Title</th><th>URL</th><th>Added By</th></tr>
    ${signOff.supportingDocs.map((d: any) => `
    <tr>
      <td>${escapeHtml(d.title)}</td>
      <td><a href="${escapeHtml(d.url)}">${escapeHtml(d.url)}</a></td>
      <td>${escapeHtml(d.addedBy.name)}</td>
    </tr>`).join('')}
  </table>
  ` : ''}

  <h2>Audit Trail</h2>
  <table>
    <tr><th>From</th><th>To</th><th>Changed By</th><th>Reason</th><th>Date</th></tr>
    ${signOff.statusHistory.map((s: any) => `
    <tr>
      <td>${s.fromStatus ? (STATUS_LABELS[s.fromStatus] ?? s.fromStatus) : '—'}</td>
      <td>${STATUS_LABELS[s.toStatus] ?? s.toStatus}</td>
      <td>${escapeHtml(s.changedBy.name)}</td>
      <td>${s.reason ? escapeHtml(s.reason) : '—'}</td>
      <td>${formatDateTime(s.createdAt.toISOString())}</td>
    </tr>`).join('')}
  </table>

  <p class="meta" style="margin-top: 40px; text-align: center;">
    Generated ${new Date().toISOString().split('T')[0]} — EM Security Approvals
  </p>
</body>
</html>`

  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  })
}
