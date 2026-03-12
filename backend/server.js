// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./config/db');

const app = express();

// Connect to database
connectDB();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json()); // parse JSON bodies
app.use(express.urlencoded({ extended: true })); // parse URL-encoded bodies

// Serve static files from uploads folder (so uploaded images can be accessed)
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/projects', require('./routes/projectRoutes'));
app.use('/api/tasks', require('./routes/taskDirectRoutes'));
app.use('/api/projects/:projectId/tasks', require('./routes/taskRoutes'));
app.use('/api/tasks/:taskId/comments', require('./routes/commentRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));

// Dashboard summary (we'll add later)
app.use('/api/dashboard', require('./routes/dashboardRoutes'));

// Health check
app.get('/health', (req, res) => res.send('OK'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));