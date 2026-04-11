/**
 * Project 360 — Notification Service
 * ─────────────────────────────────────
 * A thin event-dispatch layer that any controller can call to trigger
 * email notifications. It decouples controllers from the email service
 * and gives one place to add future channels (push, in-app, SMS, etc.).
 *
 * Usage in a controller:
 *   const notify = require('../services/notificationService');
 *   await notify.stageAdvanced({ recipientEmail, recipientName, projectName, stage, advancedBy, projectUrl });
 */

'use strict';

const emailService = require('./emailService');
const logger = require('../utils/logger');

const APP_URL = process.env.APP_URL || 'https://app.project360.co.za';

/**
 * Internal dispatcher — wraps email send in a try/catch so a notification
 * failure never crashes the request that triggered it.
 */
async function dispatch(fn, context) {
  try {
    await fn();
  } catch (err) {
    logger.error(`[notify] Failed to send "${context}" notification: ${err.message}`);
    // Intentionally not re-throwing — notifications are best-effort.
  }
}

// ════════════════════════════════════════════════════════════════════════════
// NOTIFICATION EVENTS
// ════════════════════════════════════════════════════════════════════════════

/**
 * Notify a user that a project stage has been advanced.
 * @param {{ recipientEmail: string, recipientName: string, projectName: string, projectId: string, tenantSlug: string, stage: number, stageName: string, advancedBy: string }} params
 */
async function stageAdvanced({ recipientEmail, recipientName, projectName, projectId, tenantSlug, stage, stageName, advancedBy }) {
  await dispatch(async () => {
    await emailService.sendNotification(recipientEmail, {
      recipientName,
      eventType: 'stage_advanced',
      headline:  `Stage ${stage} — ${stageName} complete`,
      bodyText:  `All required documents for Stage ${stage} have been uploaded and accepted. The project has advanced to Stage ${stage + 1}. Please review any outstanding requirements for the next stage.`,
      projectName,
      projectUrl: `${APP_URL}/${tenantSlug}/projects/${projectId}`,
      ctaLabel:   'View Project',
      ctaUrl:     `${APP_URL}/${tenantSlug}/projects/${projectId}`,
      extraDetails: [{ label: 'Advanced by', value: advancedBy }],
    });
  }, 'stageAdvanced');
}

/**
 * Notify a user that a payment certificate has been recorded.
 * @param {{ recipientEmail: string, recipientName: string, projectName: string, projectId: string, tenantSlug: string, amount: string, certificateNo: string }} params
 */
async function paymentReceived({ recipientEmail, recipientName, projectName, projectId, tenantSlug, amount, certificateNo }) {
  await dispatch(async () => {
    await emailService.sendNotification(recipientEmail, {
      recipientName,
      eventType: 'payment_received',
      headline:  `Payment certificate recorded`,
      bodyText:  `A payment certificate has been added to <strong>${projectName}</strong>. Please review and confirm the payment details.`,
      projectName,
      projectUrl: `${APP_URL}/${tenantSlug}/projects/${projectId}`,
      ctaLabel:   'View Payment',
      ctaUrl:     `${APP_URL}/${tenantSlug}/projects/${projectId}?tab=construction`,
      extraDetails: [
        { label: 'Certificate no.', value: certificateNo },
        { label: 'Amount',          value: amount },
      ],
    });
  }, 'paymentReceived');
}

/**
 * Notify a project manager that a Gantt activity is overdue.
 * @param {{ recipientEmail: string, recipientName: string, projectName: string, projectId: string, tenantSlug: string, activityName: string, daysOverdue: number }} params
 */
async function activityOverdue({ recipientEmail, recipientName, projectName, projectId, tenantSlug, activityName, daysOverdue }) {
  await dispatch(async () => {
    await emailService.sendNotification(recipientEmail, {
      recipientName,
      eventType: 'activity_overdue',
      headline:  `Activity overdue by ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''}`,
      bodyText:  `The activity <strong>${activityName}</strong> on <strong>${projectName}</strong> is ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} past its scheduled end date. Please update the activity status or adjust the schedule.`,
      projectName,
      projectUrl: `${APP_URL}/${tenantSlug}/projects/${projectId}?tab=gantt`,
      ctaLabel:   'View Activity Schedule',
      ctaUrl:     `${APP_URL}/${tenantSlug}/projects/${projectId}?tab=gantt`,
      extraDetails: [{ label: 'Activity', value: activityName }],
    });
  }, 'activityOverdue');
}

