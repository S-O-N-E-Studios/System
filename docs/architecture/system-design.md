# EVIDENTIARY — System Design

## Overview

EVIDENTIARY is a **multi-tenant engineering project management platform** using a MERN-adjacent stack: **React + TypeScript** frontend, **Express + Node.js** backend, and **MongoDB** database. The system is designed for provincial government departments and engineering consultancies managing infrastructure portfolios.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                         │
│                                                             │
│   React 18 · TypeScript · Vite · Tailwind · Zustand         │
│   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│   │ Auth     │ │ Projects │ │ Kanban   │ │ Reports  │     │
│   │ Store    │ │ Features │ │ Board    │ │ Charts   │     │
│   └──────────┘ └──────────┘ └──────────┘ └──────────┘     │
│       ↕ Axios + React Query                                 │
├─────────────────────────────────────────────────────────────┤
│                         API LAYER                           │
│                                                             │
│   Express 4 · JWT · Joi · Helmet · CORS · Rate Limit        │
│   ┌──────────────────────────────────────────────┐          │
│   │  Middleware Chain:                            │          │
│   │  authenticate → resolveTenant →              │          │
│   │  requireTenantMembership → validateClient    │          │
│   └──────────────────────────────────────────────┘          │
│   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│   │ Auth     │ │ Projects │ │ Files    │ │ Stage    │     │
│   │ Module   │ │ Module   │ │ Module   │ │ Gate     │     │
│   └──────────┘ └──────────┘ └──────────┘ └──────────┘     │
│       ↕ Mongoose ODM                                        │
├─────────────────────────────────────────────────────────────┤
│                        DATA LAYER                           │
│                                                             │
│   MongoDB (Atlas / local / in-memory for dev)                │
│   18 collections · tenant-scoped via tenantId                │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                      EXTERNAL SERVICES                       │
│                                                             │
│   AWS S3 / Azure Blob (file storage via presigned URLs)      │
│   SMTP / SendGrid (email: invites, notifications)            │
│   OpenStreetMap / Google Maps (map tiles)                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Multi-Tenancy Model

EVIDENTIARY uses a **shared database, tenant-scoped** approach:

- Every data document includes a `tenantId` field
- Tenant resolution happens via the URL slug: `/:tenantSlug/...`
- Middleware chain resolves slug → tenant, verifies membership, enforces scope
- Users can belong to multiple tenants with different roles per tenant

### Tenant Isolation

```
Request → authenticate(JWT) → resolveTenant(slug) → requireMembership → validateClientAccess → handler
```

- `req.user` — authenticated user with `tenants[]` array
- `req.tenant` — resolved tenant document
- All database queries are automatically scoped by `tenantId`

---

## Authentication & Authorisation

### JWT Strategy

- **Access tokens** — short-lived (1h), signed with `JWT_ACCESS_SECRET`
- **Refresh tokens** — longer-lived (7d), signed with `JWT_REFRESH_SECRET`
- Refresh tokens stored as hashed HTTP-only cookies for security
- Token payload: `{ userId, email }`

### Role-Based Access Control (RBAC)

8 roles with hierarchical permissions:

| Role | Level | Scope |
|------|-------|-------|
| `SUPER_ADMIN` | Platform | All tenants, all operations |
| `ORG_ADMIN` | Organisation | Full tenant management |
| `DEPT_ADMIN` | Department | Department-scoped admin |
| `PROJECT_MANAGER` / `PM` | Project | Create/manage projects |
| `MEMBER` | Project | Contribute to assigned work |
| `VIEWER` | Read-only | View all non-financial data |
| `CLIENT_APPROVER` | Approval | Approve documents + variations |
| `CLIENT_TEMP` | Limited | Time-boxed, project-scoped read |

### Middleware

- `requirePM` — requires `ORG_ADMIN`, `DEPT_ADMIN`, `PROJECT_MANAGER`, or `PM`
- `requireOrgAdmin` — requires `ORG_ADMIN` or `SUPER_ADMIN`
- `requireSuperAdmin` — platform admin only
- `requireDeptScope` — scopes `DEPT_ADMIN` to their department

---

## 11-Stage Project Lifecycle

```
Stage 0  → Multi-Year Planning (no approval required)
Stage 1  → Inception
Stage 2  → Concept and Viability
Stage 3  → Design Development
Stage 4  → Documentation and Procurement
Stage 5  → Tender Stage (no approval required)
Stage 6  → Contractor Appointment
Stage 7  → Construction
Stage 8  → Practical Completion
Stage 9  → Close-Out
Stage 10 → Complete (no approval required)
```

