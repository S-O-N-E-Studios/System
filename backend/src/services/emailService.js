/**
 * Project 360 — Email Service
 * ────────────────────────────
 * Handles all outgoing transactional emails for Project 360.
 *
 * Transport strategy:
 *   • Production  → SMTP (SendGrid, Gmail, or any SMTP provider via env vars)
 *   • Development → Ethereal (https://ethereal.email) — emails are captured and
 *                   viewable via a preview URL logged to the console. No real
 *                   emails are sent.
 *
 * All emails use the Atlas Sahara design system rendered as inline-styled HTML,
 * which is fully compatible with Gmail, Outlook, and Apple Mail.
 */

'use strict';

const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

// ── Atlas Sahara colour palette (hardcoded — CSS vars don't work in email) ──
const C = {
  bgPage:        '#f5efe4',
  bgCard:        '#fdfaf5',
  bgAlt:         '#eee6d6',
  bgDark:        '#e5d8c4',
  accent:        '#c0642c',
  textPrimary:   '#2c2216',
  textSecondary: '#5c4a35',
  textMuted:     '#7a6a55',
  border:        '#ddd0b8',
  divider:       '#e8e0ce',
  success:       '#6a8b66',
  warning:       '#a88d4a',
  danger:        '#9a6a60',
  white:         '#ffffff',
  fontDisplay:   "Georgia, 'Times New Roman', serif",
  fontUI:        "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif",
  fontMono:      "'Courier New', Courier, monospace",
};

// ── HTML building blocks ─────────────────────────────────────────────────────

function btn(text, url, variant = 'primary') {
  const bg    = variant === 'danger' ? C.danger : C.accent;
  const color = C.white;
  return `
<table cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 0;">
  <tr>
    <td align="center" style="background-color:${bg};">
      <a href="${url}" target="_blank"
         style="background-color:${bg};border:2px solid ${bg};color:${color};
                display:inline-block;font-family:${C.fontUI};font-size:12px;
                font-weight:700;letter-spacing:0.14em;line-height:48px;
                text-align:center;text-decoration:none;text-transform:uppercase;
                width:220px;-webkit-text-size-adjust:none;">
        ${text}
      </a>
    </td>
  </tr>
</table>`;
}

function hr() {
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0;">
  <tr><td height="1" style="background-color:${C.divider};font-size:1px;line-height:1px;">&nbsp;</td></tr>
</table>`;
}

function infoRow(label, value) {
  return `<tr>
  <td width="38%" style="padding:8px 12px 8px 0;font-family:${C.fontUI};font-size:12px;color:${C.textMuted};letter-spacing:0.06em;text-transform:uppercase;vertical-align:top;">${label}</td>
  <td style="padding:8px 0;font-family:${C.fontUI};font-size:13px;color:${C.textPrimary};font-weight:600;vertical-align:top;">${value}</td>
</tr>`;
}

function infoTable(rows) {
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0"
          style="margin:20px 0;background-color:${C.bgAlt};border:1px solid ${C.border};">
  <tr><td style="padding:4px 16px;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0">${rows}</table>
  </td></tr>
</table>`;
}

function listItem(text, icon = '&middot;', color = C.textSecondary) {
  return `<tr>
  <td width="20" style="padding:4px 0;font-family:${C.fontUI};font-size:16px;color:${color};vertical-align:top;">${icon}</td>
  <td style="padding:4px 0 4px 8px;font-family:${C.fontUI};font-size:14px;color:${C.textSecondary};line-height:1.5;">${text}</td>
</tr>`;
}

function fallbackUrl(url) {
  return `<p style="margin:20px 0 0;font-family:${C.fontUI};font-size:11px;color:${C.textMuted};line-height:1.6;">
  If the button doesn't work, copy and paste this link into your browser:<br>
  <a href="${url}" style="color:${C.accent};word-break:break-all;">${url}</a>
</p>`;
}

