# Project Management Web Application

MERN Stack application for managing projects, tasks, and teams with Agile methodologies.

## Tech Stack

- **Frontend:** React, Redux Toolkit, Material-UI
- **Backend:** Node.js, Express, MongoDB
- **Authentication:** JWT
- **File Storage:** AWS S3 (or Azure Blob)
- **Maps:** Google Maps API

## Prerequisites

- Node.js 18+
- MongoDB 6+
- npm or yarn
- Git

## Quick Start

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd project-management-app
   ```

2. **Install dependencies:**
   ```bash
   npm run install:all
   ```

3. **Set up environment variables:**
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```
   Edit both `.env` files with your values.

4. **Start MongoDB** (if using local):
   ```bash
   mongod
   ```

5. **Run development servers:**
   ```bash
   npm run dev
   ```
   - Backend: http://localhost:5000
   - Frontend: http://localhost:3000

## Project Structure

```
project-management-app/
├── backend/          # Express API
├── frontend/         # React application
├── docs/             # Documentation
└── scripts/          # Utility scripts
```

## Available Scripts

### Root
- `npm run dev` - Start both frontend and backend
- `npm run test` - Run all tests
- `npm run lint` - Lint all code

### Backend
- `npm run dev` - Start backend with nodemon
- `npm test` - Run backend tests

### Frontend
- `npm start` - Start React development server
- `npm test` - Run frontend tests
- `npm run build` - Build for production

## Documentation

- [Setup Guide](docs/guides/setup-guide.md)
- [API Documentation](docs/api/api-documentation.md)
- [Architecture](docs/architecture/system-design.md)

## Team

- Fortune Mabona - Project Lead

## License

MIT
