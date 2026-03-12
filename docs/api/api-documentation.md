# API Documentation

## Base URL

`http://localhost:5000/api/v1`

## Endpoints

### Health

- `GET /health` – Server health check (no prefix)

### Test

- `GET /api/v1/test` – API test response

### Auth (Sprint 2)

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/register`

### Projects (Sprint 3)

- `GET /api/v1/projects`
- `GET /api/v1/projects/:id`
- `POST /api/v1/projects`
- `PUT /api/v1/projects/:id`
- `DELETE /api/v1/projects/:id`

### Tasks (Sprint 4)

- `GET /api/v1/tasks`
- `GET /api/v1/tasks/:id`
- `POST /api/v1/tasks`
- `PUT /api/v1/tasks/:id`
- `DELETE /api/v1/tasks/:id`
