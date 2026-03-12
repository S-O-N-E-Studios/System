# Backend API

This repository contains the **Express.js** and **MongoDB** powered backend for the
Project Management application. It provides a RESTful interface for managing
users, projects, tasks, files, comments and authentication.

---

## 🛠️ Features

- User authentication with JWT and role-based access (admin, project manager, team member)
- CRUD operations for projects, tasks, comments and file uploads
- Middleware for request validation, error handling and file storage
- Integration with AWS S3 for file uploads (configurable)
- Comprehensive unit and integration tests with Jest & Supertest
- Coding standards enforced via ESLint and Prettier

---

## 🚀 Getting Started

### Prerequisites

- Node.js v18+ (LTS recommended)
- npm or yarn
- MongoDB (Atlas or local instance)

### Installation

```bash
# clone or copy the backend folder into your workspace
cd backend
npm install
```

### Configuration

1. Duplicate the example environment file and edit values:

   ```bash
   cp .env.example .env
   ```

2. Set your MongoDB connection string and other secrets in `.env`.
   At minimum you must provide:

   ```env
   MONGO_URI=mongodb://localhost:27017/your-db
   JWT_SECRET=supersecretkey
   ```

3. (Optional) Configure AWS credentials for file uploads and email settings.

### Running

- Development (auto‑reload with nodemon):

  ```bash
  npm run dev
  ```

- Production build and start (if applicable):

  ```bash
  npm start
  ```

Server listens on `PORT` defined in `.env` (default `5000`).

---

## 📡 API Endpoints

> Base URL: `/api/v1`

| Method | Path                     | Description                    |
|--------|--------------------------|--------------------------------|
| GET    | `/health`                | Health check (public)          |
| GET    | `/test`                  | Simple API test                |
| POST   | `/auth/login`            | User login                     |
| POST   | `/users`                 | Create user (admin only)       |
| GET    | `/projects`              | List projects                  |
| POST   | `/projects`              | Create project (manager/admin) |
| ...    | *other routes*           | See source `routes` directory  |

> A more complete specification can be found in `docs/api/api-documentation.md`.

---

## ✅ Scripts

```json
"scripts": {
  "start": "node server.js",
  "dev": "nodemon server.js",
  "test": "jest --watchAll --verbose",
  "test:ci": "jest --ci --coverage",
  "lint": "eslint src/**/*.js",
  "lint:fix": "eslint src/**/*.js --fix",
  "format": "prettier --write \"src/**/*.js\""
}
```

Run tests:

```bash
npm test
```

Lint and format the code before committing:

```bash
npm run lint:fix
npm run format
```

---

## 🧪 Testing

Unit and integration tests live under `tests/`. The setup file loads
environment variables and connects to an in‑memory MongoDB instance.

```bash
npm run test:ci
```

---

## 🤝 Contributing

This project is part of a larger mono-repo; please work on the `backend/`
directory. Make sure to create feature branches, run the linter, and add tests
for new functionality.

---

## 📄 License

MIT

