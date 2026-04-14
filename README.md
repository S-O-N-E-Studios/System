<p align="center">
  <strong>P R O J E C T &nbsp; 3 6 0</strong><br/>
  <em>Engineering Project Management Platform</em>
</p>

<p align="center">
  <code>v7.0 MVP</code>&ensp;·&ensp;<code>Multi-Tenant</code>&ensp;·&ensp;<code>11-Stage Lifecycle</code>&ensp;·&ensp;<code>Atlas Sahara Design</code>
</p>

---

## Overview

Project 360 is a **multi-tenant engineering project management platform** built for provincial government departments and consulting firms that manage infrastructure portfolios — water, sanitation, roads, energy, sport, and waste.

The platform tracks projects through an **11-stage lifecycle** (Multi-Year Planning → Complete), enforces **stage-gate document requirements** with client approval workflows, manages **variation orders**, **payment certificates**, and **funding source allocations**, and provides **IDP**, **Services**, **Kanban**, **Calendar**, **Maps**, and **Reports** views for full portfolio visibility.

### Design System — Atlas Sahara

> Terracotta `#C0642C` and warm gold `#B89040` on sand `#F5EFE4` and bone `#FDFAF5` surfaces.
> Square corners, crosshatch texture, DM Serif Display headings, IBM Plex Mono for financials.

---

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 18 · TypeScript 5 · Vite · Tailwind CSS · Zustand · TanStack React Query · React Router 6 · React Hook Form · Zod · Recharts · Leaflet · Lucide |
| **Backend** | Node.js 20+ · Express 4 · Mongoose 8 · MongoDB |
| **Auth** | JWT (split access + refresh secrets) · Bcrypt · Role-based access (8 roles) |
| **Storage** | Local (dev) · AWS S3 or Azure Blob (prod) — presigned URL uploads |
| **Email** | Nodemailer (SMTP / SendGrid) |
| **Testing** | Vitest + Testing Library (frontend) · Jest + Supertest (backend) |
| **Infra** | Docker Compose (local) · Vercel (frontend) · Any Node host (backend) |

---

## Quick Start

### Prerequisites

- **Node.js** 20 or higher
- **npm** 9+
- **Git**
- MongoDB 6+ (or use the built-in in-memory DB for development)

### 1. Clone & install

```bash
git clone <repository-url>
cd Project360

# Install backend
cd backend && npm install && cd ..

# Install frontend
cd frontend && npm install && cd ..
```

### 2. Configure environment

```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env
```

The backend ships with `USE_MEMORY_DB=true` by default — **no MongoDB install required** for local development.

### 3. Start development servers

```bash
# Terminal 1 — Backend (port 5000 by default)
cd backend && npm run dev

# Terminal 2 — Frontend (port 3000 by default)
cd frontend && npm run dev
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5000/api/v1 |
| Health check | http://localhost:5000/api/v1/health |

### 4. (Optional) MongoDB via Docker

```bash
cd backend && docker compose up -d
```

Then set `USE_MEMORY_DB=false` in `backend/.env`.

---

## Project Structure

```
Project360/
├── backend/                    # Express REST API
│   ├── src/
│   │   ├── config/             # env, database, logger, storage
│   │   ├── constants/          # roles, fileCategories, serviceCategories
│   │   ├── middleware/         # auth, RBAC, tenant, validation, error
│   │   ├── modules/            # Feature modules (see below)
│   │   ├── routes/             # Main router
│   │   └── utils/              # apiResponse, pagination, email, tokens
│   ├── tests/
│   ├── Dockerfile
│   └── docker-compose.yml
│
├── frontend/                   # React SPA
│   ├── src/
│   │   ├── api/                # Axios clients for each module
│   │   ├── components/
│   │   │   ├── layout/         # AppShell, Sidebar, TopBar
│   │   │   └── ui/             # Button, Card, StageTimeline, charts…
│   │   ├── features/           # Page components by domain
│   │   ├── rbac/               # Permission checks
│   │   ├── router/             # Routes & guards
│   │   ├── store/              # Zustand stores
│   │   ├── styles/             # globals.css (Atlas Sahara tokens)
│   │   ├── types/              # TypeScript types & Zod schemas
│   │   └── utils/              # Formatters, exports, helpers
│   └── vercel.json
│
└── docs/                       # Documentation
    ├── api/                    # API reference
    ├── architecture/           # System design & DB schema
    └── guides/                 # Setup, deployment
