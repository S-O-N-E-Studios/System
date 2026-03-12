# S.O.N.E Studios — Frontend

Engineering project management platform built with React, TypeScript, and Vite.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript |
| Build | Vite 7 |
| Styling | Tailwind CSS |
| State | Zustand |
| Forms | React Hook Form + Zod |
| Routing | React Router 6 |
| Data | TanStack React Query + Axios |
| Charts | Recharts |
| Animations | Lottie React |
| Icons | Lucide React |
| Testing | Vitest + React Testing Library |

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
├── animations/          # Lottie JSON animation files
├── public/              # Static assets
├── src/
│   ├── api/             # API clients and mock layer
│   ├── components/
│   │   ├── layout/      # AppShell, Sidebar, TopBar
│   │   └── ui/          # Reusable UI components
│   ├── features/
│   │   ├── auth/        # Login, Register, Profile
│   │   ├── dashboard/   # Dashboard overview
│   │   ├── files/       # File manager
│   │   ├── kanban/      # Kanban task board
│   │   ├── maps/        # Google Maps integration
│   │   ├── projects/    # Project CRUD and detail views
│   │   ├── reports/     # Payment history and forecasts
│   │   ├── settings/    # User and org settings
│   │   └── superadmin/  # Tenant management
│   ├── router/          # Routes and auth guards
│   ├── store/           # Zustand stores
│   ├── types/           # TypeScript types and Zod schemas
│   └── utils/           # Formatters and helpers
└── vitest.config.ts
```

## Testing

247 tests across 22 test files covering utilities, Zod schemas, Zustand stores, API mocks, and UI components.

```bash
npm run test
```

## Developers

- **Musa**
- **Fortune**
- **Peter**
- **Sthembiso**
