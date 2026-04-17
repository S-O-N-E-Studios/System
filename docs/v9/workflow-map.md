# EVIDENTIARY v9 Workflow Map

This document defines the canonical workflow model for EVIDENTIARY v9.
It supersedes prior stage maps by introducing a hybrid structure:

- Top-level user experience: 5 operational stages used by consulting firms and client approvers.
- Internal control model: enforceable gate checkpoints under each top-level stage.

## 1) Design Principles

- Use one business language across UI, API, and reports.
- Keep top-level navigation simple (5 stages) while enforcing strict evidence rules under the hood.
- Preserve client authority through approvals, rejection reasons, and immutable audit trails.
- Never rely on client-side checks for gates; all transitions are validated server-side.

## 2) Stage Model (Top-Level)

1. Initiation
2. Project Planning
3. Project Execution
4. Monitoring and Control
5. Closure

The project remains in `closure` until all mandatory close-out approvals pass, then transitions to `complete` (read-only historical state).

## 3) Hybrid Sub-Step Map

Each top-level stage contains gate checkpoints. A checkpoint is considered complete only when required evidence is uploaded and the required approver action is recorded.

### Stage 1: Initiation

#### 1.1 Consultant Appointment
- Appoint lead consultant firm.
- Capture appointment letter and scope.
- Invite lead consultant user (PM scope).

#### 1.2 Sub-Consultant Procurement Trails
Appointment types:
- principal_agent
- land_surveyor
- geo_technical_engineer
- environmental_specialist
- architect
- structural_engineer

Procurement steps per appointment:
- advert
- recommendations
- approval
- appointment_letter
- sla

Allowed status per step:
- approved
- not_approved
- not_applicable

Rules:
- `not_approved` requires a reason.
- A step can have versioned evidence files.
- Initiation gate passes only when all required appointment trails are complete.

### Stage 2: Project Planning

Required deliverables:
- inception_scoping_report
- preliminary_design_report
- preliminary_design_drawings
- detailed_design_report
- detailed_design_drawings
- geotechnical_investigation
- eia_emp
- draft_tender_document

Rules:
- Each deliverable has approval status.
- Rejection requires reason and triggers consultant rework cycle.
- Stage 2 gate passes only when required deliverables are approved.

### Stage 3: Project Execution

Required deliverables:
- tender_advert_register
- pre_evaluation_report
- evaluation_report
- adjudication_report
- appointment_of_contractor
- site_handover_pack

`site_handover_pack` required components:
- site_handover_minutes
- surety_guarantee
- insurance_of_works
- programme_of_works
- key_personnel_register
- safety_file_audit_report
- handover_images_videos

Rules:
- Contractor appointment and handover pack must be approved to move to Stage 4.

### Stage 4: Monitoring and Control

This stage is period-driven. The billing period (`YYYY-MM`) is the synchronization key.

Concurrent cycles:

1) Monthly reporting cycle
- monthly_progress_report
- monthly_cash_flow_projection
- monthly_minutes

2) Interim payment certificate cycle
- interim_payment_certificate submission
- readiness checks evaluated at submit and approval time:
  - progress report present for period
  - minimum evidence images met
  - amount within adjusted balance
  - pending variation orders present (informational)

3) Variation order cycle
- create variation
- attach variation_certificate
- submit
- approve/reject
- on approve, recalculate contract adjusted value from all approved variations

4) Extension of time (EOT) cycle
- consultant recommendation
- PMU recommendation
- client approval

Rules:
- Override is allowed for specific readiness checks by approved client authority.
- Every override must be captured in immutable audit logs with condition snapshot.

### Stage 5: Closure

Required deliverables:
- final_account
- penalties_record
- practical_completion_certificate
- completion_certificate
- close_out_report_principal_agent
- close_out_report_safety_consultant
- close_out_report_eia
- final_completion_certificate
- proof_of_payment
- as_built_drawings (if applicable)
- om_manuals (if applicable)

Rules:
- Final completion requires all mandatory closure approvals.
- No bypass for final closure approvals.

## 4) Approval Authority Summary

- Consultant users (PM/member scope): create and upload evidence, submit approvals.
- Client approvers (dept admin/org admin/explicit approver): approve or reject with reasons.
- Org admin has final override authority based on tenant configuration.

## 5) Status Machine

### Project statuses
- draft
- active
- on_hold
- closure
- complete
- cancelled

### Stage progression
- Project stage is represented as `stage_top_level` (1..5).
- `stage_checkpoint` tracks current internal gate key.
- Progression command validates all required evidence and approvals for current checkpoint.

## 6) Read-Only Complete State

When closure gate passes:
- set project status `complete`
- freeze workflow mutations except admin metadata corrections explicitly permitted by policy
- preserve full audit and evidence retrieval

## 7) Non-Functional Enforcement

- Every stage transition writes an audit event.
- Every approval decision writes an audit event with before/after payload snapshot.
- Evidence and approvals are tenant-scoped and project-scoped in every query path.
