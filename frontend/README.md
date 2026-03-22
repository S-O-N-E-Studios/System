# Project 360 - Frontend

Engineering project management platform built with React, TypeScript, and Vite.
Atlas White Design System v4.0 - Multi-Tenant SaaS.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript |
| Build | Vite 7 |
| Styling | Tailwind CSS + Atlas White CSS Tokens |
| State | Zustand |
| Forms | React Hook Form + Zod |
| Routing | React Router 6 |
| Data | TanStack React Query + Axios |
| Charts | Recharts |
| Animations | Lottie React |
| Icons | Lucide React |
| Drag-and-Drop | @dnd-kit/sortable |
| Testing | Vitest + React Testing Library |

## Design System

Atlas White (RAL 095 90 10) - warm sand, periwinkle blue, cream lineage.

- **Fonts**: Playfair Display (headings), Inter (body/UI), JetBrains Mono (financial/technical)
- **border-radius**: 0 everywhere - sharp corners only
- **Themes**: Light + Dark (warm undertones in both modes)
- **Semantic colours**: Platform-locked (success=sage, warning=amber, danger=clay)

## Getting Started

```bash
# Install dependencies
npm install

# Copy environment config
cp .env.example .env

# Start dev server
npm run dev
```

The app runs at **http://localhost:3000** by default.

> Mock authentication is enabled out of the box. Set `VITE_USE_MOCK_AUTH=false` in `.env` to connect to the real backend.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Type-check and production build |
| `npm run preview` | Preview production build locally |
| `npm run test` | Run all tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Lint with ESLint (zero warnings) |
| `npm run lint:fix` | Lint and auto-fix |
| `npm run format` | Format with Prettier |
| `npm run type-check` | TypeScript type checking |

## Project Structure

```
frontend/
- animations/          # Lottie JSON animation files
- public/              # Static assets
- src/
  - api/             # API clients and mock layer
  - components/
    - layout/        # AppShell, Sidebar, TopBar
    - ui/            # Reusable UI components
  - features/        # App screens
  - router/          # Routes and guards
  - store/           # Zustand stores
  - types/           # TypeScript types and Zod schemas
  - utils/           # Formatters and helpers
- vitest.config.ts
```

## Developers

- **Musa** - Frontend
- **Fortune** - Product Owner
- **Peter**
- **Sthembiso**
