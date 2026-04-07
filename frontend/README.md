# Project 360 · Frontend

A multi-tenant engineering project management client: React, TypeScript, Vite, and the **Atlas Sahara** design system—terracotta and warm gold on sand and bone surfaces.

---

## Quick start

```bash
npm install
cp .env.example .env   # if present
npm run dev
```

Open **http://localhost:3000**. Mock auth is on by default; set `VITE_USE_MOCK_AUTH=false` to use the real API.

---

## Scripts

| Command | Purpose |
|--------|---------|
| `npm run dev` | Dev server |
| `npm run build` | Typecheck + production bundle |
| `npm run preview` | Serve `dist` locally |
| `npm run test` | Vitest |
| `npm run lint` | ESLint (zero warnings) |
| `npm run type-check` | `tsc --noEmit` |

---

## Stack

React 18 · TypeScript · Vite · Tailwind CSS · Zustand · React Router · TanStack Query · Axios · React Hook Form · Zod · Recharts · Lucide · Vitest · Testing Library

---

## Design · Atlas Sahara

Tokens live in `src/styles/globals.css`: light and dark palettes, terracotta primary, gold for financial emphasis, semantic success / warning / danger, gradients for cards and primary buttons.

**Typography**

- **DM Serif Display** — display headings and KPI presence  
- **Inter** — UI, navigation, tables, forms  
- **IBM Plex Mono** — Rand, refs, coordinates, countdowns  

**Surfaces**

- Cards use `.sahara-card` (subtle gradient, hover lift, 2px terracotta top accent).  
- Financial panels: `.sahara-card--financial` or `<Card variant="financial" />`.

**Buttons**

- `Button` maps to `.sahara-btn` / `.sahara-btn--primary|secondary|ghost|danger` — gradient primary, hover lift, pressed `scale(0.98)`.

**Rules**

- Corners stay square platform-wide except the Sahara progress bar (2px radius).  
- Theme transition ~400ms on root surfaces; focus rings use terracotta glow.

---

## Structure

```
src/
  api/           Clients & mocks
  components/
    layout/      Shell, sidebar, top bar
    ui/          Button, Card, StatCard, charts, …
  features/      Screens
  mocks/         Shared fixture data
  router/        Routes & guards
  store/         Zustand
  styles/        globals.css (tokens + Sahara primitives)
  types/         Types & Zod
  utils/         Helpers, favicon sync, exports
```

---

## Team

Product · Fortune Mabona · Engineering · Musa, Peter, Sthembiso
