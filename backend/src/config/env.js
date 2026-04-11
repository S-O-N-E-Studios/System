'use strict';

/**
 * Centralised environment configuration.
 * All process.env reads happen here — no raw process.env access in controllers/services.
 */
module.exports = {
  // ── Server ──────────────────────────────────────────────────────────────
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT:     process.env.PORT     || 5000,

  // ── Database ─────────────────────────────────────────────────────────────
  MONGODB_URI:      process.env.MONGODB_URI,
  MONGODB_TEST_URI: process.env.MONGODB_TEST_URI,

  // ── Auth ─────────────────────────────────────────────────────────────────
  JWT_SECRET:  process.env.JWT_SECRET  || 'change-me-before-production',
  JWT_EXPIRE:  process.env.JWT_EXPIRE  || '15m',
  REFRESH_EXPIRE: process.env.REFRESH_EXPIRE || '7d',

  // ── App URL (used in email links) ─────────────────────────────────────────
  APP_URL: process.env.APP_URL || 'https://app.project360.co.za',

  // ── Email / SMTP ──────────────────────────────────────────────────────────
  // Leave EMAIL_HOST / EMAIL_USER / EMAIL_PASSWORD unset in development to
  // use the Ethereal test transport (emails captured, never really sent).
  EMAIL_HOST:     process.env.EMAIL_HOST,
  EMAIL_PORT:     Number(process.env.EMAIL_PORT) || 587,
  EMAIL_SECURE:   process.env.EMAIL_SECURE === 'true', // true = port 465 TLS
  EMAIL_USER:     process.env.EMAIL_USER,
  EMAIL_PASSWORD: process.env.EMAIL_PASSWORD,
  EMAIL_FROM:     process.env.EMAIL_FROM || '"Project 360" <noreply@project360.co.za>',

  // ── CORS ─────────────────────────────────────────────────────────────────
  ALLOWED_ORIGINS: (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(','),

  // ── File storage (AWS S3 / Azure Blob) ───────────────────────────────────
  AWS_ACCESS_KEY_ID:     process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  AWS_REGION:            process.env.AWS_REGION  || 'af-south-1',
  AWS_S3_BUCKET:         process.env.AWS_S3_BUCKET,

  // ── Google Maps ───────────────────────────────────────────────────────────
  GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY,
};
