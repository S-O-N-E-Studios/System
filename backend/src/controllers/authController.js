/**
 * Auth controller — login, registration, password reset, email verification,
 * user invites, and client temporary access.
 *
 * Token storage: MVP uses an in-memory Map (resets on server restart).
 * Replace with a MongoDB-backed model in Sprint 4 when the database is wired.
 */

'use strict';

const crypto = require('crypto');
const emailService = require('../services/emailService');
const logger = require('../utils/logger');

const APP_URL = process.env.APP_URL || 'https://app.project360.co.za';

// ── In-memory token stores (replace with DB models in production) ────────────
const resetTokenStore  = new Map(); // token → { email, name, expiresAt }
const verifyTokenStore = new Map(); // token → { email, name, orgName, expiresAt }
const inviteTokenStore = new Map(); // token → { email, orgName, orgSlug, role, invitedByName, invitedByEmail, expiresAt }
const clientTokenStore = new Map(); // token → { clientEmail, orgName, grantedByName, projectNames, expiresAt, projectIds, tenantSlug }

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

function tokenExpiresAt(minutes) {
  return new Date(Date.now() + minutes * 60 * 1000);
}

function isExpired(expiresAt) {
  return new Date() > new Date(expiresAt);
}

function buildTokens() {
  const base = Date.now().toString(36);
  return {
    accessToken: `demo-access-${base}`,
    refreshToken: `demo-refresh-${base}`,
  };
}

function buildUserFromRegister(body) {
  const {
    orgName,
    slug,
    adminFirstName,
    adminLastName,
    adminEmail,
  } = body;

  const tenantId = `tenant-${Date.now().toString(36)}`;

  return {
    id: `user-${Date.now().toString(36)}`,
    email: adminEmail,
    firstName: adminFirstName,
    lastName: adminLastName,
    role: 'ORG_ADMIN',
    tenants: [
      {
        id: tenantId,
        slug,
        name: orgName,
        logo: undefined,
        role: 'ORG_ADMIN',
      },
    ],
  };
}

function buildDemoUser(email) {
  return {
    id: 'demo-user',
    email,
    firstName: 'Demo',
    lastName: 'User',
    role: 'ORG_ADMIN',
    tenants: [
      {
        id: 'tenant-1',
        slug: 'limpopo-civil',
        name: 'Limpopo Civil Engineering',
        logo: undefined,
        role: 'ORG_ADMIN',
      },
      {
        id: 'tenant-2',
        slug: 'gauteng-structures',
        name: 'Gauteng Structures Corp',
        logo: undefined,
        role: 'PROJECT_MANAGER',
      },
    ],
  };
}

exports.login = (req, res) => {
  const { email } = req.body;
  const user = buildDemoUser(email || 'demo@project360.com');
  const tokens = buildTokens();

  res.json({
    data: {
      user,
      tokens,
    },
  });
};

exports.registerOrg = (req, res) => {
  const body = req.body || {};
  const required = ['orgName', 'slug', 'adminFirstName', 'adminLastName', 'adminEmail', 'adminPassword'];
  const missing = required.filter((key) => !body[key]);
  if (missing.length > 0) {
    return res.status(400).json({
      data: null,
      message: `Missing required fields: ${missing.join(', ')}`,
    });
  }

  const user = buildUserFromRegister(body);
  const tokens = buildTokens();

  res.status(201).json({
    data: {
      user,
      tokens,
    },
    message: 'Organisation registered (demo)',
  });
};

exports.checkSlug = (req, res) => {
  const { slug } = req.params;
  // Very lightweight check: mark obviously "taken" slugs as unavailable.
  const taken = ['demo', 'test', 'project360', 'project-360', 'sa-project-360-iq'];

  const available = !taken.includes(String(slug).toLowerCase());

  res.json({
    data: {
      available,
      suggestion: available ? undefined : `${slug}-1`,
    },
  });
};

exports.acceptInvite = (req, res) => {
  const { token, password } = req.body || {};
  const email = token ? `invite+${token}@example.com` : 'invite@example.com';
  void password; // unused in demo implementation

  const user = buildDemoUser(email);
  const tokens = buildTokens();

  res.json({
    data: {
      user,
      tokens,
    },
    message: 'Invite accepted (demo)',
  });
};

