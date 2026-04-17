<p align="center">
  <strong>E V I D E N T I A R Y &ensp;·&ensp; B A C K E N D</strong><br/>
  <em>Multi-Tenant REST API &ensp;·&ensp; Node.js · Express · MongoDB</em>
</p>

---

## Quick Start

```bash
npm install
cp .env.example .env        # USE_MEMORY_DB=true — no MongoDB needed
npm run dev                  # http://localhost:5000
```

Health check: `GET http://localhost:5000/api/v1/health`

---

## Run with Docker (MongoDB)

```bash
docker compose up -d         # Starts MongoDB on :27017
```

Then in `.env`:

```
USE_MEMORY_DB=false
DATABASE_URL=mongodb://localhost:27017/project360
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5000` | Server port |
| `NODE_ENV` | `development` | `development` / `production` / `test` |
| `CLIENT_URL` | `http://localhost:3000` | Allowed CORS origin |
| `DATABASE_URL` | `mongodb://localhost:27017/project360` | MongoDB connection string |
| `USE_MEMORY_DB` | `true` | Use in-memory MongoDB for dev (no install required) |
| `JWT_SECRET` | — | Fallback JWT signing secret |
| `JWT_ACCESS_SECRET` | — | Access token signing secret |
| `JWT_REFRESH_SECRET` | — | Refresh token signing secret |
| `JWT_ACCESS_EXPIRES_IN` | `1h` | Access token expiry |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | Refresh token expiry |
| `EMAIL_PROVIDER` | `smtp` | Email transport: `smtp` or `sendgrid` |
| `EMAIL_HOST` | — | SMTP host |
| `EMAIL_PORT` | `587` | SMTP port |
| `EMAIL_USER` | — | SMTP username |
| `EMAIL_PASSWORD` | — | SMTP password |
| `EMAIL_FROM` | `noreply@evidentiary.co.za` | Sender address |
| `SENDGRID_API_KEY` | — | SendGrid key (when `EMAIL_PROVIDER=sendgrid`) |
| `STORAGE_PROVIDER` | `local` | File storage: `local`, `s3`, or `azure` |
| `AWS_REGION` | `af-south-1` | AWS region for S3 |
| `AWS_S3_BUCKET` | — | S3 bucket name |

---

## API Routes

All routes are prefixed with `/api/v1`. Tenant-scoped routes use `/:tenantSlug/` prefix.

### Public

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check |

### Auth

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/auth/register-org` | Register new organisation + admin |
| `POST` | `/auth/login` | Login — returns access + refresh tokens |
| `POST` | `/auth/refresh` | Refresh access token |
| `POST` | `/auth/change-password` | Change current user's password |
| `GET` | `/auth/me` | Get current user profile |
| `POST` | `/auth/invite` | Invite user to tenant |
| `POST` | `/auth/accept-invite/:token` | Accept invite with password |
| `POST` | `/auth/client-activate/:token` | Activate client temporary access |
| `GET` | `/auth/check-slug/:slug` | Check org slug availability |

### Super Admin

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/super-admin/tenants` | List all tenants |
| `GET` | `/super-admin/tenants/:id` | Get tenant by ID |
| `PATCH` | `/super-admin/tenants/:id` | Update tenant |

### Tenant-Scoped (`:slug` = tenant slug)

**Projects** — `/:slug/projects`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | List projects (filtered, paginated) |
| `POST` | `/` | Create project |
| `GET` | `/:id` | Get project by ID |
| `PATCH` | `/:id` | Update project |
| `DELETE` | `/:id` | Soft-delete project |
| `GET` | `/:id/stage-status` | Stage gate status + missing docs |
| `POST` | `/:id/advance-stage` | Advance to next stage |
| `GET` | `/:id/budget-summary` | Budget aggregation |
| `GET` | `/:id/approvals` | Stage approvals for project |
| `POST` | `/:id/approvals` | Create stage approval |
| `GET` | `/:id/variations` | Variation orders for project |
| `POST` | `/:id/variations` | Create variation order |
| `GET` | `/:id/funding-sources` | Funding sources for project |
| `POST` | `/:id/funding-sources` | Add funding source |
| `GET` | `/:id/activities` | Activities for project |
| `GET` | `/:id/media` | Site images and drone videos |

**Users** — `/:slug/users`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | List org users |
| `POST` | `/invite` | Invite new user |
| `PATCH` | `/:id` | Update user |
| `DELETE` | `/:id` | Deactivate user |

**Departments** — `/:slug/departments`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | List departments |
| `POST` | `/` | Create department |
| `GET` | `/:id` | Get department |
| `PATCH` | `/:id` | Update department |

