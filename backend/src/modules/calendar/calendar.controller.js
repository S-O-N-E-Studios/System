const calendarService = require('./calendar.service');
const { sendSuccess, sendCreated } = require('../../utils/apiResponse');

const list = async (req, res) => {
  const events = await calendarService.listEvents(req.tenant, req.query);
  return sendSuccess(res, { events });
};

const getOne = async (req, res) => {
  const event = await calendarService.getEvent(req.tenant, req.params.id);
  return sendSuccess(res, { event });
};

const create = async (req, res) => {
  const event = await calendarService.createEvent(req.tenant, req.body, req.user.sub);
  return sendCreated(res, { event });
};

const update = async (req, res) => {
  const event = await calendarService.updateEvent(req.tenant, req.params.id, req.body);
  return sendSuccess(res, { event });
};

const remove = async (req, res) => {
  const result = await calendarService.deleteEvent(req.tenant, req.params.id);
  return sendSuccess(res, result);
};

module.exports = { list, getOne, create, update, remove };
