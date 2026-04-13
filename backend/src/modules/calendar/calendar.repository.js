const CalendarEvent = require('./calendarEvent.model');

/**
 * Build a Mongo filter for events overlapping [startDate, endDate] (inclusive).
 * Point events use `date`; ranged events use `date`..`endDate`.
 */
const _overlapFilter = (startDate, endDate) => ({
  $and: [
    { date: { $lte: endDate } },
    {
      $or: [
        {
          $and: [
            {
              $or: [
                { endDate: null },
                { endDate: { $exists: false } },
              ],
            },
            { date: { $gte: startDate } },
          ],
        },
        { endDate: { $gte: startDate } },
      ],
    },
  ],
});

const findEvents = (tenantId, filters = {}) => {
  const query = { tenantId };

  if (filters.projectId) {
    query.projectId = filters.projectId;
  }
  if (filters.eventType) {
    query.eventType = filters.eventType;
  }

  const { startDate, endDate } = filters;

  if (startDate && endDate) {
    Object.assign(query, _overlapFilter(startDate, endDate));
  } else if (startDate) {
    query.$or = [
      { date: { $gte: startDate } },
      { endDate: { $gte: startDate } },
    ];
  } else if (endDate) {
    query.date = { $lte: endDate };
  }

  return CalendarEvent.find(query).sort({ date: 1 }).lean();
};

const findById = (id, tenantId) =>
  CalendarEvent.findOne({ _id: id, tenantId });

const create = (data) => CalendarEvent.create(data);

const updateById = (id, tenantId, updates) =>
  CalendarEvent.findOneAndUpdate(
    { _id: id, tenantId },
    updates,
    { new: true, runValidators: true }
  );

const deleteById = (id, tenantId) =>
  CalendarEvent.findOneAndDelete({ _id: id, tenantId });

module.exports = {
  findEvents,
  findById,
  create,
  updateById,
  deleteById,
};
