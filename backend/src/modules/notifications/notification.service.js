const CalendarEvent = require('../calendar/calendarEvent.model');
const StageApproval = require('../stage-gate/stageApproval.model');
const userRepo = require('../users/user.repository');

const DEFAULT_PREFS = {
  projectUpdates: true,
  taskAssignments: true,
  reportSubmissions: true,
  deadlineReminders: true,
  teamInvitations: true,
};

const serializePrefs = (pref) => ({
  projectUpdates: pref?.projectUpdates ?? DEFAULT_PREFS.projectUpdates,
  taskAssignments: pref?.taskAssignments ?? DEFAULT_PREFS.taskAssignments,
  reportSubmissions: pref?.reportSubmissions ?? DEFAULT_PREFS.reportSubmissions,
  deadlineReminders: pref?.deadlineReminders ?? DEFAULT_PREFS.deadlineReminders,
  teamInvitations: pref?.teamInvitations ?? DEFAULT_PREFS.teamInvitations,
});

const getOrCreateTenantPrefs = (user, tenantId) => {
  let created = false;
  let pref = user.notificationPreferences.find(
    (entry) => entry.tenantId.toString() === tenantId.toString()
  );
  if (!pref) {
    pref = { tenantId, ...DEFAULT_PREFS };
    user.notificationPreferences.push(pref);
    created = true;
  }
  return { pref, created };
};

const getTenantReadMap = (user, tenantId) =>
  new Set(
    (user.notificationReads || [])
      .filter((entry) => entry.tenantId.toString() === tenantId.toString())
      .map((entry) => entry.notificationKey)
  );

const toRelativeDate = (value) => {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(1, Math.round(diffMs / 60000));
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}d ago`;
};

const mapEventToCategory = (eventType) => {
  if (['document_approved', 'document_rejected', 'stage_advanced', 'variation_approved'].includes(eventType)) {
    return 'projectUpdates';
  }
  if (['deadline', 'report_due', 'milestone', 'meeting', 'site_visit'].includes(eventType)) {
    return 'deadlineReminders';
  }
  if (eventType === 'payment') return 'reportSubmissions';
  return 'projectUpdates';
};

const listNotifications = async (tenant, userId) => {
  const user = await userRepo.findById(userId);
  if (!user) throw Object.assign(new Error('User not found'), { status: 404 });

  const { pref: prefs, created } = getOrCreateTenantPrefs(user, tenant._id);
  const readKeys = getTenantReadMap(user, tenant._id);

  const [events, pendingApprovals] = await Promise.all([
    CalendarEvent.find({ tenantId: tenant._id })
      .sort({ date: -1, createdAt: -1 })
      .limit(20)
      .lean(),
    StageApproval.find({ tenantId: tenant._id, approvalStatus: 'pending' })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean(),
  ]);

  const notifications = [
    ...events
      .filter((event) => prefs[mapEventToCategory(event.eventType)] !== false)
      .map((event) => ({
        id: `calendar:${event._id}`,
        title: event.title,
        body: event.notes || `Event type: ${event.eventType.replace(/_/g, ' ')}`,
        date: toRelativeDate(event.date || event.createdAt),
        createdAt: event.date || event.createdAt,
        read: readKeys.has(`calendar:${event._id}`),
        type: event.eventType,
      })),
    ...(prefs.projectUpdates
      ? pendingApprovals.map((approval) => ({
          id: `stage-approval:${approval._id}`,
          title: 'Stage approval pending',
          body: `${approval.documentCategory} is waiting for client review.`,
          date: toRelativeDate(approval.createdAt),
          createdAt: approval.createdAt,
          read: readKeys.has(`stage-approval:${approval._id}`),
          type: 'stage_approval_pending',
        }))
      : []),
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 25);

  // Persist default prefs if this is the first time.
  if (created) {
    await userRepo.save(user);
  }

  return { notifications, preferences: serializePrefs(prefs) };
};

const updatePreferences = async (tenant, userId, updates) => {
  const user = await userRepo.findById(userId);
  if (!user) throw Object.assign(new Error('User not found'), { status: 404 });
  const { pref: prefs } = getOrCreateTenantPrefs(user, tenant._id);
  for (const key of Object.keys(DEFAULT_PREFS)) {
    if (updates[key] !== undefined) prefs[key] = Boolean(updates[key]);
  }
  await userRepo.save(user);
  return serializePrefs(prefs);
};

const markRead = async (tenant, userId, notificationKey) => {
  const user = await userRepo.findById(userId);
  if (!user) throw Object.assign(new Error('User not found'), { status: 404 });
  const exists = user.notificationReads.some(
    (entry) =>
      entry.tenantId.toString() === tenant._id.toString() &&
      entry.notificationKey === notificationKey
  );
  if (!exists) {
    user.notificationReads.push({
      tenantId: tenant._id,
      notificationKey,
      readAt: new Date(),
    });
    await userRepo.save(user);
  }
  return { id: notificationKey, read: true };
};

const markAllRead = async (tenant, userId) => {
  const { notifications } = await listNotifications(tenant, userId);
  const user = await userRepo.findById(userId);
  if (!user) throw Object.assign(new Error('User not found'), { status: 404 });
  const existing = getTenantReadMap(user, tenant._id);
  notifications.forEach((notification) => {
    if (!existing.has(notification.id)) {
      user.notificationReads.push({
        tenantId: tenant._id,
        notificationKey: notification.id,
        readAt: new Date(),
      });
    }
  });
  await userRepo.save(user);
  return { count: notifications.length };
};

module.exports = {
  listNotifications,
  updatePreferences,
  markRead,
  markAllRead,
};
