const PerformanceSnapshot = require('./performanceSnapshot.model');

const list = (tenantId, projectId) =>
  PerformanceSnapshot.find({ tenantId, projectId }).sort({ period: -1 }).lean();

const upsert = async (tenantId, projectId, userId, payload) => {
  const doc = await PerformanceSnapshot.findOneAndUpdate(
    { tenantId, projectId, period: payload.period },
    {
      $set: {
        consultant: payload.consultant || {},
        construction: payload.construction || {},
        capturedBy: userId,
        capturedAt: new Date(),
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return doc;
};

module.exports = {
  list,
  upsert,
};
