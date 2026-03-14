const Sprint = require('../models/Sprint');
const Task = require('../models/Task');

function getTenantId(req) {
  return req.tenant ? req.tenant._id : null;
}

function formatSprint(s) {
  const obj = s.toObject ? s.toObject() : s;
  return {
    id: (obj._id || obj.id).toString(),
    tenantId: obj.tenantId ? obj.tenantId.toString() : null,
    projectId: obj.projectId ? obj.projectId.toString() : null,
    number: obj.number,
    name: obj.name,
    weekRange: obj.weekRange || null,
    startDate: obj.startDate ? (obj.startDate.toISOString ? obj.startDate.toISOString() : obj.startDate) : null,
    endDate: obj.endDate ? (obj.endDate.toISOString ? obj.endDate.toISOString() : obj.endDate) : null,
    status: obj.status || (obj.isActive ? 'active' : 'planned'),
    isActive: obj.isActive,
    storyPoints: obj.storyPoints || 0,
    completedPoints: obj.completedPoints || 0,
  };
}

exports.getSprints = async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ message: 'Tenant required' });

    const filter = { tenantId };
    if (req.query.projectId) filter.projectId = req.query.projectId;

    const sprints = await Sprint.find(filter).sort({ number: -1 });
    res.json({ data: sprints.map(formatSprint) });
  } catch (error) {
    console.error('Get sprints error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getActiveSprint = async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ message: 'Tenant required' });

    const sprint = await Sprint.findOne({ tenantId, isActive: true });
    res.json({ data: sprint ? formatSprint(sprint) : null });
  } catch (error) {
    console.error('Get active sprint error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createSprint = async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ message: 'Tenant required' });

    const lastSprint = await Sprint.findOne({ tenantId }).sort({ number: -1 });
    const nextNumber = lastSprint ? lastSprint.number + 1 : 1;

    const sprint = await Sprint.create({
      ...req.body,
      tenantId,
      number: req.body.number || nextNumber,
    });

    res.status(201).json({ data: formatSprint(sprint) });
  } catch (error) {
    console.error('Create sprint error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateSprint = async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ message: 'Tenant required' });

    const sprint = await Sprint.findOne({ _id: req.params.id, tenantId });
    if (!sprint) return res.status(404).json({ message: 'Sprint not found' });

    if (req.body.status === 'active') {
      await Sprint.updateMany({ tenantId, isActive: true }, { isActive: false, status: 'closed' });
      sprint.isActive = true;
    } else if (req.body.status === 'closed') {
      sprint.isActive = false;
    }

    Object.assign(sprint, req.body);
    await sprint.save();

    res.json({ data: formatSprint(sprint) });
  } catch (error) {
    console.error('Update sprint error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getSprintBurndown = async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ message: 'Tenant required' });

    const sprintId = req.query.sprintId;
    if (!sprintId) return res.status(400).json({ message: 'sprintId required' });

    const sprint = await Sprint.findOne({ _id: sprintId, tenantId });
    if (!sprint) return res.status(404).json({ message: 'Sprint not found' });

    const tasks = await Task.find({ tenantId, sprintId, isDeleted: { $ne: true } });
    const totalTasks = tasks.length;
    const doneTasks = tasks.filter((t) => t.status === 'done').length;

    const startDate = new Date(sprint.startDate);
    const endDate = new Date(sprint.endDate);
    const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

    const burndown = [];
    for (let i = 0; i <= totalDays; i++) {
      const day = new Date(startDate);
      day.setDate(day.getDate() + i);
      const ideal = totalTasks - (totalTasks / totalDays) * i;
      burndown.push({
        day: i + 1,
        date: day.toISOString().split('T')[0],
        ideal: Math.max(0, Math.round(ideal * 10) / 10),
        actual: i === totalDays ? totalTasks - doneTasks : null,
      });
    }

    res.json({
      data: {
        sprintName: sprint.name,
        totalTasks,
        doneTasks,
        remainingTasks: totalTasks - doneTasks,
        burndown,
      },
    });
  } catch (error) {
    console.error('Sprint burndown error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
