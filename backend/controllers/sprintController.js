const Sprint = require('../models/Sprint');

function formatSprint(s) {
  const obj = s.toObject ? s.toObject() : s;
  return {
    id: (obj._id || obj.id).toString(),
    tenantId: obj.tenantId ? obj.tenantId.toString() : null,
    number: obj.number,
    name: obj.name,
    startDate: obj.startDate ? (obj.startDate.toISOString ? obj.startDate.toISOString() : obj.startDate) : null,
    endDate: obj.endDate ? (obj.endDate.toISOString ? obj.endDate.toISOString() : obj.endDate) : null,
    isActive: obj.isActive,
  };
}

// GET /api/sprints
exports.getSprints = async (req, res) => {
  try {
    const tenantId = req.tenant ? req.tenant._id : null;
    const filter = tenantId ? { tenantId } : {};
    const sprints = await Sprint.find(filter).sort({ number: -1 });
    res.json({ data: sprints.map(formatSprint) });
  } catch (error) {
    console.error('Get sprints error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/sprints/active
exports.getActiveSprint = async (req, res) => {
  try {
    const tenantId = req.tenant ? req.tenant._id : null;
    const filter = { isActive: true };
    if (tenantId) filter.tenantId = tenantId;

    const sprint = await Sprint.findOne(filter);
    res.json({ data: sprint ? formatSprint(sprint) : null });
  } catch (error) {
    console.error('Get active sprint error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