/**
 * Notify a client temp user that their access expires in 24 hours.
 * @param {{ clientEmail: string, orgName: string, projectNames: string[], expiresAt: string, tenantSlug: string }} params
 */
async function accessExpiringSoon({ clientEmail, orgName, projectNames, expiresAt, tenantSlug }) {
  await dispatch(async () => {
    await emailService.sendAccessExpiryReminder(clientEmail, {
      clientEmail,
      orgName,
      projectNames,
      expiresAt,
      loginUrl: `${APP_URL}/${tenantSlug}/projects`,
    });
  }, 'accessExpiringSoon');
}

/**
 * Notify relevant users when a grant compliance deadline is approaching.
 * @param {{ recipientEmail: string, recipientName: string, grantName: string, tenantSlug: string, daysUntilDeadline: number, deadlineDate: string }} params
 */
async function grantComplianceAlert({ recipientEmail, recipientName, grantName, tenantSlug, daysUntilDeadline, deadlineDate }) {
  await dispatch(async () => {
    await emailService.sendNotification(recipientEmail, {
      recipientName,
      eventType: 'grant_compliance',
      headline:  `Grant compliance deadline in ${daysUntilDeadline} day${daysUntilDeadline !== 1 ? 's' : ''}`,
      bodyText:  `The compliance reporting deadline for <strong>${grantName}</strong> is approaching. Please ensure all required reports have been submitted before the deadline.`,
      ctaLabel:  'View Grants',
      ctaUrl:    `${APP_URL}/${tenantSlug}/grants`,
      extraDetails: [
        { label: 'Grant',    value: grantName },
        { label: 'Deadline', value: deadlineDate },
      ],
    });
  }, 'grantComplianceAlert');
}

/**
 * Notify the org admin and project manager when a project is marked complete.
 * @param {{ recipientEmail: string, recipientName: string, projectName: string, projectId: string, tenantSlug: string, completedBy: string }} params
 */
async function projectComplete({ recipientEmail, recipientName, projectName, projectId, tenantSlug, completedBy }) {
  await dispatch(async () => {
    await emailService.sendNotification(recipientEmail, {
      recipientName,
      eventType: 'project_complete',
      headline:  `Project complete — ${projectName}`,
      bodyText:  `<strong>${projectName}</strong> has been marked as complete after passing all stage gates including the Stage 6 close-out. All required documents and proof of payment have been submitted.`,
      projectName,
      projectUrl: `${APP_URL}/${tenantSlug}/projects/${projectId}`,
      ctaLabel:   'View Project',
      ctaUrl:     `${APP_URL}/${tenantSlug}/projects/${projectId}`,
      extraDetails: [{ label: 'Completed by', value: completedBy }],
    });
  }, 'projectComplete');
}

/**
 * Notify the inviting user that their invitation was accepted.
 * @param {{ recipientEmail: string, recipientName: string, inviteeName: string, inviteeEmail: string, orgName: string, role: string, tenantSlug: string }} params
 */
async function inviteAccepted({ recipientEmail, recipientName, inviteeName, inviteeEmail, orgName, role, tenantSlug }) {
  await dispatch(async () => {
    await emailService.sendNotification(recipientEmail, {
      recipientName,
      eventType: 'invite_accepted',
      headline:  `${inviteeName} has joined ${orgName}`,
      bodyText:  `<strong>${inviteeName}</strong> accepted your invitation and has joined <strong>${orgName}</strong> as a <strong>${role}</strong>.`,
      ctaLabel:  'View Team',
      ctaUrl:    `${APP_URL}/${tenantSlug}/settings?tab=Users`,
      extraDetails: [
        { label: 'New member', value: inviteeName },
        { label: 'Email',      value: inviteeEmail },
        { label: 'Role',       value: role },
      ],
    });
  }, 'inviteAccepted');
}

module.exports = {
  stageAdvanced,
  paymentReceived,
  activityOverdue,
  accessExpiringSoon,
  grantComplianceAlert,
  projectComplete,
  inviteAccepted,
};
