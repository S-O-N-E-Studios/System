const mongoose = require('mongoose');
const calendarRepo = require('./calendar.repository');

const _notFound = () => Object.assign(new Error('Event not found'), { status: 404 });

const _normalizeLinkedEntity = (linkedEntity) => {
  if (!linkedEntity || linkedEntity.id == null) {
    return linkedEntity;
  }
  return {
    ...linkedEntity,
    id: new mongoose.Types.ObjectId(linkedEntity.id),
  };
};

const listEvents = async (tenant, query) => {
  const filters = {
    startDate: query.startDate,
    endDate: query.endDate,
    eventType: query.eventType,
  };
  if (query.projectId) {
    filters.projectId = new mongoose.Types.ObjectId(query.projectId);
  }
  const events = await calendarRepo.findEvents(tenant._id, filters);
  return events;
};

const getEvent = async (tenant, eventId) => {
  const event = await calendarRepo.findById(eventId, tenant._id);
  if (!event) throw _notFound();
  return event;
};

const createEvent = async (tenant, data, userId) => {
  const payload = {
    ...data,
    tenantId: tenant._id,
    createdBy: userId,
  };
  if (payload.linkedEntity) {
    payload.linkedEntity = _normalizeLinkedEntity(payload.linkedEntity);
  }
  if (payload.projectId) {
    payload.projectId = new mongoose.Types.ObjectId(payload.projectId);
  }
  if (payload.deptId) {
    payload.deptId = new mongoose.Types.ObjectId(payload.deptId);
  }
  return calendarRepo.create(payload);
};

const updateEvent = async (tenant, eventId, updates) => {
  const existing = await calendarRepo.findById(eventId, tenant._id);
  if (!existing) throw _notFound();

  const patch = { ...updates };
  if (patch.linkedEntity !== undefined) {
    patch.linkedEntity = _normalizeLinkedEntity(patch.linkedEntity);
  }
  if (patch.projectId !== undefined && patch.projectId !== null) {
    patch.projectId = new mongoose.Types.ObjectId(patch.projectId);
  }
  if (patch.deptId !== undefined && patch.deptId !== null) {
    patch.deptId = new mongoose.Types.ObjectId(patch.deptId);
  }

  return calendarRepo.updateById(eventId, tenant._id, patch);
};

const deleteEvent = async (tenant, eventId) => {
  const event = await calendarRepo.findById(eventId, tenant._id);
  if (!event) throw _notFound();
  await calendarRepo.deleteById(eventId, tenant._id);
  return { deleted: true };
};

module.exports = {
  listEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
};
