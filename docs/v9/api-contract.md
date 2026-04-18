# EVIDENTIARY v9 API Contract

This document defines the target API surface for v9 workflow behavior.
All endpoints are under `/api/v1`.

## 1) Conventions

- Tenant-scoped routes use `/:tenantSlug`.
- Project-scoped routes use `/:tenantSlug/projects/:projectId`.
- All protected routes require JWT.
- Responses follow existing success envelope unless noted.

## 2) Workflow Endpoints

### 2.1 Project Workflow Summary
- `GET /:tenantSlug/projects/:projectId/workflow`
  - Returns top-level stage, checkpoint, required items, completion state, pending approvals.

- `POST /:tenantSlug/projects/:projectId/workflow/advance`
  - Attempts checkpoint or stage transition.
  - Returns `422` with unmet requirements list when blocked.

### 2.2 Procurement Trails (new)
- `GET /:tenantSlug/projects/:projectId/procurement-trails`
- `POST /:tenantSlug/projects/:projectId/procurement-trails`
- `GET /:tenantSlug/projects/:projectId/procurement-trails/:trailId`
- `PATCH /:tenantSlug/projects/:projectId/procurement-trails/:trailId`
- `POST /:tenantSlug/projects/:projectId/procurement-trails/:trailId/steps/:stepKey/review`
  - body: `{ status, reason? }`

### 2.3 Consultant Appointment (retained + tightened)
- `POST /:tenantSlug/projects/:projectId/consultant`
- `GET /:tenantSlug/projects/:projectId/consultant`
- `PATCH /:tenantSlug/projects/:projectId/consultant`

## 3) Stage Deliverables and Approvals

### 3.1 Deliverables
- `GET /:tenantSlug/projects/:projectId/deliverables`
  - filters: `stageTopLevel`, `checkpoint`, `approvalStatus`

- `POST /:tenantSlug/projects/:projectId/deliverables`
  - register file-to-checkpoint relationship

### 3.2 Approvals (retained pattern)
- `GET /:tenantSlug/projects/:projectId/approvals`
- `GET /:tenantSlug/projects/:projectId/approvals/pending`
- `POST /:tenantSlug/projects/:projectId/approvals/:approvalId/approve`
- `POST /:tenantSlug/projects/:projectId/approvals/:approvalId/reject`

## 4) Stage 4 Operational Cycles

### 4.1 Billing Periods
- `GET /:tenantSlug/projects/:projectId/billing-periods`
- `GET /:tenantSlug/projects/:projectId/billing-periods/:period`

### 4.2 Interim Payment Certificates
- Canonical (current runtime):
  - `GET /:tenantSlug/projects/:projectId/payment-certificates`
  - `POST /:tenantSlug/projects/:projectId/payment-certificates`
- Alias (migration-safe):
  - `GET /:tenantSlug/projects/:projectId/interim-payment-certificates`
  - `POST /:tenantSlug/projects/:projectId/interim-payment-certificates`
  - `GET /:tenantSlug/projects/:projectId/interim-payment-certificates/:pcId`
  - `POST /:tenantSlug/projects/:projectId/interim-payment-certificates/:pcId/approve`
  - `POST /:tenantSlug/projects/:projectId/interim-payment-certificates/:pcId/reject`

### 4.3 Variation Orders (retained)
- `GET /:tenantSlug/projects/:projectId/variations`
- `POST /:tenantSlug/projects/:projectId/variations`
- `GET /:tenantSlug/projects/:projectId/variations/:voId`
- `PATCH /:tenantSlug/projects/:projectId/variations/:voId`
- `POST /:tenantSlug/projects/:projectId/variations/:voId/submit`
- `POST /:tenantSlug/projects/:projectId/variations/:voId/approve`
- `POST /:tenantSlug/projects/:projectId/variations/:voId/reject`
- `POST /:tenantSlug/projects/:projectId/variations/:voId/withdraw`

### 4.4 Extension of Time (EOT)
- Canonical (current runtime):
  - `GET /:tenantSlug/projects/:projectId/eot`
  - `POST /:tenantSlug/projects/:projectId/eot`
  - `GET /:tenantSlug/projects/:projectId/eot/:eotId`
  - `PATCH /:tenantSlug/projects/:projectId/eot/:eotId`
  - `POST /:tenantSlug/projects/:projectId/eot/:eotId/submit`
  - `POST /:tenantSlug/projects/:projectId/eot/:eotId/approve`
  - `POST /:tenantSlug/projects/:projectId/eot/:eotId/reject`
  - `POST /:tenantSlug/projects/:projectId/eot/:eotId/withdraw`
- Alias (migration-safe):
  - equivalent routes under `/:tenantSlug/projects/:projectId/extension-of-time/...`

### 4.5 Site Media (retained)
- `GET /:tenantSlug/projects/:projectId/media`
- `POST /:tenantSlug/projects/:projectId/media/upload-url`
- `POST /:tenantSlug/projects/:projectId/media`
- `DELETE /:tenantSlug/projects/:projectId/media/:mediaId`
- `GET /:tenantSlug/projects/:projectId/media/:mediaId/url`

## 5) Closure Domain Endpoints (new additions)

### 5.1 Penalties
- `GET /:tenantSlug/projects/:projectId/penalties`
- `POST /:tenantSlug/projects/:projectId/penalties`
- `PATCH /:tenantSlug/projects/:projectId/penalties/:penaltyId`
- `POST /:tenantSlug/projects/:projectId/penalties/:penaltyId/approve`

### 5.2 Close-Out Reports
- `GET /:tenantSlug/projects/:projectId/close-out-reports`
- `POST /:tenantSlug/projects/:projectId/close-out-reports`
  - supported types: `principal_agent`, `safety_consultant`, `eia`

## 6) Performance Endpoints (new)

- `GET /:tenantSlug/projects/:projectId/performance`
  - returns latest and historical snapshots
- `POST /:tenantSlug/projects/:projectId/performance/snapshots`
  - create consultant + construction progress snapshot

## 7) Audit Endpoints

- `GET /:tenantSlug/projects/:projectId/audit`
- `GET /:tenantSlug/projects/:projectId/audit/export?format=csv|pdf`
- `GET /:tenantSlug/audit`

## 8) Compatibility and Deprecation

During migration window:
- Keep existing `payment-certificates` routes operational.
- Add aliases or adapters to canonical `interim-payment-certificates`.
- Mark deprecated endpoints in OpenAPI as `deprecated: true`.

## 9) Error Contract

`422` workflow block payload:
```json
{
  "success": false,
  "error": "WORKFLOW_GATE_FAILED",
  "message": "Workflow checkpoint requirements not met",
  "requirements": [
    {
      "code": "MISSING_APPROVAL",
      "checkpoint": "stage4.interim_payment.approval",
      "entityType": "deliverable",
      "entityKey": "monthly-progress-report",
      "detail": "Monthly progress report is required for billing period 2026-03"
    }
  ]
}
```
