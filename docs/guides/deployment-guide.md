# Project 360 — Deployment Guide

---

## Architecture Overview

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│   Frontend   │──────→│   Backend    │──────→│   MongoDB    │
│   (Vercel)   │ HTTPS │  (Node host) │  TLS  │  (Atlas)     │
└──────────────┘       └──────────────┘       └──────────────┘
                              │
                       ┌──────┴──────┐
                       │   Storage   │
                       │ (S3/Azure)  │
                       └─────────────┘
```

---

## Frontend Deployment (Vercel)

The frontend is a static SPA built with Vite. Vercel is the recommended host.

### Setup

1. Connect your GitHub repository to Vercel
2. Set the root directory to `frontend`
3. Vercel auto-detects the Vite framework

### Build Settings

| Setting | Value |
|---------|-------|
| Framework Preset | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |

### Environment Variables

Set these in the Vercel dashboard:

| Variable | Value |
|----------|-------|
| `VITE_API_BASE_URL` | `https://api.project360.co.za/api/v1` |
| `VITE_USE_MOCK_AUTH` | `false` |
| `VITE_MAP_PROVIDER` | `osm` (or `google`) |
| `VITE_GOOGLE_MAPS_API_KEY` | Your key (if using Google Maps) |

### SPA Routing

The `frontend/vercel.json` file handles client-side routing:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/" }]
}
```

---

## Backend Deployment

The backend is a standard Node.js/Express application. Any Node.js hosting platform works.

### Recommended Platforms

| Platform | Notes |
|----------|-------|
| **Railway** | Easy setup, auto-deploy from Git |
| **Render** | Free tier available, auto-deploy |
| **DigitalOcean App Platform** | Scalable, South Africa region available |
| **AWS ECS / EC2** | Full control, production-grade |
| **Azure App Service** | Good for Azure Blob Storage integration |

### Environment Variables (Production)

All variables from `backend/.env.example` must be set, plus:

| Variable | Production Value |
|----------|-----------------|
| `NODE_ENV` | `production` |
| `PORT` | Platform-assigned or `5000` |
| `USE_MEMORY_DB` | `false` |
| `DATABASE_URL` | MongoDB Atlas connection string |
| `CLIENT_URL` | `https://project360.co.za` |
| `JWT_ACCESS_SECRET` | Strong random secret (32+ chars) |
| `JWT_REFRESH_SECRET` | Different strong random secret |
| `STORAGE_PROVIDER` | `s3` or `azure` |
| `EMAIL_PROVIDER` | `sendgrid` (recommended for production) |

### Docker Deployment

A `Dockerfile` is provided in the backend:

```bash
cd backend
docker build -t project360-api .
docker run -p 5000:5000 --env-file .env project360-api
```

---

## Database (MongoDB Atlas)

### Setup

1. Create an account at [cloud.mongodb.com](https://cloud.mongodb.com)
2. Create a cluster (M0 free tier for development, M10+ for production)
3. Recommended region: **AWS af-south-1** (Cape Town) for South African users
4. Create a database user with read/write permissions
5. Whitelist your backend server's IP address (or use `0.0.0.0/0` for platforms with dynamic IPs)

### Connection String

```
mongodb+srv://<user>:<password>@<cluster>.mongodb.net/project360?retryWrites=true&w=majority
```

### Indexes

The application creates indexes automatically via Mongoose schema definitions. For production, verify these indexes exist:

- `tenants.slug` (unique)
- `users.email` (unique)
- `projects.refCode` (unique)
- `projects.tenantId + deptId` (compound)
- `files.tenantId + projectId + stage` (compound)

---

## File Storage

### AWS S3

1. Create an S3 bucket (e.g., `project360-files`)
2. Configure CORS on the bucket to allow uploads from your frontend domain
3. Create an IAM user with `s3:PutObject`, `s3:GetObject`, `s3:DeleteObject` permissions
4. Set environment variables:

```
STORAGE_PROVIDER=s3
AWS_REGION=af-south-1
AWS_S3_BUCKET=project360-files
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
```

### Azure Blob Storage

1. Create a Storage Account
2. Create a container (e.g., `project360`)
3. Set environment variables:

```
STORAGE_PROVIDER=azure
AZURE_STORAGE_CONNECTION_STRING=...
AZURE_STORAGE_CONTAINER=project360
```

---

## Email (Production)

### SendGrid (Recommended)

1. Create a SendGrid account
2. Generate an API key
3. Verify your sender domain

```
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.xxxxx
EMAIL_FROM=noreply@project360.co.za
```

### SMTP

```
EMAIL_PROVIDER=smtp
EMAIL_HOST=smtp.yourdomain.com
EMAIL_PORT=587
EMAIL_USER=...
EMAIL_PASSWORD=...
EMAIL_FROM=noreply@project360.co.za
```

---

## Security Checklist

- [ ] `NODE_ENV=production` is set
- [ ] JWT secrets are strong, random, and different from each other
- [ ] `CLIENT_URL` is set to the exact frontend domain (CORS)
- [ ] MongoDB connection uses TLS (`mongodb+srv://`)
- [ ] Database user has minimal required permissions
- [ ] Rate limiting is enabled (default: 100 req / 15 min)
- [ ] Helmet middleware is active (default in production)
- [ ] File uploads use presigned URLs (no direct server uploads in production)
- [ ] Email sender domain is verified (SPF/DKIM)
- [ ] HTTPS is enforced on both frontend and backend

---

## Monitoring

### Health Check

```
GET https://api.project360.co.za/api/v1/health
```

Use your platform's health check feature to ping this endpoint.

### Logs

The backend uses a structured logger (`src/config/logger.js`). In production:

- **Railway/Render**: Logs are available in the dashboard
- **Docker**: Use `docker logs` or pipe to a log aggregator
- **AWS**: CloudWatch Logs

---

## Domain Configuration

| Subdomain | Target |
|-----------|--------|
| `project360.co.za` | Vercel frontend |
| `api.project360.co.za` | Backend server |

Set up DNS records as required by your hosting platforms. Both should use HTTPS.
