# EVIDENTIARY — Database Schema

> MongoDB collections. All tenant-scoped documents include `tenantId`. Schemas are defined in `backend/src/modules/<feature>/<feature>.model.js`.

---

## Collections Overview

| Collection | Module | Key Purpose |
|------------|--------|-------------|
| `tenants` | tenants | Organisation registration and configuration |
| `users` | auth/users | User accounts with multi-tenant membership |
| `invitetokens` | auth | Pending user invitation tokens |
| `departments` | departments | Department structure with budgets |
| `projects` | projects | Engineering projects (11-stage lifecycle) |
| `tasks` | tasks | Kanban tasks |
| `sprints` | sprints | Sprint planning |
| `files` | files | Uploaded documents and media |
| `grants` | grants | Government grants |
| `fundingsources` | funding-sources | Per-project funding allocations |
| `payments` | payments | Payment certificates |
| `paymentforecasts` | payments | Payment forecast entries |
| `activities` | activities | Construction activities |
| `milestones` | milestones | Project milestones |
| `calendarevents` | calendar | Calendar events |
| `stageapprovals` | stage-gate | Document approval records |
| `variationorders` | stage-gate | Contract variation orders |
| `multiyearplans` | planning | Multi-year project pipeline |
| `temporaryaccesses` | client-access | Client temporary access grants |
| `reports` | reports | Cached report snapshots |

---

## Tenant

```
{
  name:                 String (required)
  slug:                 String (unique, lowercase, URL-safe)
  orgType:              Enum ['provincial_gov', 'private_firm']
  localMunicipalities:  [String]
  logoUrl:              String
  status:               Enum ['active', 'suspended'] (default: 'active')
  theme: {
    primaryColor:       String
    accentColor:        String
  }
  createdAt, updatedAt  (timestamps)
}
```

---

## User

```
{
  fullName:            String (required)
  email:               String (unique, required)
  passwordHash:        String (required)
  avatarUrl:           String
  isActive:            Boolean (default: true)
  tenants: [{
    tenantId:          ObjectId → Tenant
    role:              Enum [SUPER_ADMIN, ORG_ADMIN, DEPT_ADMIN,
                             PROJECT_MANAGER, PM, MEMBER, VIEWER,
                             CLIENT_APPROVER, CLIENT_TEMP]
    deptId:            ObjectId → Department (for DEPT_ADMIN)
  }]
  lastLoginAt:         Date
  temporaryAccessId:   ObjectId → TemporaryAccess (for CLIENT_TEMP)
  deletedAt:           Date (soft delete)
}
```

---

## Project

```
{
  tenantId:                ObjectId → Tenant
  deptId:                  ObjectId → Department
  name:                    String (required)
  refCode:                 String (unique, auto-generated: PRJ-YYYY-NNN)
  idpProjectNo:            String
  description:             String
  serviceCategory:         Enum [water_sanitation, roads_stormwater,
                                  energy_electricity, waste_management,
                                  recreational_sport_libraries,
                                  community_facilities]
  localMunicipality:       String
  fullAddress:             String
  gpsCoordinates: {
    lat:                   Number
    lng:                   Number
  }
  currentStage:            Number (0-10, default: 1)
  contractValueOriginal:   Number (cents)
  contractValueAdjusted:   Number (cents, updated by variation orders)
  contractValueHistory: [{
    date:                  Date
    oldValue:              Number
    newValue:              Number
    reason:                String
    variationOrderId:      ObjectId
  }]
  subConsultants: [{
    name:                  String
    role:                  String
    fee:                   Number
  }]
  stageHistory: [{
    stage:                 Number (0-10)
    enteredAt:             Date
    exitedAt:              Date
    advancedBy:            ObjectId → User
  }]
  linkedMultiYearPlanId:   ObjectId → MultiYearPlan
  status:                  Enum [active, on-hold, complete, cancelled]
  startDate:               Date
  endDate:                 Date
  projectManager:          ObjectId → User
  contractor:              String
  deletedAt:               Date
}
```

---

## File

