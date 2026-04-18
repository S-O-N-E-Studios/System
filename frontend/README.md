<p align="center">
  <strong>E V I D E N T I A R Y &ensp;·&ensp; F R O N T E N D</strong><br/>
  <em>React · TypeScript · Vite · Atlas Sahara Design System</em>
</p>

---

## Quick Start

```bash
npm install
cp .env.example .env
npm run dev                  # http://localhost:3000
```

Mock auth is on by default. Set `VITE_USE_MOCK_AUTH=false` in `.env` to use the real backend.

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_BASE_URL` | `http://localhost:5000/api/v1` | Backend API base URL (must match `/api/v1` mount) |
| `VITE_USE_MOCK_AUTH` | (unset = true) | Set `false` to use real backend auth |
| `VITE_MAP_PROVIDER` | `osm` | Map tile provider: `osm` or `google` |
| `VITE_GOOGLE_MAPS_API_KEY` | — | Required when `VITE_MAP_PROVIDER=google` |

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | TypeScript check + production bundle |
| `npm run preview` | Serve `dist/` locally |
| `npm run test` | Vitest (unit + component tests) |
| `npm run lint` | ESLint (zero warnings policy) |
| `npm run type-check` | `tsc --noEmit` |
| `npm run format` | Prettier formatting |

---

## Stack

| Category | Libraries |
|----------|-----------|
| **Framework** | React 18 · TypeScript 5 · Vite 7 |
| **Styling** | Tailwind CSS 3 · CSS custom properties (design tokens) |
| **State** | Zustand 4 (auth, UI, tenant, project stores) |
| **Data fetching** | TanStack React Query 5 · Axios |
| **Routing** | React Router 6 (nested routes, guards) |
| **Forms** | React Hook Form · Zod validation |
| **Charts** | Recharts 2 |
| **Maps** | Leaflet + React-Leaflet (OpenStreetMap) or Google Maps |
| **Drag & drop** | dnd-kit |
| **Icons** | Lucide React |
| **Exports** | ExcelJS (XLSX) · jsPDF (PDF) |
| **Testing** | Vitest · Testing Library · Playwright (E2E) |

---

## Design System — Atlas Sahara

The Atlas Sahara design system gives EVIDENTIARY its distinctive identity: warm, authoritative, and purpose-built for engineering professionals and government stakeholders.

### Colour Palette

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--accent` | `#C0642C` | `#D08050` | Primary actions, active states, terracotta buttons |
| `--gold` | `#B89040` | `#D4A840` | Financial emphasis, gold highlights |
| `--ochre` | `#C8A050` | `#C8904A` | Secondary accents, periwinkle alias |
| `--sienna` | `#A06848` | `#C07850` | Tertiary, completion badges |
| `--bg-page` | `#F5EFE4` | `#100C08` | Page background (warm sand / deep charcoal) |
| `--bg-surface` | `#FDFAF5` | `#1A1410` | Card and panel surfaces |
| `--text-primary` | `#1E1408` | `#F0E8DC` | Primary text |
| `--text-financial` | `#3A2810` | `#E8C888` | Financial figures (mono) |
| `--success` | `#3A7040` | `#50A060` | Completed, on-track |
| `--warning` | `#A06828` | `#C89040` | At-risk, review needed |
| `--danger` | `#943028` | `#C05848` | Failed, overdue, blocked |

### Typography

| Font | CSS Variable | Usage |
|------|-------------|-------|
| **DM Serif Display** | `--font-display` | Page headings (`text-h1`, `text-h2`, `text-h3`), stat values |
| **Inter** | `--font-ui` | Body text, navigation, tables, forms, buttons |
| **IBM Plex Mono** | `--font-mono` | Rand values, project codes, GPS coordinates, countdowns |

Headings use `clamp()` for fluid responsive scaling — from 24px on mobile to 48px on desktop.

### Design Rules

- **Square corners everywhere** — `border-radius: 0` enforced globally (except progress bar fill, 2px)
- **Crosshatch texture** — subtle 45° pattern on page background
- **Gradient buttons** — primary buttons use `linear-gradient(135deg, terracotta, lighter terracotta)`
- **Card hover** — `translateY(-2px)` lift with 2px terracotta top border accent
- **Theme transition** — 400ms ease on background-color and color for smooth light/dark switch
- **Focus rings** — terracotta glow `box-shadow` instead of browser default
- **Touch targets** — 44px minimum on touch devices via `@media (pointer: coarse)`

### Component Classes

