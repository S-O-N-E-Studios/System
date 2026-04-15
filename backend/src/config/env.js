const NODE_ENV = process.env.NODE_ENV || "development";

const requireInProduction = (value, key) => {
  if (NODE_ENV === "production" && (!value || String(value).trim() === "")) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const JWT_SECRET =
  requireInProduction(process.env.JWT_SECRET, "JWT_SECRET") ||
  "dev-jwt-secret-change-me";
const JWT_ACCESS_SECRET =
  requireInProduction(process.env.JWT_ACCESS_SECRET, "JWT_ACCESS_SECRET") ||
  JWT_SECRET;
const JWT_REFRESH_SECRET =
  requireInProduction(process.env.JWT_REFRESH_SECRET, "JWT_REFRESH_SECRET") ||
  `${JWT_SECRET}-refresh`;

module.exports = {
  PORT: process.env.PORT || 5000,
  NODE_ENV,
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:3000",
  DATABASE_URL: process.env.DATABASE_URL || "mongodb://localhost:27017/project360",

  JWT_SECRET,
  JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET,
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || "1h",
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || "7d",

  EMAIL_PROVIDER: process.env.EMAIL_PROVIDER || "smtp",
  EMAIL_HOST: process.env.EMAIL_HOST,
  EMAIL_PORT: process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT, 10) : 587,
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASSWORD: process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS,
  EMAIL_FROM: process.env.EMAIL_FROM || "noreply@project360.co.za",
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,

  /** Optional: encrypts per-tenant SMTP passwords at rest (set in production). */
  TENANT_SMTP_ENCRYPTION_KEY: process.env.TENANT_SMTP_ENCRYPTION_KEY,

  STORAGE_PROVIDER: process.env.STORAGE_PROVIDER || "local",
  AWS_REGION: process.env.AWS_REGION || "af-south-1",
  AWS_S3_BUCKET: process.env.AWS_S3_BUCKET,

  isProduction: NODE_ENV === "production",
  isTest: NODE_ENV === "test",
  isDevelopment: NODE_ENV === "development",
};