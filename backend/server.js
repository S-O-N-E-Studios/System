require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const { resolveTenant } = require('./middleware/tenantMiddleware');

const app = express();

connectDB();

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.use('/uploads', express.static('uploads'));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: 'Too many requests, please try again later' },
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { message: 'Too many requests, please try again later' },
});

app.use(resolveTenant);

app.use('/api/auth', authLimiter, require('./routes/authRoutes'));
app.use('/api/users', generalLimiter, require('./routes/userRoutes'));
app.use('/api/projects', generalLimiter, require('./routes/projectRoutes'));
app.use('/api/tasks', generalLimiter, require('./routes/taskRoutes'));
app.use('/api/sprints', generalLimiter, require('./routes/sprintRoutes'));
app.use('/api/files', generalLimiter, require('./routes/fileRoutes'));
app.use('/api/payments', generalLimiter, require('./routes/paymentRoutes'));
app.use('/api/dashboard', generalLimiter, require('./routes/dashboardRoutes'));
app.use('/api/reports', generalLimiter, require('./routes/reportsRoutes'));
app.use('/api/admin/tenants', generalLimiter, require('./routes/tenantRoutes'));

app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
