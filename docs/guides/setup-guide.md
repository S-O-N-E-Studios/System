# Project 360 — Development Setup Guide

---

## Prerequisites

| Requirement | Version | Notes |
|-------------|---------|-------|
| **Node.js** | 20+ | [nodejs.org](https://nodejs.org) |
| **npm** | 9+ | Ships with Node.js |
| **Git** | 2.30+ | [git-scm.com](https://git-scm.com) |
| **MongoDB** | 6+ | Optional — in-memory DB available for dev |
| **Docker** | 24+ | Optional — for containerised MongoDB |

---

## Step 1 — Clone the Repository

```bash
git clone <repository-url>
cd Project360
```

---

## Step 2 — Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install

cd ..
```

---

## Step 3 — Configure Environment

### Backend

```bash
cp backend/.env.example backend/.env
```

The default `.env` uses **in-memory MongoDB** (`USE_MEMORY_DB=true`) — no database installation required. Data resets on each restart, which is fine for development.

Key variables to review:

| Variable | Default | Notes |
|----------|---------|-------|
| `PORT` | `5000` | Backend API port |
| `CLIENT_URL` | `http://localhost:3000` | Frontend URL (for CORS) |
| `USE_MEMORY_DB` | `true` | Set `false` to use real MongoDB |
| `JWT_ACCESS_SECRET` | — | Change for production |
| `JWT_REFRESH_SECRET` | — | Change for production |

### Frontend

```bash
cp frontend/.env.example frontend/.env
```

| Variable | Default | Notes |
|----------|---------|-------|
| `VITE_API_BASE_URL` | `http://localhost:5000/api` | Backend API |
| `VITE_USE_MOCK_AUTH` | (unset = mock) | Set `false` to use real backend auth |
| `VITE_MAP_PROVIDER` | `osm` | `osm` (free) or `google` (needs API key) |

---

## Step 4 — Start Development Servers

Open two terminal windows:

**Terminal 1 — Backend:**

```bash
cd backend
npm run dev
```

You should see output confirming the server is listening. Verify with:

```
GET http://localhost:5000/api/v1/health
→ { "success": true, "status": "ok" }
```

**Terminal 2 — Frontend:**

```bash
cd frontend
npm run dev
```

Open **http://localhost:3000** in your browser.

---

## Step 5 (Optional) — Use Real MongoDB

### Option A: Docker Compose

```bash
cd backend
docker compose up -d
```

This starts MongoDB on `localhost:27017`.

Then update `backend/.env`:

```
USE_MEMORY_DB=false
DATABASE_URL=mongodb://localhost:27017/project360
```

### Option B: MongoDB Atlas

1. Create a free cluster at [cloud.mongodb.com](https://cloud.mongodb.com)
2. Get the connection string
3. Set in `backend/.env`:

```
USE_MEMORY_DB=false
DATABASE_URL=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/project360
```

### Option C: Local MongoDB

Install MongoDB Community Edition and start `mongod`:

```bash
mongod --dbpath /data/db
```

---

## Step 6 — Connect Frontend to Real Backend

By default the frontend uses mock authentication for offline development. To use the real backend:

1. Ensure the backend is running
2. Set in `frontend/.env`:

```
VITE_USE_MOCK_AUTH=false
VITE_API_BASE_URL=http://localhost:5000/api
```

3. Restart the frontend dev server
4. Register a new organisation through the UI at `/register`

---

## Verification Checklist

| Check | Command / URL | Expected |
|-------|---------------|----------|
| Backend health | `GET http://localhost:5000/api/v1/health` | `{ "success": true }` |
| Frontend loads | `http://localhost:3000` | Landing page renders |
| TypeScript clean | `cd frontend && npm run type-check` | Exit code 0 |
| Backend tests | `cd backend && npm test` | Tests pass |
| Frontend tests | `cd frontend && npm test` | Tests pass |

---

## Troubleshooting

### Port already in use

Change the port in the respective `.env` file:
- Backend: `PORT=5001`
- Frontend: Vite uses the next available port automatically

### MongoDB connection refused

- Ensure MongoDB is running (`docker compose up -d` or `mongod`)
- Check `DATABASE_URL` matches your MongoDB host and port
- If using Atlas, ensure your IP is whitelisted

### CORS errors in browser

- Ensure `CLIENT_URL` in `backend/.env` matches the frontend URL exactly
- Both `http://localhost:3000` and `http://127.0.0.1:3000` are different origins

### Frontend blank page

- Check browser console for errors
- Ensure `VITE_API_BASE_URL` is correct
- If using mock auth, no backend connection is needed

### Clean reinstall

```bash
# Remove all node_modules
rm -rf backend/node_modules frontend/node_modules

# Reinstall
cd backend && npm install && cd ../frontend && npm install
```