exports.changePassword = (req, res) => {
  void req.body; // no‑op in demo
  res.json({
    data: null,
    message: 'Password changed (demo)',
  });
};

exports.refreshToken = (req, res) => {
  void req.body; // no‑op in demo
  const tokens = buildTokens();
  res.json({
    data: tokens,
  });
};

exports.getMe = (req, res) => {
  // In a real implementation we would read the user from the access token.
  // For now, return a stable demo user so the UI can hydrate.
  const user = buildDemoUser('demo@project360.com');
  res.json({
    data: user,
  });
};

// ════════════════════════════════════════════════════════════════════════════
// FORGOT PASSWORD — initiate a reset request
// POST /auth/forgot-password
// Body: { email }
// ════════════════════════════════════════════════════════════════════════════

exports.forgotPassword = async (req, res) => {
  const { email } = req.body || {};

  if (!email) {
    return res.status(400).json({ data: null, message: 'Email address is required.' });
  }

  // In production: look up the user by email in the DB.
  // MVP: accept any email and generate a reset token.
  const name = email.split('@')[0]; // placeholder until User model is wired
  const token = generateToken();
  const expiresAt = tokenExpiresAt(60); // 1 hour

  resetTokenStore.set(token, { email, name, expiresAt });

  const resetUrl = `${APP_URL}/reset-password/${token}`;

  try {
    const result = await emailService.sendForgotPassword(email, { name, email, resetUrl, expiryMinutes: 60 });
    logger.info(`[auth] Forgot-password email sent to ${email}, token: ${token.slice(0, 8)}…`);

    // In development, return the Ethereal preview URL so developers can inspect the email.
    const devInfo = process.env.NODE_ENV !== 'production' ? { previewUrl: result.previewUrl } : {};

    return res.json({
      data: devInfo,
      message: 'If an account with that email exists, a password reset link has been sent.',
    });
  } catch (err) {
    logger.error(`[auth] Failed to send forgot-password email: ${err.message}`);
    return res.status(500).json({ data: null, message: 'Failed to send reset email. Please try again.' });
  }
};

// ════════════════════════════════════════════════════════════════════════════
// RESET PASSWORD — consume the token and set a new password
// POST /auth/reset-password/:token
// Body: { password, confirmPassword }
// ════════════════════════════════════════════════════════════════════════════

exports.resetPassword = (req, res) => {
  const { token } = req.params;
  const { password, confirmPassword } = req.body || {};

  if (!password || !confirmPassword) {
    return res.status(400).json({ data: null, message: 'Password and confirmPassword are required.' });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ data: null, message: 'Passwords do not match.' });
  }
  if (password.length < 8) {
    return res.status(400).json({ data: null, message: 'Password must be at least 8 characters.' });
  }

  const record = resetTokenStore.get(token);

  if (!record) {
    return res.status(400).json({ data: null, message: 'Invalid or expired reset link.' });
  }
  if (isExpired(record.expiresAt)) {
    resetTokenStore.delete(token);
    return res.status(400).json({ data: null, message: 'This reset link has expired. Please request a new one.' });
  }

  // In production: hash the password and update the User record in MongoDB.
  resetTokenStore.delete(token); // single-use
  logger.info(`[auth] Password reset for ${record.email} (demo — no DB write yet)`);

  return res.json({ data: null, message: 'Password reset successfully. You can now log in.' });
};

// ════════════════════════════════════════════════════════════════════════════
// SEND EMAIL VERIFICATION — (re)send verification email
// POST /auth/send-verification
// Body: { email, name, orgName }
// ════════════════════════════════════════════════════════════════════════════

exports.sendVerification = async (req, res) => {
  const { email, name, orgName = 'your organisation' } = req.body || {};

  if (!email) {
    return res.status(400).json({ data: null, message: 'Email address is required.' });
  }

  // Generate a 6-digit OTP and a URL-based token
  const otp   = String(Math.floor(100000 + Math.random() * 900000));
  const token = generateToken();
  const expiresAt = tokenExpiresAt(24 * 60); // 24 hours

  verifyTokenStore.set(token, { email, name: name || email.split('@')[0], orgName, expiresAt });

  const verifyUrl = `${APP_URL}/verify-email/${token}`;

  try {
    const result = await emailService.sendEmailVerification(email, {
      name: name || email.split('@')[0],
      orgName,
      verifyUrl,
      otpCode: otp,
      expiryHours: 24,
    });

    logger.info(`[auth] Verification email sent to ${email}`);

    const devInfo = process.env.NODE_ENV !== 'production' ? { previewUrl: result.previewUrl } : {};
    return res.json({ data: devInfo, message: 'Verification email sent.' });
  } catch (err) {
    logger.error(`[auth] Failed to send verification email: ${err.message}`);
    return res.status(500).json({ data: null, message: 'Failed to send verification email.' });
  }
};

