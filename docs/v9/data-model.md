# EVIDENTIARY v9 Data Model

This document defines the canonical v9 persistence model for workflow, approvals, evidence, and auditability.

## 1) Global Modeling Rules

- Every collection includes `tenantId`.
- Every project-bound collection includes `projectId`.
- Soft deletion is preferred for operational records (`deletedAt`).
- Money values are stored in cents.
- Billing period format is `YYYY-MM`.
- Audit records are append-only and immutable.

## 2) Core Collections

### 2.1 Tenants
```json
{
  "_id": "ObjectId",
  "slug": "string",
  "name": "string",
  "orgType": "provincial_gov | private_firm",
  "status": "active | suspended | trial",
  "evidenceConfig": {
    "minImagesPerBillingPeriod": 3,
    "variationEscalationThresholdCents": 0
  },
  "approvalConfig": {
    "paymentApproverRole": "DEPT_ADMIN | ORG_ADMIN",
    "closureApproverRole": "ORG_ADMIN"
  },
  "createdAt": "date",
  "updatedAt": "date"
}
```

### 2.2 Projects
```json
{
  "_id": "ObjectId",
  "tenantId": "ObjectId",
  "deptId": "ObjectId|null",
  "name": "string",
  "refCode": "string",
  "status": "draft | active | on_hold | closure | complete | cancelled",
  "stageTopLevel": 1,
  "stageCheckpoint": "string",
  "serviceCategory": "string",
  "localMunicipality": "string",
  "contractValueOriginalCents": 0,
  "contractValueAdjustedCents": 0,
  "contractValueHistory": [
    {
      "changedAt": "date",
      "previousValueCents": 0,
      "newValueCents": 0,
      "triggerType": "variation_order | admin_adjustment",
      "triggerId": "ObjectId|null"
    }
  ],
  "expenditureToDateCents": 0,
  "balanceCents": 0,
  "projectManagerUserId": "ObjectId|null",
  "teamMemberUserIds": ["ObjectId"],
  "linkedMultiYearPlanId": "ObjectId|null",
  "createdBy": "ObjectId",
  "createdAt": "date",
  "updatedAt": "date",
  "deletedAt": "date|null"
}
```

### 2.3 ConsultantAppointments (v9 canonical)
```json
{
  "_id": "ObjectId",
  "tenantId": "ObjectId",
  "projectId": "ObjectId",
  "consultingFirmName": "string",
  "consultingFirmRegistrationNumber": "string",
  "leadConsultantUserId": "ObjectId",
  "appointmentDate": "date",
  "appointmentLetterFileId": "ObjectId|null",
  "scopeOfWork": "string",
  "status": "active | suspended | terminated | completed",
  "createdAt": "date",
  "updatedAt": "date"
}
```

## 3) New v9 Collections

### 3.1 ProcurementTrails
Tracks one appointment type for one project.
```json
{
  "_id": "ObjectId",
  "tenantId": "ObjectId",
  "projectId": "ObjectId",
  "appointmentType": "principal_agent | land_surveyor | geo_technical_engineer | environmental_specialist | architect | structural_engineer",
  "assignee": {
    "name": "string",
    "firm": "string",
    "contactEmail": "string"
  },
  "steps": [
    {
      "stepKey": "advert | recommendations | approval | appointment_letter | sla",
      "status": "approved | not_approved | not_applicable",
      "reason": "string|null",
      "fileIds": ["ObjectId"],
      "reviewedBy": "ObjectId|null",
      "reviewedAt": "date|null"
    }
  ],
  "isComplete": false,
  "createdAt": "date",
  "updatedAt": "date"
}
```

### 3.2 BillingPeriods
Canonical monthly state object for Stage 4.
```json
{
  "_id": "ObjectId",
  "tenantId": "ObjectId",
  "projectId": "ObjectId",
  "period": "YYYY-MM",
  "reporting": {
    "progressReportUploaded": false,
    "cashFlowUploaded": false,
    "minutesUploaded": false,
    "reportingComplete": false
  },
  "evidence": {
    "imageCount": 0,
    "videoCount": 0,
    "evidenceMinimum": 3,
    "evidenceSufficient": false
  },
  "lastInterimCertificateId": "ObjectId|null",
  "createdAt": "date",
  "updatedAt": "date"
}
```