function securityNote(text) {
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0"
          style="margin:28px 0 0;border-left:3px solid ${C.warning};">
  <tr>
    <td style="padding:12px 16px;background-color:${C.bgAlt};">
      <p style="margin:0;font-family:${C.fontUI};font-size:12px;color:${C.textSecondary};line-height:1.5;">
        <strong style="color:${C.warning};">Security note</strong> &mdash; ${text}
      </p>
    </td>
  </tr>
</table>`;
}

function otpBlock(code) {
  return `<table cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">
  <tr>
    <td style="background-color:${C.bgDark};border:1px solid ${C.border};padding:18px 32px;">
      <span style="font-family:${C.fontMono};font-size:32px;font-weight:700;color:${C.textPrimary};letter-spacing:0.35em;">${code}</span>
    </td>
  </tr>
</table>`;
}

// ── Base email layout ────────────────────────────────────────────────────────

function base({ title, preheader, content, baseUrl = 'https://app.project360.co.za' }) {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="format-detection" content="telephone=no,date=no,address=no,email=no">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:${C.bgPage};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">

  <!-- Preheader text (visible in inbox preview, hidden in email body) -->
  <div aria-hidden="true" style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;color:${C.bgPage};">
    ${preheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
         style="background-color:${C.bgPage};">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"
               style="max-width:600px;width:100%;">

          <!-- Logo / wordmark -->
          <tr>
            <td style="padding:0 0 20px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="border-left:3px solid ${C.accent};padding:12px 20px;">
                    <span style="display:block;font-family:${C.fontDisplay};font-size:20px;font-weight:400;color:${C.textPrimary};letter-spacing:0.1em;">PROJECT 360</span>
                    <span style="display:block;margin-top:4px;font-family:${C.fontUI};font-size:9px;color:${C.textMuted};letter-spacing:0.3em;text-transform:uppercase;">Engineering Project Management</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Email card -->
          <tr>
            <td style="background-color:${C.bgCard};border:1px solid ${C.border};">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr><td height="4" style="background-color:${C.accent};font-size:4px;line-height:4px;">&nbsp;</td></tr>
                <tr><td style="padding:40px 40px 36px;">${content}</td></tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:28px 0 0;text-align:center;">
              <p style="margin:0 0 6px;font-family:${C.fontUI};font-size:11px;color:${C.textMuted};letter-spacing:0.04em;">
                Project 360 &middot; SONE Studios &middot; South Africa
              </p>
              <p style="margin:0;font-family:${C.fontUI};font-size:11px;color:${C.textMuted};">
                <a href="${baseUrl}/unsubscribe" target="_blank" style="color:${C.accent};text-decoration:none;">Unsubscribe</a>
                &nbsp;&middot;&nbsp;
                <a href="${baseUrl}/privacy" target="_blank" style="color:${C.accent};text-decoration:none;">Privacy Policy</a>
                &nbsp;&middot;&nbsp;
                <a href="${baseUrl}" target="_blank" style="color:${C.accent};text-decoration:none;">Open App</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ════════════════════════════════════════════════════════════════════════════
// HTML TEMPLATE GENERATORS
// ════════════════════════════════════════════════════════════════════════════

/**
 * Forgot password / password reset email.
 * @param {{ name: string, email: string, resetUrl: string, expiryMinutes?: number }} data
 */
function forgotPasswordHtml({ name, email, resetUrl, expiryMinutes = 60 }) {
  const content = `
    <h1 style="margin:0 0 6px;font-family:${C.fontDisplay};font-size:28px;font-weight:400;color:${C.textPrimary};">
      Reset your password
    </h1>
    <p style="margin:0 0 24px;font-family:${C.fontUI};font-size:13px;color:${C.textMuted};letter-spacing:0.04em;text-transform:uppercase;">
      Password reset request
    </p>
    ${hr()}
    <p style="margin:0 0 16px;font-family:${C.fontUI};font-size:14px;color:${C.textSecondary};line-height:1.6;">
      Hi <strong style="color:${C.textPrimary};">${name}</strong>,
    </p>
    <p style="margin:0 0 16px;font-family:${C.fontUI};font-size:14px;color:${C.textSecondary};line-height:1.6;">
      We received a request to reset the password for your Project 360 account associated with
      <span style="font-family:${C.fontMono};color:${C.accent};">${email}</span>.
    </p>
    <p style="margin:0;font-family:${C.fontUI};font-size:14px;color:${C.textSecondary};line-height:1.6;">
      Click the button below to choose a new password. This link expires in
      <strong style="color:${C.textPrimary};">${expiryMinutes} minutes</strong>.
    </p>
    ${btn('Reset Password', resetUrl)}
    ${fallbackUrl(resetUrl)}
    ${securityNote(`If you did not request a password reset, you can safely ignore this email — your password will not change. This link can only be used once.`)}
    ${hr()}
    <p style="margin:0;font-family:${C.fontUI};font-size:11px;color:${C.textMuted};line-height:1.5;">
      Project 360 will never ask for your password by email or phone.
    </p>
  `;
  return base({
    title: 'Reset your Project 360 password',
    preheader: `Hi ${name}, reset your Project 360 password. This link expires in ${expiryMinutes} minutes.`,
    content,
  });
}

/**
 * Email verification email (sent on registration or resend request).
 * @param {{ name: string, orgName: string, verifyUrl: string, otpCode?: string, expiryHours?: number }} data
 */
function emailVerificationHtml({ name, orgName, verifyUrl, otpCode, expiryHours = 24 }) {
  const content = `
    <h1 style="margin:0 0 6px;font-family:${C.fontDisplay};font-size:28px;font-weight:400;color:${C.textPrimary};">
      Verify your email
    </h1>
    <p style="margin:0 0 24px;font-family:${C.fontUI};font-size:13px;color:${C.textMuted};letter-spacing:0.04em;text-transform:uppercase;">
      Welcome to Project 360
    </p>
    ${hr()}
    <p style="margin:0 0 16px;font-family:${C.fontUI};font-size:14px;color:${C.textSecondary};line-height:1.6;">
      Hi <strong style="color:${C.textPrimary};">${name}</strong>,
    </p>
    <p style="margin:0 0 16px;font-family:${C.fontUI};font-size:14px;color:${C.textSecondary};line-height:1.6;">
      Thank you for registering <strong style="color:${C.textPrimary};">${orgName}</strong> on Project 360.
      Before you start managing your projects, please verify your email address.
    </p>
    ${btn('Verify Email Address', verifyUrl)}
    ${otpCode ? `
      ${hr()}
      <p style="margin:0 0 8px;font-family:${C.fontUI};font-size:13px;color:${C.textMuted};letter-spacing:0.04em;text-transform:uppercase;">Or use this one-time code</p>
      ${otpBlock(otpCode)}
      <p style="margin:0;font-family:${C.fontUI};font-size:12px;color:${C.textMuted};">
        Enter this code on the verification screen. Expires in ${expiryHours} hours.
      </p>
    ` : fallbackUrl(verifyUrl)}
    ${hr()}
    <p style="margin:0;font-family:${C.fontUI};font-size:11px;color:${C.textMuted};line-height:1.5;">
      If you did not create a Project 360 account, you can safely ignore this email.
    </p>
  `;
  return base({
    title: 'Verify your email — Project 360',
    preheader: `Welcome to Project 360! Please verify your email address to activate your ${orgName} account.`,
    content,
  });
}

/**
 * Team member / user invite email.
 * @param {{ recipientName?: string, invitedByName: string, invitedByEmail: string, orgName: string, role: string, acceptUrl: string, expiryHours?: number, message?: string }} data
 */
function userInviteHtml({
  recipientName,
  invitedByName,
  invitedByEmail,
  orgName,
  role,
  acceptUrl,
  expiryHours = 72,
  message,
}) {
  const greeting = recipientName
    ? `Hi <strong style="color:${C.textPrimary};">${recipientName}</strong>,`
    : 'Hi,';

  const content = `
    <h1 style="margin:0 0 6px;font-family:${C.fontDisplay};font-size:28px;font-weight:400;color:${C.textPrimary};">
      You've been invited
    </h1>
    <p style="margin:0 0 24px;font-family:${C.fontUI};font-size:13px;color:${C.textMuted};letter-spacing:0.04em;text-transform:uppercase;">
      Team invitation &middot; Project 360
    </p>
    ${hr()}
    <p style="margin:0 0 16px;font-family:${C.fontUI};font-size:14px;color:${C.textSecondary};line-height:1.6;">${greeting}</p>
    <p style="margin:0 0 16px;font-family:${C.fontUI};font-size:14px;color:${C.textSecondary};line-height:1.6;">
      <strong style="color:${C.textPrimary};">${invitedByName}</strong>
      (<span style="font-family:${C.fontMono};font-size:13px;color:${C.accent};">${invitedByEmail}</span>)
      has invited you to join <strong style="color:${C.textPrimary};">${orgName}</strong>
      on Project 360 as a <strong style="color:${C.textPrimary};">${role}</strong>.
    </p>
    ${message ? `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;border-left:3px solid ${C.accent};">
      <tr><td style="padding:12px 16px;background-color:${C.bgAlt};">
        <p style="margin:0 0 4px;font-family:${C.fontUI};font-size:11px;color:${C.textMuted};letter-spacing:0.08em;text-transform:uppercase;">Message from ${invitedByName}</p>
        <p style="margin:0;font-family:${C.fontUI};font-size:14px;color:${C.textSecondary};font-style:italic;line-height:1.6;">"${message}"</p>
      </td></tr>
    </table>
    ` : ''}
    ${infoTable(
      infoRow('Organisation', orgName) +
      infoRow('Your role', role) +
      infoRow('Invited by', invitedByName) +
      infoRow('Expires in', `${expiryHours} hours`)
    )}
    ${btn('Accept Invitation', acceptUrl)}
    ${fallbackUrl(acceptUrl)}
    ${securityNote(`This invitation expires in ${expiryHours} hours. If you were not expecting this, you can safely ignore this email.`)}
  `;
  return base({
    title: `Invitation — ${orgName} · Project 360`,
    preheader: `${invitedByName} has invited you to join ${orgName} as a ${role} on Project 360.`,
    content,
  });
}

/**
 * Client temporary access invite email.
 * @param {{ grantedByName: string, orgName: string, projectNames: string[], expiresAt: string, activateUrl: string, includeFinancials?: boolean }} data
 */
function clientInviteHtml({
  grantedByName,
  orgName,
  projectNames,
  expiresAt,
  activateUrl,
  includeFinancials = false,
}) {
  const projectList = projectNames
    .map((p) => listItem(`<strong style="color:${C.textPrimary};">${p}</strong>`, '&#9658;', C.accent))
    .join('');

  const content = `
    <h1 style="margin:0 0 6px;font-family:${C.fontDisplay};font-size:28px;font-weight:400;color:${C.textPrimary};">
      Temporary project access
    </h1>
    <p style="margin:0 0 24px;font-family:${C.fontUI};font-size:13px;color:${C.textMuted};letter-spacing:0.04em;text-transform:uppercase;">
      Client access &middot; Read-only
    </p>
    ${hr()}
    <p style="margin:0 0 16px;font-family:${C.fontUI};font-size:14px;color:${C.textSecondary};line-height:1.6;">
      <strong style="color:${C.textPrimary};">${grantedByName}</strong> at
      <strong style="color:${C.textPrimary};">${orgName}</strong>
      has granted you temporary read-only access to the following project${projectNames.length !== 1 ? 's' : ''} on Project 360:
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;width:100%;">
      ${projectList}
    </table>
    ${infoTable(
      infoRow('Organisation', orgName) +
      infoRow('Access type', 'Read-only (client)') +
      infoRow('Granted by', grantedByName) +
      infoRow('Expires', expiresAt)
    )}
    ${btn('Activate Access', activateUrl)}
    ${fallbackUrl(activateUrl)}
    ${hr()}
    <p style="margin:0 0 12px;font-family:${C.fontUI};font-size:12px;color:${C.textMuted};letter-spacing:0.08em;text-transform:uppercase;">What you can access</p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px;width:100%;">
      ${listItem('Project overview and current status', '&#10003;', C.success)}
      ${listItem('Activity schedule (read-only)', '&#10003;', C.success)}
      ${listItem('Stage progress timeline', '&#10003;', C.success)}
      ${listItem('Files explicitly shared with clients', '&#10003;', C.success)}
      ${includeFinancials ? listItem('Financial summary (shared by request)', '&#10003;', C.success) : ''}
    </table>
    <p style="margin:0 0 12px;font-family:${C.fontUI};font-size:12px;color:${C.textMuted};letter-spacing:0.08em;text-transform:uppercase;">What is restricted</p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;width:100%;">
      ${!includeFinancials ? listItem('Financial details and contract values', '&#10007;', C.danger) : ''}
      ${listItem('Internal team notes', '&#10007;', C.danger)}
      ${listItem('Other team members&rsquo; contact information', '&#10007;', C.danger)}
    </table>
    ${securityNote(`Your access automatically expires on <strong>${expiresAt}</strong>. You will receive a reminder 24 hours before expiry. Access can be revoked at any time by ${orgName}.`)}
  `;
  return base({
    title: `Client Access — ${orgName} · Project 360`,
    preheader: `${grantedByName} at ${orgName} has granted you read-only access to ${projectNames.length} project${projectNames.length !== 1 ? 's' : ''}. Expires ${expiresAt}.`,
    content,
  });
}

/**
 * System / event notification email.
 * @param {{ recipientName: string, eventType: string, headline: string, bodyText: string, projectName?: string, projectUrl?: string, eventDate?: string, ctaLabel?: string, ctaUrl?: string, extraDetails?: Array<{label:string, value:string}> }} data
 */
function notificationHtml({
  recipientName,
  eventType = 'generic',
  headline,
  bodyText,
  projectName,
  projectUrl,
  eventDate,
  ctaLabel = 'View in Project 360',
  ctaUrl,
  extraDetails = [],
}) {
  const EVENT_META = {
    stage_advanced:   { label: 'Stage Advanced',         color: C.success  },
    payment_received: { label: 'Payment Received',       color: C.success  },
    activity_overdue: { label: 'Activity Overdue',       color: C.danger   },
    access_expiring:  { label: 'Access Expiring Soon',   color: C.warning  },
    grant_compliance: { label: 'Grant Compliance Alert', color: C.warning  },
    project_complete: { label: 'Project Complete',       color: C.success  },
    invite_accepted:  { label: 'Invitation Accepted',    color: C.success  },
    generic:          { label: 'Notification',           color: C.accent   },
  };
  const meta = EVENT_META[eventType] || EVENT_META.generic;

  const detailRows = [
    projectName ? infoRow('Project', projectName) : '',
    eventDate   ? infoRow('Date', eventDate)       : '',
    ...extraDetails.map((d) => infoRow(d.label, d.value)),
  ].join('');

  const content = `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;">
      <tr>
        <td style="background-color:${meta.color};padding:5px 14px;">
          <span style="font-family:${C.fontUI};font-size:11px;font-weight:700;color:${C.white};letter-spacing:0.14em;text-transform:uppercase;">
            ${meta.label}
          </span>
        </td>
      </tr>
    </table>
    <h1 style="margin:0 0 20px;font-family:${C.fontDisplay};font-size:26px;font-weight:400;color:${C.textPrimary};line-height:1.3;">
      ${headline}
    </h1>
    <p style="margin:0 0 16px;font-family:${C.fontUI};font-size:14px;color:${C.textSecondary};line-height:1.6;">
      Hi <strong style="color:${C.textPrimary};">${recipientName}</strong>,
    </p>
    <p style="margin:0;font-family:${C.fontUI};font-size:14px;color:${C.textSecondary};line-height:1.6;">${bodyText}</p>
    ${detailRows ? infoTable(detailRows) : ''}
    ${ctaUrl ? btn(ctaLabel, ctaUrl) : ''}
    ${hr()}
    <p style="margin:0;font-family:${C.fontUI};font-size:11px;color:${C.textMuted};line-height:1.5;">
      You are receiving this because you are a member of this project or organisation.
      ${projectUrl ? `<a href="${projectUrl}" style="color:${C.accent};text-decoration:none;">View project &rarr;</a>` : ''}
    </p>
  `;

  const subject = projectName
    ? `[${meta.label}] ${headline} — ${projectName}`
    : `[${meta.label}] ${headline} — Project 360`;

  return { subject, html: base({ title: subject, preheader: `${headline}${projectName ? ` · ${projectName}` : ''} — Project 360`, content }) };
}

// ════════════════════════════════════════════════════════════════════════════
// NODEMAILER TRANSPORT
// ════════════════════════════════════════════════════════════════════════════

let _transporter = null;

/**
 * Lazily initialises and returns the Nodemailer transporter.
 * In development, falls back to Ethereal (https://ethereal.email).
 */
async function getTransporter() {
  if (_transporter) return _transporter;

  const isProduction = process.env.NODE_ENV === 'production';
  const hasSmtp = process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASSWORD;

  if (isProduction || hasSmtp) {
    // ── Production / configured SMTP ──────────────────────────────────────
    _transporter = nodemailer.createTransport({
      host:   process.env.EMAIL_HOST   || 'smtp.sendgrid.net',
      port:   Number(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_SECURE === 'true', // true = 465 (TLS), false = STARTTLS
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      // SendGrid-specific: use API key as password with 'apikey' as user
    });
    logger.info('[email] Using configured SMTP transport');
  } else {
    // ── Development: Ethereal test account ───────────────────────────────
    const testAccount = await nodemailer.createTestAccount();
    _transporter = nodemailer.createTransport({
      host:   'smtp.ethereal.email',
      port:   587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    logger.info('[email] Using Ethereal test transport (no real emails sent)');
    logger.info(`[email] Ethereal login: ${testAccount.web} — user: ${testAccount.user}`);
  }

  return _transporter;
}

/**
 * Core send function. All public helpers funnel through here.
 * @param {{ to: string|string[], subject: string, html: string, from?: string, replyTo?: string }} options
 * @returns {Promise<{ messageId: string, previewUrl?: string }>}
 */
async function sendEmail({ to, subject, html, from, replyTo }) {
  const transporter = await getTransporter();

  const fromAddress = from
    || process.env.EMAIL_FROM
    || `"Project 360" <noreply@project360.co.za>`;

  const info = await transporter.sendMail({
    from: fromAddress,
    to,
    replyTo,
    subject,
    html,
    // Plain-text fallback (strip HTML tags for a basic version)
    text: html.replace(/<[^>]+>/g, ' ').replace(/\s{2,}/g, ' ').trim(),
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);

  if (previewUrl) {
    logger.info(`[email] Preview URL: ${previewUrl}`);
  }

  logger.info(`[email] Sent "${subject}" to ${Array.isArray(to) ? to.join(', ') : to} — messageId: ${info.messageId}`);

  return { messageId: info.messageId, previewUrl: previewUrl || undefined };
}

// ════════════════════════════════════════════════════════════════════════════
// PUBLIC SEND FUNCTIONS
// ════════════════════════════════════════════════════════════════════════════

/**
 * Send a password reset email.
 * @param {string} to
 * @param {{ name: string, email: string, resetUrl: string, expiryMinutes?: number }} data
 */
async function sendForgotPassword(to, data) {
  const html = forgotPasswordHtml(data);
  return sendEmail({ to, subject: 'Reset your Project 360 password', html });
}

/**
 * Send an email verification email.
 * @param {string} to
 * @param {{ name: string, orgName: string, verifyUrl: string, otpCode?: string, expiryHours?: number }} data
 */
async function sendEmailVerification(to, data) {
  const html = emailVerificationHtml(data);
  return sendEmail({ to, subject: 'Verify your email address — Project 360', html });
}

/**
 * Send a team member / user invitation email.
 * @param {string} to
 * @param {{ recipientName?: string, invitedByName: string, invitedByEmail: string, orgName: string, role: string, acceptUrl: string, expiryHours?: number, message?: string }} data
 */
async function sendUserInvite(to, data) {
  const html = userInviteHtml(data);
  return sendEmail({ to, subject: `You've been invited to join ${data.orgName} on Project 360`, html });
}

