# EVIDENTIARY — API Reference

> **Base URL:** `http://localhost:5000/api/v1`
>
> All tenant-scoped endpoints are prefixed with `/:tenantSlug/`. Authentication is required unless marked as public.

---

## Authentication

All protected routes require a `Bearer` token in the `Authorization` header:

```
Authorization: Bearer <access_token>
```

Access tokens expire after 1 hour. Use the refresh endpoint to obtain a new one.

---

## Response Format

All responses follow a consistent envelope:

```json
{
  "success": true,
  "data": { ... }
}
```

Error responses:

```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Human-readable description"
}
```

---

## Public Endpoints

### Health Check

```
GET /health
```

**Response:** `{ "success": true, "status": "ok" }`

---

## Auth Endpoints

### Register Organisation

```
POST /auth/register-org
```

Creates a new tenant and admin user.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `fullName` | string | Yes | Admin's full name |
| `email` | string | Yes | Admin's email |
| `password` | string | Yes | Min 8 chars, 1 uppercase, 1 number |
| `orgName` | string | Yes | Organisation name |
| `orgType` | string | Yes | `provincial_gov` or `private_firm` |
| `orgSlug` | string | Yes | URL-safe org slug |

**Response:** `{ user, accessToken, refreshToken }`

### Login

```
POST /auth/login
```

| Field | Type | Required |
|-------|------|----------|
| `email` | string | Yes |
| `password` | string | Yes |

**Response:** `{ user, accessToken, refreshToken }`

### Refresh Token

```
POST /auth/refresh
```

Pass refresh token via cookie or body. Returns new `accessToken` and `refreshToken`.

### Get Current User

```
GET /auth/me
```

Returns the authenticated user's profile including tenant memberships.

### Change Password

```
POST /auth/change-password
```

| Field | Type | Required |
|-------|------|----------|
| `currentPassword` | string | Yes |
| `newPassword` | string | Yes |

### Check Slug Availability

```
GET /auth/check-slug/:slug
```

**Response:** `{ available: true, suggestion?: "alt-slug" }`

### Invite User

```
POST /auth/invite
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | Invitee's email |
| `role` | string | Yes | Role to assign |
| `tenantSlug` | string | Yes | Target tenant |
| `deptId` | string | No | Department (for DEPT_ADMIN) |

### Accept Invite

```
POST /auth/accept-invite/:token
```

| Field | Type | Required |
|-------|------|----------|
| `fullName` | string | Yes |
| `password` | string | Yes |

### Client Activate

```
POST /auth/client-activate/:token
```

Activates temporary client access. Returns user and tokens.

---

## Super Admin Endpoints

Requires `SUPER_ADMIN` role.

### List Tenants

```
GET /super-admin/tenants
```

### Get Tenant

```
GET /super-admin/tenants/:id
```

### Update Tenant

```
PATCH /super-admin/tenants/:id
```

---

## Tenant-Scoped Endpoints

All paths below are relative to `/:tenantSlug/`.

### Projects

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/projects` | List projects (paginated, filterable) |
| `POST` | `/projects` | Create project |
| `GET` | `/projects/:id` | Get project detail |
| `PATCH` | `/projects/:id` | Update project |
| `DELETE` | `/projects/:id` | Soft-delete project |
| `GET` | `/projects/:id/stage-status` | Stage gate status |
| `POST` | `/projects/:id/advance-stage` | Advance to next stage |
| `GET` | `/projects/:id/budget-summary` | Budget aggregation |

**Query parameters for list:**

| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page number (default 1) |
| `limit` | number | Items per page (default 20) |
| `search` | string | Name search |
| `serviceCategory` | string | Filter by service category |
| `currentStage` | number | Filter by stage (0-10) |
| `status` | string | Filter by status |
| `deptId` | string | Filter by department |

### Project Sub-Resources

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/projects/:id/approvals` | List stage approvals |
| `POST` | `/projects/:id/approvals` | Create approval request |
| `PATCH` | `/projects/:id/approvals/:approvalId` | Approve or reject |
| `GET` | `/projects/:id/variations` | List variation orders |
| `POST` | `/projects/:id/variations` | Create variation order |
| `PATCH` | `/projects/:id/variations/:voId` | Update variation |
| `GET` | `/projects/:id/funding-sources` | List funding sources |
| `POST` | `/projects/:id/funding-sources` | Add funding source |
| `GET` | `/projects/:id/activities` | List activities |
| `GET` | `/projects/:id/media` | List site media |
| `POST` | `/projects/:id/media/upload-url` | Get media upload URL |
| `POST` | `/projects/:id/media` | Register media |

### Users

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/users` | List org users |
| `POST` | `/users/invite` | Invite user |
| `PATCH` | `/users/:id` | Update user role/dept |
| `DELETE` | `/users/:id` | Deactivate user |

### Departments

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/departments` | List departments |
| `POST` | `/departments` | Create department |
| `GET` | `/departments/:id` | Get department |
| `PATCH` | `/departments/:id` | Update department |

### Tasks

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/tasks` | List tasks |
| `POST` | `/tasks` | Create task |
| `PATCH` | `/tasks/:id` | Update task |
| `DELETE` | `/tasks/:id` | Delete task |

### Sprints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/sprints` | List sprints |
| `POST` | `/sprints` | Create sprint |

### Files

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/files` | List files (by project/stage/category) |
| `POST` | `/files` | Register uploaded file |
| `POST` | `/files/upload-url` | Get presigned upload URL |
| `PATCH` | `/files/:id/visibility` | Toggle client visibility |
| `GET` | `/files/:id/download-url` | Get download URL |
| `DELETE` | `/files/:id` | Delete file |

### Grants

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/grants` | List grants |
| `POST` | `/grants` | Create grant |
| `PATCH` | `/grants/:id` | Update grant |
| `DELETE` | `/grants/:id` | Delete grant |

### Calendar Events

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/calendar/events` | List events (date range) |
| `POST` | `/calendar/events` | Create event |
| `PATCH` | `/calendar/events/:id` | Update event |
| `DELETE` | `/calendar/events/:id` | Delete event |

### Multi-Year Planning

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/planning` | List plan entries |
| `POST` | `/planning` | Create plan entry |
| `PATCH` | `/planning/:id` | Update plan entry |
| `DELETE` | `/planning/:id` | Delete plan entry |
| `POST` | `/planning/:id/begin-inception` | Promote to project |

### Client Access

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/client-access` | List access grants |
| `POST` | `/client-access` | Create access grant |
| `PATCH` | `/client-access/:id` | Update (extend/revoke) |

### Reports

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/reports/dashboard` | Dashboard KPIs + breakdowns |

### IDP & Services

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/idp` | IDP project aggregation |
| `GET` | `/idp/export` | Export IDP (format=xlsx/pdf) |
| `GET` | `/services` | Service category summary |
| `GET` | `/services/export` | Export services (format=xlsx/pdf) |

---

## Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| `VALIDATION_ERROR` | 400 | Request body/params failed Joi validation |
| `UNAUTHORIZED` | 401 | Missing or invalid auth token |
| `FORBIDDEN` | 403 | Insufficient role/permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Duplicate resource (e.g., slug taken) |
| `STAGE_GATE_FAILED` | 422 | Missing required documents for stage advance |
| `RATE_LIMITED` | 429 | Too many requests |
| `SERVER_ERROR` | 500 | Internal server error |

---

## Rate Limiting

Default: 100 requests per 15-minute window per IP. Configurable via `express-rate-limit`.
