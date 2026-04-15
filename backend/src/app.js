
//  * Sets up the Express app with:
//  *  - Security headers (Helmet)
//  *  - CORS allowlist
//  *  - Rate limiting (auth: 100 req/15min, general: 1000 req/15min)
//  *  - Cookie parser (for httpOnly refresh token)
//  *  - JSON body parsing
//  *  - All API routes under /api/v1
//  *  - 404 handler
//  *  - Global error handler


const express      = require('express');
const helmet       = require('helmet');
const cors         = require('cors');
const rateLimit    = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const morgan       = require('morgan');

const env = require('./config/env');
const apiRoutes = require('./routes/index');
const { errorHandler, notFoundHandler } = require('./middleware/error.middleware');

const app = express();

//  Security headers 

app.use(
  helmet({
    // Default `same-origin` blocks <img src="http://api:5000/uploads/..."> from the SPA on another port.
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
);

//  CORS 

const ALLOWED_ORIGINS = [
  env.CLIENT_URL,
  ...(env.isDevelopment ? ['http://localhost:5173', 'http://localhost:3000'] : []),
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (server-to-server, tests, curl/Postman)
      if (!origin && (env.isDevelopment || env.isTest)) return callback(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: Origin ${origin} not allowed`));
    },
    credentials: true, // Required for httpOnly cookie
    methods:     ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-Slug'],
  })
);

//  Rate limiting 

// Auth endpoints: 100 requests per 15 minutes per IP (spec section 11.2)
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      100,
  message: {
    success: false,
    error:   'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests from this IP. Please try again in 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders:   false,
});

// General endpoints: 1000 requests per 15 minutes per user (spec section 11.2)
const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      1000,
  message: {
    success: false,
    error:   'RATE_LIMIT_EXCEEDED',
    message: 'Rate limit exceeded. Please slow down.',
  },
  standardHeaders: true,
  legacyHeaders:   false,
});

app.use('/api/v1/auth', authRateLimit);
app.use('/api/v1', generalRateLimit);

//  Body parsing 

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

//  HTTP request logging 

if (!env.isTest) {
  app.use(morgan(env.isProduction ? 'combined' : 'dev'));
}

//  Public uploaded images (avatars, org logos)
const { UPLOAD_ROOT } = require('./utils/savePublicImage');
app.use('/uploads', express.static(UPLOAD_ROOT));

//  Routes 

app.use('/api/v1', apiRoutes);

//  Error handling 

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;