```
{
  tenantId:                ObjectId → Tenant
  projectId:               ObjectId → Project
  originalName:            String
  filename:                String
  storagePath:             String
  mimeType:                String
  sizeBytes:               Number
  category:                Enum [30 file categories per v7.0]
  stage:                   Number (1-9)
  mediaType:               Enum [document, image, video]
  clientVisible:           Boolean (default: false)
  approvalStatus:          Enum [not_required, pending, approved, rejected]
  approvedBy:              ObjectId → User
  approvedAt:              Date
  rejectionReason:         String
  approvalRequiredForStage: Boolean
  versionHistory: [{
    version:               Number
    storagePath:            String
    uploadedAt:            Date
    uploadedBy:            ObjectId → User
  }]
  captureDate:             Date (for site media)
  captureGPS: {
    lat:                   Number
    lng:                   Number
  }
  mediaDurationSeconds:    Number (for video)
  thumbnailStoragePath:    String
  variationOrderId:        ObjectId → VariationOrder
  uploadedBy:              ObjectId → User
}
```

---

## StageApproval

```
{
  tenantId:            ObjectId → Tenant
  projectId:           ObjectId → Project
  stage:               Number (1-9)
  fileCategory:        String
  fileId:              ObjectId → File
  status:              Enum [pending, approved, rejected]
  requestedBy:         ObjectId → User
  reviewedBy:          ObjectId → User
  reviewedAt:          Date
  rejectionReason:     String
}
```

---

## VariationOrder

```
{
  tenantId:            ObjectId → Tenant
  projectId:           ObjectId → Project
  variationNumber:     String (unique)
  description:         String
  reason:              String
  valueChange:         Number (cents, positive or negative)
  status:              Enum [draft, pending_approval, approved, rejected, withdrawn]
  submittedAt:         Date
  reviewedBy:          ObjectId → User
  reviewedAt:          Date
  createdBy:           ObjectId → User
}
```

---

## MultiYearPlan

```
{
  tenantId:            ObjectId → Tenant
  projectName:         String
  serviceCategory:     String
  localMunicipality:   String
  plannedYear:         Number (1-5)
  financialYear:       String (e.g., "2026/2027")
  estimatedValue:      Number (cents)
  funderType:          String
  funderName:          String
  status:              Enum [planned, selected_for_inception, active, cancelled]
  linkedProjectId:     ObjectId → Project
  notes:               String
}
```

---

## Other Collections

### Department

```
{
  tenantId, name, code, headOfDepartment,
  budgetTotal (cents), budgetSpent (cents),
  programs: [{ name, budgetAllocated, budgetSpent }]
}
```

### Grant

```
{
  tenantId, grantName, funderType, funderName,
  totalValue (cents), disbursedToDate (cents),
  financialYear, status, conditions
}
```

### FundingSource

```
{
  tenantId, projectId, sourceType, sourceName,
  amount (cents), disbursed (cents)
}
```

### Payment

```
{
  tenantId, projectId, certificateNumber,
  amount (cents), status, paymentDate, invoiceNumber
}
```

### Task

```
{
  tenantId, projectId, sprintId, title, description,
  status [backlog, in_progress, in_review, done],
  priority [critical, high, medium, low],
  assignedTo (ObjectId → User), dueDate
}
```

### CalendarEvent

```
{
  tenantId, projectId, title, description,
  type [meeting, deadline, review, site_visit, payment_due,
        stage_advanced, document_approved, document_rejected,
        variation_approved, activity_update],
  startDate, endDate, isAllDay
}
```

### TemporaryAccess

```
{
  tenantId, clientEmail, clientUserId,
  projectIds: [ObjectId], canApproveDocuments,
  activationTokenHash, status [pending, active, expired, revoked],
  expiresAt, activatedAt, grantedBy
}
```

---

## Indexes

Key indexes for query performance:

| Collection | Index | Type |
|------------|-------|------|
| `tenants` | `slug` | Unique |
| `users` | `email` | Unique |
| `projects` | `tenantId, deptId` | Compound |
| `projects` | `refCode` | Unique |
| `files` | `tenantId, projectId, stage` | Compound |
| `tasks` | `tenantId, sprintId` | Compound |
| `stageapprovals` | `tenantId, projectId, stage` | Compound |

---

## Financial Values

All monetary values are stored in **cents** (South African Rands × 100) to avoid floating-point issues. The frontend divides by 100 for display using `formatRands()`.