// ════════════════════════════════════════════════════════════════════════════
// VERIFY EMAIL — consume the verification token
// POST /auth/verify-email/:token
// ════════════════════════════════════════════════════════════════════════════

exports.verifyEmail = (req, res) => {
  const { token } = req.params;
  const record = verifyTokenStore.get(token);

  if (!record) {
    return res.status(400).json({ data: null, message: 'Invalid or expired verification link.' });
  }
  if (isExpired(record.expiresAt)) {
    verifyTokenStore.delete(token);
    return res.status(400).json({ data: null, message: 'Verification link has expired. Please request a new one.' });
  }

  // In production: set user.emailVerified = true in MongoDB.
  verifyTokenStore.delete(token);
  logger.info(`[auth] Email verified for ${record.email} (demo)`);

  return res.json({ data: { email: record.email }, message: 'Email verified successfully.' });
};

// ════════════════════════════════════════════════════════════════════════════
// INVITE USER — Org Admin sends a team member invitation
// POST /auth/invite-user
// Body: { recipientEmail, recipientName?, role, orgName, orgSlug, invitedByName, invitedByEmail, message? }
// ════════════════════════════════════════════════════════════════════════════

exports.inviteUser = async (req, res) => {
  const {
    recipientEmail,
    recipientName,
    role = 'MEMBER',
    orgName,
    orgSlug,
    invitedByName,
    invitedByEmail,
    message,
  } = req.body || {};

  const missing = ['recipientEmail', 'orgName', 'orgSlug', 'invitedByName', 'invitedByEmail']
    .filter((k) => !req.body?.[k]);
  if (missing.length > 0) {
    return res.status(400).json({ data: null, message: `Missing fields: ${missing.join(', ')}` });
  }

  const token = generateToken();
  const expiresAt = tokenExpiresAt(72 * 60); // 72 hours

  inviteTokenStore.set(token, {
    email: recipientEmail, orgName, orgSlug, role, invitedByName, invitedByEmail, expiresAt,
  });

  const acceptUrl = `${APP_URL}/invite/${token}`;

  try {
    const result = await emailService.sendUserInvite(recipientEmail, {
      recipientName,
      invitedByName,
      invitedByEmail,
      orgName,
      role,
      acceptUrl,
      expiryHours: 72,
      message,
    });

    logger.info(`[auth] User invite sent to ${recipientEmail} for ${orgName}`);

    const devInfo = process.env.NODE_ENV !== 'production' ? { previewUrl: result.previewUrl } : {};
    return res.status(201).json({
      data: { token: token.slice(0, 8) + '…', ...devInfo },
      message: `Invitation sent to ${recipientEmail}.`,
    });
  } catch (err) {
    logger.error(`[auth] Failed to send user invite: ${err.message}`);
    return res.status(500).json({ data: null, message: 'Failed to send invitation email.' });
  }
};

// ════════════════════════════════════════════════════════════════════════════
// ACCEPT INVITE — validate the invite token (extends existing handler)
// POST /auth/accept-invite/:token
// Body: { password, firstName, lastName }
// ════════════════════════════════════════════════════════════════════════════

