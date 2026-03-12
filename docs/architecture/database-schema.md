# Database Schema

## Collections

- **User:** name, email, password, role
- **Project:** name, description, status, createdBy
- **Task:** title, description, status, project, assignee
- **Sprint:** name, startDate, endDate, project
- **File:** filename, originalName, mimeType, size, url, uploadedBy

(Schemas are defined in `backend/src/models/`.)