/**
 * Send a client temporary access activation email.
 * @param {string} to
 * @param {{ grantedByName: string, orgName: string, projectNames: string[], expiresAt: string, activateUrl: string, includeFinancials?: boolean }} data
 */
async function sendClientInvite(to, data) {
  const html = clientInviteHtml(data);
  return sendEmail({ to, subject: `Temporary project access — ${data.orgName} via Project 360`, html });
}

/**
 * Send a system/event notification email.
 * @param {string|string[]} to
 * @param {{ recipientName: string, eventType: string, headline: string, bodyText: string, projectName?: string, projectUrl?: string, eventDate?: string, ctaLabel?: string, ctaUrl?: string, extraDetails?: Array<{label:string,value:string}> }} data
 */
async function sendNotification(to, data) {
  const { subject, html } = notificationHtml(data);
  return sendEmail({ to, subject, html });
}

/**
 * Send a 24-hour access expiry reminder to a client temp user.
 * @param {string} to
 * @param {{ clientEmail: string, orgName: string, projectNames: string[], expiresAt: string, loginUrl: string }} data
 */
async function sendAccessExpiryReminder(to, data) {
  return sendNotification(to, {
    recipientName: data.clientEmail,
    eventType: 'access_expiring',
    headline: 'Your project access expires in 24 hours',
    bodyText: `Your temporary read-only access to <strong>${data.orgName}</strong> project${data.projectNames.length !== 1 ? 's' : ''} will expire on <strong>${data.expiresAt}</strong>. After expiry, you will be logged out automatically.`,
    projectName: data.projectNames.join(', '),
    ctaLabel: 'View Projects',
    ctaUrl: data.loginUrl,
    eventDate: data.expiresAt,
  });
}

module.exports = {
  sendForgotPassword,
  sendEmailVerification,
  sendUserInvite,
  sendClientInvite,
  sendNotification,
  sendAccessExpiryReminder,
  // Expose raw send for custom use
  sendEmail,
};