### 3.3 InterimPaymentCertificates
```json
{
  "_id": "ObjectId",
  "tenantId": "ObjectId",
  "projectId": "ObjectId",
  "certificateNumber": "string",
  "billingPeriod": "YYYY-MM",
  "amountClaimedCents": 0,
  "cumulativeExpenditureCents": 0,
  "balanceAfterCents": 0,
  "certificateFileId": "ObjectId",
  "status": "draft | submitted | approved | rejected",
  "checkSnapshot": {
    "progressReportPresent": false,
    "evidenceCount": 0,
    "evidenceMinimum": 3,
    "withinBudget": false,
    "pendingVariationsCount": 0
  },
  "overrideFlag": false,
  "overrideReason": "string|null",
  "approvedBy": "ObjectId|null",
  "approvedAt": "date|null",
  "rejectionReason": "string|null",
  "createdBy": "ObjectId",
  "createdAt": "date",
  "updatedAt": "date"
}
```

### 3.4 ExtensionOfTimeRequests
```json
{
  "_id": "ObjectId",
  "tenantId": "ObjectId",
  "projectId": "ObjectId",
  "referenceNumber": "string",
  "reason": "string",
  "requestedDays": 0,
  "status": "draft | pending_approval | approved | rejected | withdrawn",
  "consultantRecommendationFileId": "ObjectId|null",
  "pmuRecommendationFileId": "ObjectId|null",
  "approvalFileId": "ObjectId|null",
  "approvedBy": "ObjectId|null",
  "approvedAt": "date|null",
  "rejectionReason": "string|null",
  "createdBy": "ObjectId",
  "createdAt": "date",
  "updatedAt": "date"
}
```

### 3.5 Penalties
```json
{
  "_id": "ObjectId",
  "tenantId": "ObjectId",
  "projectId": "ObjectId",
  "penaltyType": "delay | quality | contractual | other",
  "amountCents": 0,
  "reason": "string",
  "status": "draft | approved | waived",
  "supportingFileIds": ["ObjectId"],
  "approvedBy": "ObjectId|null",
  "approvedAt": "date|null",
  "createdAt": "date",
  "updatedAt": "date"
}
```

### 3.6 PerformanceSnapshots
```json
{
  "_id": "ObjectId",
  "tenantId": "ObjectId",
  "projectId": "ObjectId",
  "period": "YYYY-MM",
  "consultant": {
    "rag": "red | amber | green",
    "progressProjectedPct": 0,
    "progressActualPct": 0,
    "expenditureProjectedPct": 0,
    "expenditureActualPct": 0
  },
  "construction": {
    "rag": "red | amber | green",
    "progressProjectedPct": 0,
    "progressActualPct": 0,
    "expenditureProjectedPct": 0,
    "expenditureActualPct": 0,
    "timeProjectedPct": 0,
    "timeActualPct": 0
  },
  "capturedBy": "ObjectId",
  "capturedAt": "date"
}
```

## 4) Existing Collections Retained (with normalization)

- `Files` (category expansion and naming normalization required)
- `StageApprovals` (generic approval records for gate-managed documents)
- `VariationOrders` (retained, but tightly integrated with contract value recalculation)
- `AuditLog` (immutability policy hardened)
- `MultiYearPlan`, `Departments`, `Users`, `FundingSources`, `CalendarEvents`, `Tasks`, `Sprints`

## 5) File Category Normalization (v9)

Legacy categories remain readable, but writes must use canonical v9 keys.

Examples:
- `monthly-progress-report`
- `monthly-cash-flow`
- `monthly-minutes`
- `interim-payment-certificate`
- `variation-certificate`
- `extension-of-time-consultant-recommendation`
- `extension-of-time-pmu-recommendation`
- `site-handover-minutes`
- `site-handover-surety-guarantee`
- `penalties-record`
- `close-out-principal-agent`
- `close-out-safety-consultant`
- `close-out-eia`

## 6) Indexing Requirements

Minimum indexes:
- every collection: `{ tenantId: 1 }`
- project-bound collections: `{ tenantId: 1, projectId: 1 }`
- billing period records: `{ tenantId: 1, projectId: 1, period: 1 }` unique
- interim certificates: `{ tenantId: 1, projectId: 1, certificateNumber: 1 }` unique
- procurement trail: `{ tenantId: 1, projectId: 1, appointmentType: 1 }` unique
- audit log timeline: `{ tenantId: 1, projectId: 1, timestamp: -1 }`

## 7) Immutability Constraints

- `AuditLog` documents cannot be updated or deleted by application code.
- Approval snapshots (`checkSnapshot`, override flags) are immutable after decision.
- Contract value history entries are append-only.
