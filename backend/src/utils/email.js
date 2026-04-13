
//  * Handles all transactional email for auth flows:
//  *  - Password reset
//  *  - Team invitation (accept-invite)
//  *  - Client temporary access activation
//  *  - Client access expiry warning (24-hour notice)


const nodemailer = require('nodemailer');
const env        = require('../config/env');

// Transporter

let transporter;

const getTransporter = () => {
  if (transporter) return transporter;

  if (env.EMAIL_PROVIDER === 'sendgrid') {
    transporter = nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      auth: {
        user: 'apikey',
        pass: env.SENDGRID_API_KEY,
      },
    });
  } else {
    // Default: SMTP (works with Mailtrap in dev, or any SMTP in prod)
    transporter = nodemailer.createTransport({
      host: env.EMAIL_HOST,
      port: env.EMAIL_PORT,
      secure: env.EMAIL_PORT === 465,
      auth: {
        user: env.EMAIL_USER,
        pass: env.EMAIL_PASSWORD,
      },
    });
  }

  return transporter;
};

// Base send──

/**
 * Send an email.
 * In test environment, logs instead of sending.
 *
 * @param {Object} options - { to, subject, html, text? }
 */
const sendEmail = async ({ to, subject, html, text }) => {
  if (env.isTest) {
    console.log(`[EMAIL TEST] To: ${to} | Subject: ${subject}`);
    return;
  }

  const mailOptions = {
    from:    `"Project 360" <${env.EMAIL_FROM}>`,
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]+>/g, ''), // plain text fallback
  };

  await getTransporter().sendMail(mailOptions);
};

// Auth email templates 


const sendPasswordResetEmail = async (to, resetToken) => {
  const resetUrl = `${env.CLIENT_URL}/reset-password/${resetToken}`;

  await sendEmail({
    to,
    subject: 'Reset your Project 360 password',
    html: `
      <p>You requested a password reset for your Project 360 account.</p>
      <p>Click the link below to set a new password. This link expires in <strong>1 hour</strong>.</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>If you did not request this, you can safely ignore this email.</p>
    `,
  });
};


const sendInviteEmail = async (to, inviteToken, { orgName, invitedByName, role }) => {
  const acceptUrl = `${env.CLIENT_URL}/invite/${inviteToken}`;

  await sendEmail({
    to,
    subject: `You've been invited to ${orgName} on Project 360`,
    html: `
      <p>${invitedByName} has invited you to join <strong>${orgName}</strong> on Project 360 as a <strong>${role}</strong>.</p>
      <p>Click the link below to accept your invitation and create your account. This link expires in <strong>72 hours</strong>.</p>
      <p><a href="${acceptUrl}">${acceptUrl}</a></p>
    `,
  });
};


const sendClientActivationEmail = async (to, activationToken, { orgName, projectNames, expiresAt }) => {
  const activateUrl = `${env.CLIENT_URL}/client-access/${activationToken}`;
  const expiryDate  = new Date(expiresAt).toLocaleDateString('en-ZA', {
    day:   'numeric',
    month: 'long',
    year:  'numeric',
  });

  const projectList = Array.isArray(projectNames) && projectNames.length > 0
    ? `<ul>${projectNames.map((n) => `<li>${n}</li>`).join('')}</ul>`
    : '';

  await sendEmail({
    to,
    subject: `You have been granted project access on Project 360 — ${orgName}`,
    html: `
      <p>You have been given temporary read-only access to the following project(s) in <strong>${orgName}</strong> on Project 360:</p>
      ${projectList}
      <p>Your access expires on <strong>${expiryDate}</strong>.</p>
      <p>Click the link below to activate your account. This activation link expires in <strong>7 days</strong>.</p>
      <p><a href="${activateUrl}">${activateUrl}</a></p>
      <p>After activating, you can log in at <a href="${env.CLIENT_URL}">${env.CLIENT_URL}</a> using this email address.</p>
    `,
  });
};


const sendClientAccessExpiryWarning = async (to, { orgName, projectNames, expiresAt }) => {
  const expiryDate = new Date(expiresAt).toLocaleString('en-ZA', {
    day:    'numeric',
    month:  'long',
    year:   'numeric',
    hour:   '2-digit',
    minute: '2-digit',
  });

  const projectList = Array.isArray(projectNames) && projectNames.length > 0
    ? `<ul>${projectNames.map((n) => `<li>${n}</li>`).join('')}</ul>`
    : '';

  await sendEmail({
    to,
    subject: `Your Project 360 access expires in 24 hours — ${orgName}`,
    html: `
      <p>Your temporary access to the following project(s) in <strong>${orgName}</strong> on Project 360 will expire in <strong>24 hours</strong>:</p>
      ${projectList}
      <p>Access expires: <strong>${expiryDate}</strong></p>
      <p>If you need an extension, please contact the organisation that granted your access.</p>
    `,
  });
};

module.exports = {
  sendEmail,
  sendPasswordResetEmail,
  sendInviteEmail,
  sendClientActivationEmail,
  sendClientAccessExpiryWarning,
};