| Class | Description |
|-------|-------------|
| `.sahara-card` | Surface with gradient, hover lift, terracotta accent |
| `.sahara-card--financial` | Financial variant with gold gradient tint |
| `.sahara-btn--primary` | Gradient terracotta button with hover lift |
| `.sahara-btn--secondary` | Transparent with border, accent on hover |
| `.sahara-btn--ghost` | Minimal, no border, accent on hover |
| `.sahara-btn--danger` | Red border, red text |
| `.text-h1` / `.text-h2` / `.text-h3` | Display headings (DM Serif Display) |
| `.text-currency` / `.text-financial` | Mono-spaced financial figures |
| `.text-eyebrow` | Small uppercase label |

---

## Project Structure

```
src/
├── api/                       # API clients (one per backend module)
│   ├── client.ts              # Axios instance with interceptors
│   ├── auth.ts                # Auth endpoints
│   ├── projects.ts            # Projects CRUD
│   ├── tasks.ts               # Tasks & sprints
│   ├── files.ts               # File management
│   ├── grants.ts              # Grants
│   ├── calendar.ts            # Calendar events
│   ├── dashboard.ts           # Dashboard KPIs
│   ├── reports.ts             # Reports
│   ├── variations.ts          # Variation orders
│   ├── planning.ts            # Multi-year planning
│   ├── stageApprovals.ts      # Stage approvals
│   ├── media.ts               # Site images & drone video
│   ├── idp.ts                 # IDP view
│   └── services.ts            # Services view
│
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx        # Main layout (sidebar + topbar + content)
│   │   ├── Sidebar.tsx         # Collapsible navigation rail
│   │   └── TopBar.tsx          # Header with search, notifications, theme
│   └── ui/                     # Reusable UI components
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Modal.tsx
│       ├── StageTimeline.tsx    # 11-stage visual timeline
│       ├── StageDocumentDrawer.tsx
│       ├── PaymentForecastChart.tsx
│       ├── AtlasMap.tsx         # Leaflet map wrapper
│       └── ...
│
├── features/                   # Page-level components
│   ├── dashboard/              # Dashboard with KPIs and charts
│   ├── planning/               # Multi-Year Planning table
│   ├── projects/               # Projects list + detail + form
│   ├── kanban/                 # Drag-and-drop task board
│   ├── calendar/               # Month/week/day calendar
│   ├── grants/                 # Grant management
│   ├── idp/                    # IDP View with export
│   ├── services/               # Service category view
│   ├── reports/                # Reports with payment history
│   ├── maps/                   # GPS project map
│   ├── files/                  # File manager
│   ├── settings/               # Org settings + client access
│   ├── auth/                   # Login, register, invite, profile
│   ├── departments/            # Department detail
│   ├── superadmin/             # Super admin tenant management
│   └── landing/                # Public landing page
│
├── rbac/                       # Role-based access control
│   ├── permissions.ts          # Permission → role mapping
│   └── useCan.ts               # React hook for permission checks
│
├── router/
│   ├── index.tsx               # Route definitions
│   └── guards.tsx              # Auth, tenant, client, dept guards
│
├── store/                      # Zustand stores
│   ├── authStore.ts
│   ├── tenantStore.ts
│   ├── uiStore.ts
│   ├── clientAccessStore.ts
│   └── projectStore.ts
│
├── styles/
│   └── globals.css             # Atlas Sahara design tokens + primitives
│
├── types/
│   └── index.ts                # All TypeScript types + Zod schemas
│
└── utils/
    ├── formatters.ts           # Currency (ZAR), dates, file sizes
    ├── clientExports.ts        # XLSX + PDF generation
    └── ...
```

---

## Responsive Design

The application is fully responsive across desktop, tablet, and mobile devices:

- **Sidebar** collapses to hamburger menu below `lg` (1024px)
- **Tables** scroll horizontally with `min-width` constraints on mobile
- **Maps** stack sidebar above map on mobile with 40vh sidebar cap
- **Calendar** grid scrolls horizontally with 640px minimum width
- **Kanban** board reflows to 1 column on mobile, 2 on tablet, 4 on desktop
- **Typography** scales fluidly via `clamp()` — no fixed heading sizes
- **Touch targets** enforced at 44px minimum on touch devices
- **Inputs** use 16px minimum font size to prevent iOS zoom

---

## Roles & Access

| Role | Dashboard | Projects | Files | Kanban | Planning | Settings |
|------|-----------|----------|-------|--------|----------|----------|
| `ORG_ADMIN` | Yes | Full | Full | Yes | Yes | Yes |
| `DEPT_ADMIN` | Yes | Dept-scoped | Full | — | Yes | — |
| `PROJECT_MANAGER` | Yes | Full | Full | Yes | Yes | — |
| `MEMBER` | Yes | Contribute | Upload | — | Yes | — |
| `VIEWER` | Yes | Read | Read | — | Yes | — |
| `CLIENT_APPROVER` | — | Read | Approve | — | — | — |
| `CLIENT_TEMP` | — | Scoped | Scoped | — | — | — |

---

## Team

- **Fortune Mabona** — Product Lead

---

## License

MIT
