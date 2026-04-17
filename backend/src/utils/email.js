//  * Transactional email for auth flows:
//  *  - Password reset (uses member org SMTP when configured, else platform)
//  *  - Team invitation (always tenant-scoped → org SMTP when enabled)
//  *  - Client temporary access activation / expiry notices
//  *
//  * Platform delivery: SMTP (your own relay) or legacy SendGrid env.
//  * Per-organisation: Tenant.outboundEmail — your mail server, no third-party API required.

const nodemailer = require('nodemailer');
const env = require('../config/env');
const { decryptTenantSmtpPassword } = require('./tenantSmtpCrypto');

/** Singleton transporter for platform-level email (no tenant context). */
let platformTransporter;

const createPlatformTransport = () => {
  if (env.EMAIL_PROVIDER === 'sendgrid' && env.SENDGRID_API_KEY) {
    return nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      auth: { user: 'apikey', pass: env.SENDGRID_API_KEY },
    });
  }
  return nodemailer.createTransport({
    host: env.EMAIL_HOST,
    port: env.EMAIL_PORT,
    secure: env.EMAIL_PORT === 465,
    auth:
      env.EMAIL_USER || env.EMAIL_PASSWORD
        ? { user: env.EMAIL_USER || '', pass: env.EMAIL_PASSWORD || '' }
        : undefined,
  });
};

const getPlatformTransporter = () => {
  if (platformTransporter) return platformTransporter;
  platformTransporter = createPlatformTransport();
  return platformTransporter;
};

/**
 * Build a transporter + From header from tenant.outboundEmail when enabled.
 * Returns null if tenant mail is not usable (falls back to platform).
 */
const resolveTenantOutbound = (tenant) => {
  const oe = tenant && tenant.outboundEmail;
  if (!oe || !oe.enabled || !oe.host || !oe.fromAddress) return null;

  const pass = decryptTenantSmtpPassword(oe.authPassEncrypted);
  const needsAuth = Boolean(oe.authUser) || Boolean(pass);
  if (needsAuth && !oe.authUser) return null;

  const transport = nodemailer.createTransport({
    host: oe.host,
    port: oe.port || 587,
    secure: Boolean(oe.secure),
    auth: oe.authUser ? { user: oe.authUser, pass: pass || '' } : undefined,
  });

  const name = (oe.fromName && String(oe.fromName).trim()) || tenant.name || 'EVIDENTIARY';
  const from = `"${name.replace(/"/g, '')}" <${oe.fromAddress}>`;
  const replyTo = oe.replyTo || undefined;

  return { transport, from, replyTo };
};

const resolveMailer = (tenant) => {
  const tenantMail = tenant ? resolveTenantOutbound(tenant) : null;
  if (tenantMail) {
    return {
      transport: tenantMail.transport,
      from: tenantMail.from,
      replyTo: tenantMail.replyTo,
    };
  }
  return {
    transport: getPlatformTransporter(),
    from: `"EVIDENTIARY" <${env.EMAIL_FROM}>`,
    replyTo: undefined,
  };
};

/**
 * Send an email. Pass `tenant` when the message is on behalf of an organisation
 * that configured outboundEmail (in-house SMTP).
 */
const sendEmail = async ({ to, subject, html, text, tenant }) => {
  if (env.isTest) {
    // eslint-disable-next-line no-console
    console.log(`[EMAIL TEST] To: ${to} | Subject: ${subject}`);
    return;
  }

  const { transport, from, replyTo } = resolveMailer(tenant);

  const mailOptions = {
    from,
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]+>/g, ''),
    ...(replyTo ? { replyTo } : {}),
  };

  try {
    await transport.sendMail(mailOptions);
  } catch (err) {
    // If the organisation relay fails, retry once on the platform mailer so users are not stuck.
    if (tenant) {
      const fallback = resolveMailer(null);
      await fallback.transport.sendMail({
        ...mailOptions,
        from: fallback.from,
        replyTo: undefined,
      });
      return;
    }
    throw err;
  }
};

const sendPasswordResetEmail = async (to, resetToken, { tenant } = {}) => {
  const resetUrl = `${env.CLIENT_URL}/reset-password/${resetToken}`;

  await sendEmail({
    to,
    subject: 'Reset your EVIDENTIARY password',
    html: `
      <p>You requested a password reset for your EVIDENTIARY account.</p>
      <p>Click the link below to set a new password. This link expires in <strong>1 hour</strong>.</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>If you did not request this, you can safely ignore this email.</p>
    `,
    tenant,
  });
};

const sendInviteEmail = async (to, inviteToken, { orgName, invitedByName, role }, tenant) => {
  const acceptUrl = `${env.CLIENT_URL}/invite/${inviteToken}`;

  await sendEmail({
    to,
    subject: `You've been invited to ${orgName} on EVIDENTIARY`,
    html: `
      <p>${invitedByName} has invited you to join <strong>${orgName}</strong> on EVIDENTIARY as a <strong>${role}</strong>.</p>
      <p>Click the link below to accept your invitation and create your account. This link expires in <strong>72 hours</strong>.</p>
      <p><a href="${acceptUrl}">${acceptUrl}</a></p>
    `,
    tenant,
  });
};

const sendClientActivationEmail = async (to, activationToken, { orgName, projectNames, expiresAt }, tenant) => {
  const activateUrl = `${env.CLIENT_URL}/client-access/${activationToken}`;
  const expiryDate = new Date(expiresAt).toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const projectList = Array.isArray(projectNames) && projectNames.length > 0
    ? `<ul>${projectNames.map((n) => `<li>${n}</li>`).join('')}</ul>`
    : '';

  await sendEmail({
    to,
    subject: `You have been granted project access on EVIDENTIARY — ${orgName}`,
    html: `
      <p>You have been given temporary read-only access to the following project(s) in <strong>${orgName}</strong> on EVIDENTIARY:</p>
      ${projectList}
      <p>Your access expires on <strong>${expiryDate}</strong>.</p>
      <p>Click the link below to activate your account. This activation link expires in <strong>7 days</strong>.</p>
      <p><a href="${activateUrl}">${activateUrl}</a></p>
      <p>After activating, you can log in at <a href="${env.CLIENT_URL}">${env.CLIENT_URL}</a> using this email address.</p>
    `,
    tenant,
  });
};

const sendClientAccessExpiryWarning = async (to, { orgName, projectNames, expiresAt }, tenant) => {
  const expiryDate = new Date(expiresAt).toLocaleString('en-ZA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const projectList = Array.isArray(projectNames) && projectNames.length > 0
    ? `<ul>${projectNames.map((n) => `<li>${n}</li>`).join('')}</ul>`
    : '';

  await sendEmail({
    to,
    subject: `Your EVIDENTIARY access expires in 24 hours — ${orgName}`,
    html: `
      <p>Your temporary access to the following project(s) in <strong>${orgName}</strong> on EVIDENTIARY will expire in <strong>24 hours</strong>:</p>
      ${projectList}
      <p>Access expires: <strong>${expiryDate}</strong></p>
      <p>If you need an extension, please contact the organisation that granted your access.</p>
    `,
    tenant,
  });
};

module.exports = {
  sendEmail,
  sendPasswordResetEmail,
  sendInviteEmail,
  sendClientActivationEmail,
  sendClientAccessExpiryWarning,
};
