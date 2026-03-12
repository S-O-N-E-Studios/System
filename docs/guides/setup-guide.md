# Development Setup Guide

## Prerequisites

1. Node.js 18 or higher
2. MongoDB 6 or higher
3. Git

## Step-by-Step Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd project-management-app
```

### 2. Install Dependencies

```bash
npm run install:all
```

### 3. Configure Environment Variables

**Backend (.env):**

- Copy `backend/.env.example` to `backend/.env`
- Set `MONGODB_URI`, `JWT_SECRET`, `GOOGLE_MAPS_API_KEY` as needed

**Frontend (.env):**

- Copy `frontend/.env.example` to `frontend/.env`
- Set `REACT_APP_API_URL=http://localhost:5000/api/v1`

### 4. Start MongoDB

```bash
mongod
```

### 5. Run Development Servers

```bash
npm run dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- API Health: http://localhost:5000/health

## Troubleshooting

- **MongoDB:** Ensure `mongod` is running and `MONGODB_URI` is correct.
- **Port in use:** Change `PORT` in backend `.env` or `PORT` for frontend.
- **Clean install:** Remove `node_modules` in root, backend, and frontend; run `npm run install:all` again.
