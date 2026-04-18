# EVIDENTIARY v9 UI Information Architecture

This document defines the v9 UX structure with explicit focus on:
- reduced complexity
- stage clarity
- action-first approvals
- evidence-first decision making

## 1) UX Goals

- Show users only what they need at decision time.
- Keep workflow navigation anchored to 5 top-level stages.
- Make every approval view include evidence and impact context.
- Keep client and consultant responsibilities visually distinct.

## 2) Global Navigation

Primary nav:
- Dashboard
- Planning
- Projects
- Approvals
- Reports
- Maps
- Files
- Settings

Project-level nav (inside Project Detail):
- Overview
- Workflow
- Construction Ops
- Finance
- Evidence
- Audit Trail

## 3) Project Detail v9 Layout

## 3.1 Overview Tab
- Project identity and status
- Consultant vs Client role chips
- Performance panels:
  - consultant performance (RAG + projected/actual)
  - construction performance (RAG + projected/actual + time elapsed)
- Top-level stage progress rail (1..5)

## 3.2 Workflow Tab (new primary workbench)

Top section:
- 5-stage rail with current stage highlighted
- current checkpoint card
- CTA: `Run Gate Check`

Middle section:
- checkpoint requirement list (documents, approvals, dependencies)
- each requirement has state badge: pending / submitted / approved / rejected

Right panel:
- decision actions based on role:
  - consultant: upload, resubmit
  - client approver: approve/reject with reason

## 3.3 Construction Ops Tab

Sub-tabs:
- Billing Periods
- Interim Certificates
- Variations
- Extension of Time

### Billing Periods view
- card grid by period with:
  - reporting complete status
  - image/video counts vs minimum
  - latest certificate status

### Interim Certificate review panel
- certificate summary
- readiness checks
- evidence summary for period
- override reason input appears only when check fails
- approve/reject actions

## 3.4 Finance Tab
- contract original vs adjusted
- variation impact timeline
- expenditure vs balance
- penalties and closure finance records

## 3.5 Evidence Tab
- stage and billing period filters
- grouped media/documents
- quick view for GPS-tagged site evidence

## 3.6 Audit Trail Tab
- timeline feed with filters
- highlighted override entries
- export actions (xlsx/pdf)

## 4) New/Updated Components

## 4.1 StageRail5
- simple 5-stage timeline with checkpoint indicator.

## 4.2 ProcurementTrailMatrix
- rows: appointment types
- columns: advert, recommendations, approval, appointment letter, SLA
- cell state: approved / not approved / not applicable

## 4.3 InterimCertificateReviewPanel
- check-state cards
- conditional override block
- impact summary panel

## 4.4 PerformanceDualPanel
- consultant and construction performance side by side

## 4.5 ClosureChecklist
- hard-gate checklist for final completion approvals

## 5) Role-First Interaction Rules

- Consultant sees upload and submit controls; no approve controls.
- Client approver sees approve/reject controls; no document authoring controls.
- Org admin can override where policy allows; override requires explicit reason entry.

## 6) Complexity Reduction Rules

- default collapsed detail sections under each checkpoint
- show only blockers in red state by default
- one primary CTA per panel
- avoid mixed-purpose forms

## 7) Accessibility and Visual Requirements

- maintain Atlas Sahara identity
- keep AA contrast in both light/dark
- keyboard-complete approval workflows
- semantic labels for all approve/reject actions and evidence counters

## 8) Province-Wide Scope UX

- onboarding and settings must support all provinces and their municipalities
- filters:
  - province
  - district
  - local municipality
- dashboard widgets must aggregate by municipality and province