**Tasks & Sprints** — `/:slug/tasks` · `/:slug/sprints`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/tasks` | List tasks (by sprint/project/status) |
| `POST` | `/tasks` | Create task |
| `PATCH` | `/tasks/:id` | Update task |
| `DELETE` | `/tasks/:id` | Delete task |
| `GET` | `/sprints` | List sprints |
| `POST` | `/sprints` | Create sprint |

**Files** — `/:slug/files`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | List files (by project/stage/category) |
| `POST` | `/` | Register uploaded file |
| `POST` | `/upload-url` | Get presigned upload URL |
| `PATCH` | `/:id/visibility` | Toggle client visibility |
| `GET` | `/:id/download-url` | Get presigned download URL |
| `DELETE` | `/:id` | Delete file |

**Grants** — `/:slug/grants`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | List grants |
| `POST` | `/` | Create grant |
| `PATCH` | `/:id` | Update grant |
| `DELETE` | `/:id` | Delete grant |

**Calendar** — `/:slug/calendar/events`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | List events (date range filter) |
| `POST` | `/` | Create event |
| `PATCH` | `/:id` | Update event |
| `DELETE` | `/:id` | Delete event |

**Planning** — `/:slug/planning`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | List multi-year plan entries |
| `POST` | `/` | Create plan entry |
| `PATCH` | `/:id` | Update plan entry |
| `POST` | `/:id/begin-inception` | Create project from plan (Stage 0 → 1) |

**Client Access** — `/:slug/client-access`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | List access grants |
| `POST` | `/` | Create temporary access |
| `PATCH` | `/:id` | Update grant (extend, revoke) |

**Reports** — `/:slug/reports`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/dashboard` | Dashboard KPIs + budget breakdown |

**IDP & Services** — `/:slug/idp` · `/:slug/services`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/idp` | IDP project list |
| `GET` | `/idp/export` | Export IDP (XLSX/PDF) |
| `GET` | `/services` | Service category summary |
| `GET` | `/services/export` | Export services (XLSX/PDF) |

---

## Module Architecture

```
src/modules/<feature>/
  ├── <feature>.model.js         # Mongoose schema
  ├── <feature>.repository.js    # DB queries
  ├── <feature>.service.js       # Business logic
  ├── <feature>.controller.js    # Request handlers
  ├── <feature>.validation.js    # Joi schemas
  └── <feature>.routes.js        # Express router
```

### Middleware Stack

Tenant-scoped routes use this chain:

```
authenticate → resolveTenant → requireTenantMembership → validateClientAccess
```

- **authenticate** — Verifies JWT access token, attaches `req.user`
- **resolveTenant** — Resolves `:tenantSlug` to tenant ID, attaches `req.tenant`
- **requireTenantMembership** — Confirms user belongs to the tenant
- **validateClientAccess** — Enforces `CLIENT_TEMP` time + project scope limits

---

## Data Models

| Collection | Key Fields |
|------------|------------|
| **Tenant** | name, slug, orgType, localMunicipalities, status, theme |
| **User** | fullName, email, passwordHash, tenants[{tenantId, role, deptId}] |
| **Department** | name, code, budgetTotal, budgetSpent, programs[] |
| **Project** | name, refCode, currentStage (0-10), contractValueOriginal/Adjusted, serviceCategory, localMunicipality, gpsCoordinates, stageHistory[] |
| **Task** | title, status, priority, assignedTo, projectId, sprintId |
| **Sprint** | name, startDate, endDate, projectId |
| **File** | originalName, storagePath, category (30 types), stage, mediaType, approvalStatus, clientVisible |
| **Grant** | grantName, funderType, totalValue, disbursedToDate |
| **FundingSource** | projectId, sourceType, amount, disbursed |
| **Payment** | projectId, certificateNumber, amount, status |
| **Activity** | projectId, name, startDate, endDate, percentComplete |
| **Milestone** | projectId, name, targetDate, status |
| **CalendarEvent** | title, type, startDate, endDate, projectId |
| **StageApproval** | projectId, stage, fileCategory, status, approvedBy |
| **VariationOrder** | projectId, variationNumber, description, valueChange, status |
| **MultiYearPlan** | projectName, plannedYear, financialYear, estimatedValue, status |
| **TemporaryAccess** | clientEmail, projectIds, expiresAt, status |
| **InviteToken** | tokenHash, email, role, tenantSlug |

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start with nodemon (auto-reload) |
| `npm start` | Production start |
| `npm test` | Jest tests (`tests/` directory) |

---

## License

MIT