exports.acceptInviteByToken = (req, res) => {
  const { token } = req.params;
  const { password, firstName, lastName } = req.body || {};

  const record = inviteTokenStore.get(token);
  if (!record) {
    return res.status(400).json({ data: null, message: 'Invalid or expired invitation link.' });
  }
  if (isExpired(record.expiresAt)) {
    inviteTokenStore.delete(token);
    return res.status(400).json({ data: null, message: 'This invitation has expired. Please ask the admin to re-invite you.' });
  }
  if (!password || password.length < 8) {
    return res.status(400).json({ data: null, message: 'Password must be at least 8 characters.' });
  }

  // In production: create the User record in MongoDB.
  inviteTokenStore.delete(token);

  const user = {
    id: `user-${Date.now().toString(36)}`,
    email: record.email,
    firstName: firstName || 'New',
    lastName:  lastName  || 'User',
    role: record.role,
    tenants: [{
      id: `tenant-${Date.now().toString(36)}`,
      slug: record.orgSlug,
      name: record.orgName,
      role: record.role,
    }],
  };
  const tokens = buildTokens();

  logger.info(`[auth] Invite accepted: ${record.email} joined ${record.orgName} as ${record.role}`);

  return res.json({ data: { user, tokens }, message: 'Invitation accepted. Welcome to Project 360!' });
};

// ════════════════════════════════════════════════════════════════════════════
// CLIENT INVITE — Org Admin grants temporary client access
// POST /auth/client-invite
// Body: { clientEmail, grantedByName, orgName, tenantSlug, projectNames, projectIds, expiresAt }
// ════════════════════════════════════════════════════════════════════════════

exports.clientInvite = async (req, res) => {
  const {
    clientEmail,
    grantedByName,
    orgName,
    tenantSlug,
    projectNames = [],
    projectIds   = [],
    expiresAt,
    includeFinancials = false,
  } = req.body || {};

  const missing = ['clientEmail', 'grantedByName', 'orgName', 'tenantSlug', 'expiresAt']
    .filter((k) => !req.body?.[k]);
  if (missing.length > 0) {
    return res.status(400).json({ data: null, message: `Missing fields: ${missing.join(', ')}` });
  }

  const token = generateToken();
  clientTokenStore.set(token, {
    clientEmail, orgName, grantedByName, projectNames, projectIds,
    expiresAt, tenantSlug,
  });

  const activateUrl = `${APP_URL}/client-access/${token}`;
  const expiresLabel = new Date(expiresAt).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  try {
    const result = await emailService.sendClientInvite(clientEmail, {
      grantedByName,
      orgName,
      projectNames: projectNames.length > 0 ? projectNames : ['(project details available after activation)'],
      expiresAt: expiresLabel,
      activateUrl,
      includeFinancials,
    });

    logger.info(`[auth] Client invite sent to ${clientEmail} by ${grantedByName} (${orgName})`);

    const devInfo = process.env.NODE_ENV !== 'production' ? { previewUrl: result.previewUrl } : {};
    return res.status(201).json({
      data: { activateUrl, ...devInfo },
      message: `Client access invitation sent to ${clientEmail}.`,
    });
  } catch (err) {
    logger.error(`[auth] Failed to send client invite: ${err.message}`);
    return res.status(500).json({ data: null, message: 'Failed to send client invitation email.' });
  }
};

// ════════════════════════════════════════════════════════════════════════════
// CLIENT ACTIVATE — client sets password and activates their account
// POST /auth/client-activate/:token
// Body: { password }
// ════════════════════════════════════════════════════════════════════════════

exports.clientActivate = (req, res) => {
  const { token } = req.params;
  const { password } = req.body || {};

  const record = clientTokenStore.get(token);
  if (!record) {
    return res.status(400).json({ data: null, message: 'Invalid or expired activation link.' });
  }
  if (isExpired(record.expiresAt)) {
    clientTokenStore.delete(token);
    return res.status(400).json({ data: null, message: 'This access link has expired. Please contact the organisation for a new invitation.' });
  }
  if (!password || password.length < 8) {
    return res.status(400).json({ data: null, message: 'Password must be at least 8 characters.' });
  }

  // In production: create a CLIENT_TEMP user in MongoDB, linked to the TemporaryAccess record.
  clientTokenStore.delete(token);

  const user = {
    id: `client-${Date.now().toString(36)}`,
    email: record.clientEmail,
    role: 'CLIENT_TEMP',
    tenants: [{
      slug: record.tenantSlug,
      name: record.orgName,
      role: 'CLIENT_TEMP',
    }],
    projectIds: record.projectIds,
  };
  const tokens = buildTokens();

  logger.info(`[auth] Client access activated: ${record.clientEmail} for ${record.orgName}`);

  return res.json({
    data: { user, tokens, projectIds: record.projectIds },
    message: 'Access activated. You now have read-only access to the assigned projects.',
  });
};