### Stage Gate Validation

Before advancing from stage N to N+1:

1. **Document check** — all required documents for stage N must be uploaded
2. **Approval check** — for stages requiring approval, documents must have `approved` status
3. **Activity check** (Stage 7) — completed activities must have minimum image evidence

### Client Approval Workflow

```
PM uploads document → StageApproval created (status: pending)
→ CLIENT_APPROVER reviews → approve/reject
→ If all approved → stage gate passes → PM can advance
```

### Variation Orders

Track contract value changes during construction:

```
PM creates VO (draft) → submit (pending_approval)
→ CLIENT_APPROVER approves → contractValueAdjusted recalculated
→ contractValueHistory entry added
```

---

## Module Architecture

Each backend feature module follows a consistent layered pattern:

```
model.js         → Mongoose schema definition
repository.js    → Database queries (find, aggregate, etc.)
service.js       → Business logic, validation, orchestration
controller.js    → HTTP request handling, response formatting
validation.js    → Joi request schemas
routes.js        → Express router with middleware
```

### Module Inventory

| Module | Models | Purpose |
|--------|--------|---------|
| `auth` | User, InviteToken | Authentication + invite flows |
| `tenants` | Tenant | Organisation management |
| `users` | User | User CRUD within tenant |
| `departments` | Department | Department budgets and programs |
| `projects` | Project | 11-stage project lifecycle |
| `tasks` | Task | Kanban task management |
| `sprints` | Sprint | Sprint planning |
| `files` | File | Document management + storage |
| `grants` | Grant | Grant tracking |
| `funding-sources` | FundingSource | Per-project funding |
| `payments` | Payment, PaymentForecast | Payment certificates |
| `activities` | Activity | Construction activity scheduling |
| `milestones` | Milestone | Project milestones |
| `calendar` | CalendarEvent | Calendar events |
| `stage-gate` | StageApproval, VariationOrder | Approval workflows |
| `planning` | MultiYearPlan | Multi-year pipeline |
| `client-access` | TemporaryAccess | Client access grants |
| `reports` | Report | Aggregated reporting |
| `idp` | — | IDP view aggregation + export |
| `services-view` | — | Service category aggregation |

---

## Frontend Architecture

### State Management

| Store | Purpose |
|-------|---------|
| `authStore` | User session, tokens, login/logout |
| `tenantStore` | Current tenant slug and metadata |
| `uiStore` | Theme, modals, toasts, sidebar state |
| `projectStore` | Table filters, pinned projects |
| `clientAccessStore` | CLIENT_TEMP scope and expiry |

### Data Flow

```
Component → useQuery(queryKey, apiFn) → Axios → Backend API
         ← React Query cache ← API response
```

- **Server state** managed by TanStack React Query (caching, background refetch)
- **Client state** managed by Zustand (UI, auth, preferences)
- **Form state** managed by React Hook Form + Zod validation

### Routing & Guards

```
/ (public)
/login, /register, /invite/:token, /client-access/:token

/:tenantSlug/ (AuthGuard → TenantGuard)
  ├── dashboard, planning, projects, kanban, calendar, ...
  ├── projects/:id (ClientGuard for CLIENT_TEMP scope)
  └── settings/* (ORG_ADMIN only)

/super-admin/ (SuperAdminGuard)
  └── tenants, tenants/:id
```

---

## File Storage

### Upload Flow (Presigned URL)

```
1. Frontend requests upload URL:  POST /:slug/files/upload-url
2. Backend generates presigned S3/Azure URL
3. Frontend uploads directly to storage provider
4. Frontend registers the file:    POST /:slug/files
5. Backend creates File document with storagePath
```

### File Categories (30 types per v7.0 spec)

Documents are categorised and mapped to stages. Some categories require client approval before the stage gate passes.

---

## Security

- **Helmet** — HTTP security headers
- **CORS** — restricted to `CLIENT_URL`
- **Rate limiting** — 100 req / 15 min per IP
- **Input validation** — Joi schemas on all endpoints
- **Password hashing** — Bcrypt with salt rounds
- **JWT split secrets** — separate signing keys for access and refresh tokens
- **Tenant isolation** — all queries scoped by `tenantId`
- **Soft deletes** — `deletedAt` field instead of physical removal
