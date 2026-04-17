# EVIDENTIARY v9 Migration Plan

This migration plan describes how to move from the current workflow model to the v9 hybrid model with minimal disruption.

## 1) Migration Strategy

- Use additive migrations first (new fields, new collections).
- Keep legacy routes operational via compatibility adapters.
- Migrate data in deterministic batches with idempotent scripts.
- Cut over by feature flag per tenant environment.

## 2) Migration Phases

## Phase A: Schema Expansion (no behavior change)

1. Add project fields:
   - `stageTopLevel`
   - `stageCheckpoint`
2. Add new collections:
   - `ProcurementTrails`
   - `ExtensionOfTimeRequests`
   - `Penalties`
   - `PerformanceSnapshots`
3. Add category aliases in file validation for v9 types.
4. Add new indexes.

Output:
- Existing features continue to run unchanged.

## Phase B: Data Backfill

### B1) Stage Mapping Backfill

Map current stage to v9 top-level stage:
- 0,1 -> Stage 1 (Initiation)
- 2,3,4 -> Stage 2 (Project Planning)
- 5,6 -> Stage 3 (Project Execution)
- 7 -> Stage 4 (Monitoring and Control)
- 8,9,10 -> Stage 5 (Closure/Complete path)

Set `stageCheckpoint` default based on current stage and available evidence.

### B2) Payment Certificates Backfill

If `PaymentCertificates` exists:
- Normalize to interim payment certificate naming.

If only legacy `Payments` records exist:
- Create synthetic interim certificate records per billing period where possible.
- Mark source as `migrated_from_legacy_payments`.

### B3) Billing Period Backfill

From files/media:
- aggregate monthly report uploads
- aggregate image/video counts
- derive `reportingComplete` and `evidenceSufficient`.

### B4) Procurement Trails Backfill

Initialize per project per required appointment type:
- If historical files exist by category, attach to matching steps.
- Default missing steps to `not_applicable` only when tenant policy permits.
- Otherwise mark incomplete and require manual completion.

## Phase C: Dual-Write Behavior

For a migration window:
- New workflow actions write both:
  - v9 canonical collections
  - legacy collections required by existing screens

This enables incremental frontend rollout.

## Phase D: Frontend Cutover

1. Enable v9 workflow endpoints behind feature flag.
2. Switch Project Detail workflow tab to v9 checkpoint model.
3. Enable new procurement trail and EOT panels.
4. Switch payment flow to interim certificate endpoints.

## Phase E: Legacy Decommission

After validation:
- disable legacy write paths
- retain read adapters for historical access
- remove deprecated API endpoints in next major version.

## 3) Data Integrity Checks

Run and store reconciliation reports:

1. Contract values
- `contractValueAdjustedCents` equals original + approved variation sum.

2. Expenditure
- project `expenditureToDateCents` equals sum of approved interim certificates.

3. Billing periods
- per period evidence and report flags match underlying files/media.

4. Audit coverage
- every approval transition has at least one audit record.

5. Tenant isolation
- no cross-tenant references in migrated records.

## 4) Rollback Strategy

- Keep pre-migration backups.
- Keep migration scripts reversible for field-level rollback.
- Disable v9 feature flags to return to legacy behaviors if required.
- Do not delete legacy structures until two successful release cycles pass.

## 5) Seed Data Upgrade Plan

Update staging seeds to include:
- all provinces and municipality catalogs
- Onboard sample projects:
  - Road 1
  - Madima Water Scheme
  - Malebetsa Road
  - Crowville Sanitation
  - Seiso WTW
  - Malefo Bus Route
- at least one active Stage 4 project with:
  - monthly reports
  - interim certificate awaiting approval
  - pending variation order
  - evidence below threshold to validate override path.

## 6) Acceptance Criteria for Migration Completion

- All active projects mapped to valid `stageTopLevel` and `stageCheckpoint`.
- Interim certificate approval flow passes end-to-end on staging.
- Procurement trail records exist for all active projects in Stage 1/2.
- Closure gates enforce mandatory approval pairings.
- No critical audit gaps in sampled projects.
