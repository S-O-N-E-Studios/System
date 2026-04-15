
//  * Handles:
//  *  - JWT access + refresh token generation (with CLIENT_TEMP temporaryAccessId claim)
//  *  - Secure random token generation for invite / password reset / client activation links
//  *  - Token hashing for safe DB storage (we store the hash, send the raw token in the URL)


const jwt    = require('jsonwebtoken');
const crypto = require('crypto');
const env    = require('../config/env');

//  JWT ─

const buildJwtPayload = (user, temporaryAccessId = null) => {
  const payload = {
    sub:   user._id.toString(),
    email: user.email,
    role:  user.role,
  };

  if (user.role === 'CLIENT_TEMP') {
    if (!temporaryAccessId) {
      throw new Error('temporaryAccessId is required for CLIENT_TEMP tokens');
    }
    payload.temporaryAccessId = temporaryAccessId.toString();
  }

  return payload;
};


const generateAccessToken = (user, temporaryAccessId = null) => {
  const payload = buildJwtPayload(user, temporaryAccessId);
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  });
};


const generateRefreshToken = (user, temporaryAccessId = null) => {
  const payload = buildJwtPayload(user, temporaryAccessId);
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  });
};


//   Verify an access token.

const verifyAccessToken = (token) =>
  jwt.verify(token, env.JWT_ACCESS_SECRET);


//  Verify a refresh token.
 
const verifyRefreshToken = (token) =>
  jwt.verify(token, env.JWT_REFRESH_SECRET);

//  One-time tokens (invite / reset / client activation) ──

/**
 * Generate a cryptographically secure random token.
 * The raw token is sent in the URL; only its hash is stored in the DB.
 *
 * Expiry constants (from MVP spec):
 *  - Invite tokens:             72 hours
 *  - Client activation tokens:  7 days
 *  - Password reset tokens:     1 hour
 *
 * @returns {string} 64-char hex token (32 random bytes)
 */
const generateSecureToken = () => crypto.randomBytes(32).toString('hex');
const hashToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');
const tokenExpiresAt = (hours) => new Date(Date.now() + hours * 60 * 60 * 1000);

// Named expiry helpers matching MVP spec
const inviteTokenExpiry       = () => tokenExpiresAt(72);   // 72 hours
const activationTokenExpiry   = () => tokenExpiresAt(7 * 24); // 7 days
const passwordResetTokenExpiry = () => tokenExpiresAt(1);    // 1 hour

//  Cookie helpers 



const refreshCookieOptions = () => ({
  httpOnly: true,
  secure:   env.isProduction,
  sameSite: env.isProduction ? 'strict' : 'lax',
  maxAge:   7 * 24 * 60 * 60 * 1000, // 7 days in ms
  path:     '/api/v1/auth',
});


const clearCookieOptions = () => ({
  httpOnly: true,
  secure:   env.isProduction,
  sameSite: env.isProduction ? 'strict' : 'lax',
  path:     '/api/v1/auth',
});

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateSecureToken,
  hashToken,
  tokenExpiresAt,
  inviteTokenExpiry,
  activationTokenExpiry,
  passwordResetTokenExpiry,
  refreshCookieOptions,
  clearCookieOptions,
};