```

---

## Backend Modules

Each module follows the pattern: `model → repository → service → controller → validation → routes`.

| Module | Description |
|--------|-------------|
| `auth` | Register org, login, invite, client-activate, refresh, change-password |
| `tenants` | Super-admin tenant management |
| `users` | Org user CRUD, invite flow |
| `departments` | Department CRUD with budget tracking |
| `projects` | Project CRUD, 11-stage lifecycle, stage advancement |
| `tasks` | Task CRUD (Kanban statuses) |
| `sprints` | Sprint management |
| `files` | File registration, presigned uploads, client-visibility toggle |
| `grants` | Grant CRUD with disbursement tracking |
| `funding-sources` | Per-project funding source allocations |
| `payments` | Payment certificates and forecasting |
| `activities` | Construction activity scheduling |
| `milestones` | Project milestones |
| `calendar` | Calendar events (meetings, deadlines, reviews) |
| `stage-gate` | Stage approvals + variation orders |
| `planning` | Multi-year plan entries + begin-inception flow |
| `client-access` | Temporary client access grants |
| `reports` | Dashboard KPIs, budget summaries |
| `idp` | IDP view aggregation + XLSX/PDF export |
| `services-view` | Service category aggregation + export |

---

## 11-Stage Project Lifecycle

```
 0          1          2          3          4          5
 Multi-Year → Inception → Concept &  → Design    → Docs &     → Tender
 Planning               Viability   Development  Procurement   Stage

 6          7          8          9          10
 Contractor → Construction → Practical  → Close-Out → Complete
 Appointment               Completion
```

**Stage gates** enforce required document uploads before a project can advance. Stages 1-4 and 6-9 require client approval of key documents. Stages 0, 5, and 10 are approval-free.

---

## Roles & Permissions

| Role | Scope |
|------|-------|
| `SUPER_ADMIN` | Platform-wide — manage tenants |
| `ORG_ADMIN` | Full org access — users, departments, settings |
| `DEPT_ADMIN` | Department-scoped admin |
| `PROJECT_MANAGER` / `PM` | Create & manage projects, tasks, files |
| `MEMBER` | View & contribute to assigned projects |
| `VIEWER` | Read-only access |
| `CLIENT_APPROVER` | Approve stage documents and variation certificates |
| `CLIENT_TEMP` | Time-limited read access to specific projects |

---

## Frontend Screens

| Screen | Route | Description |
|--------|-------|-------------|
| Dashboard | `/:slug/dashboard` | KPIs, charts, recent projects, outstanding tasks |
| Multi-Year Planning | `/:slug/planning` | Year 1–5 pipeline, begin-inception workflow |
| Projects | `/:slug/projects` | Portfolio table (PS / Geo / CM tabs) |
| Project Detail | `/:slug/projects/:id` | Overview, stage timeline, files, funding, construction |
| IDP View | `/:slug/idp` | Projects grouped by local municipality |
| Normal Services | `/:slug/services` | Service category breakdown |
| Kanban Board | `/:slug/kanban` | Drag-and-drop task management |
| Calendar | `/:slug/calendar` | Month / week / day event views |
| Grants | `/:slug/grants` | Grant tracking with MIG, WSIG, RBIG, etc. |
| Reports | `/:slug/reports` | Budget overview, payment history, forecasts |
| Maps | `/:slug/maps` | GPS-located projects on Leaflet/OSM map |
| Files | `/:slug/files` | Document manager with category filtering |
| Settings | `/:slug/settings/*` | Org settings, team, client access |

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5000` | Server port |
| `NODE_ENV` | `development` | Environment |
| `CLIENT_URL` | `http://localhost:3000` | CORS origin |
| `DATABASE_URL` | `mongodb://localhost:27017/project360` | MongoDB connection |
| `USE_MEMORY_DB` | `true` | In-memory DB for dev |
| `JWT_SECRET` | — | Fallback JWT secret |
| `JWT_ACCESS_SECRET` | — | Access token secret |
| `JWT_REFRESH_SECRET` | — | Refresh token secret |
| `JWT_ACCESS_EXPIRES_IN` | `1h` | Access token TTL |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | Refresh token TTL |
| `EMAIL_PROVIDER` | `smtp` | `smtp` or `sendgrid` |
| `EMAIL_FROM` | `noreply@project360.co.za` | Sender address |
| `STORAGE_PROVIDER` | `local` | `local`, `s3`, or `azure` |

### Frontend (`frontend/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_BASE_URL` | `http://localhost:5000/api/v1` | Backend API base (must include `/v1`) |
| `VITE_USE_MOCK_AUTH` | (unset = true) | Set `false` for real auth |
| `VITE_MAP_PROVIDER` | `osm` | `osm` or `google` |
| `VITE_GOOGLE_MAPS_API_KEY` | — | Required if map provider is `google` |

---

## Scripts

### Backend

| Command | Description |
|---------|-------------|
| `npm run dev` | Start with nodemon |
| `npm start` | Production start |
| `npm test` | Run Jest tests |

### Frontend

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite dev server |
| `npm run build` | TypeScript check + production build |
| `npm run preview` | Serve production build locally |
| `npm run test` | Vitest |
| `npm run lint` | ESLint |
| `npm run type-check` | `tsc --noEmit` |

---

## Team

- **Fortune Mabona** — Product Lead

---

## License

MIT
