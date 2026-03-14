const Task = require('../models/Task');

function getTenantId(req) {
  return req.tenant ? req.tenant._id : null;
}

function formatTask(t) {
  const obj = t.toObject ? t.toObject() : t;
  return {
    id: (obj._id || obj.id).toString(),
    tenantId: obj.tenantId ? obj.tenantId.toString() : null,
    projectId: obj.projectId ? obj.projectId.toString() : null,
    sprintId: obj.sprintId ? obj.sprintId.toString() : null,
    title: obj.title,
    description: obj.description || null,
    status: obj.status,
    priority: obj.priority,
    assigneeId: obj.assignee ? (typeof obj.assignee === 'object' ? obj.assignee._id.toString() : obj.assignee.toString()) : null,
    assigneeName: obj.assignee && typeof obj.assignee === 'object'
      ? `${obj.assignee.firstName || ''} ${obj.assignee.lastName || ''}`.trim()
      : null,
    assigneeAvatar: obj.assignee && typeof obj.assignee === 'object' ? obj.assignee.avatarUrl || null : null,
    dueDate: obj.dueDate ? (obj.dueDate.toISOString ? obj.dueDate.toISOString() : obj.dueDate) : null,
    comments: (obj.comments || []).map((c) => ({
      userId: c.userId ? c.userId.toString() : null,
      text: c.text,
      createdAt: c.createdAt ? (c.createdAt.toISOString ? c.createdAt.toISOString() : c.createdAt) : null,
    })),
    createdAt: obj.createdAt ? (obj.createdAt.toISOString ? obj.createdAt.toISOString() : obj.createdAt) : null,
    updatedAt: obj.updatedAt ? (obj.updatedAt.toISOString ? obj.updatedAt.toISOString() : obj.updatedAt) : null,
  };
}

exports.getTasks = async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ message: 'Tenant required' });

    const { sprintId, projectId, assignee, status, page = 1, pageSize = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    const limit = parseInt(pageSize);

    const filter = { tenantId, isDeleted: { $ne: true } };
    if (sprintId) filter.sprintId = sprintId;
    if (projectId) filter.projectId = projectId;
    if (assignee) filter.assignee = assignee;
    if (status) filter.status = status;

    const [tasks, total] = await Promise.all([
      Task.find(filter)
        .populate('assignee', 'firstName lastName avatarUrl')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Task.countDocuments(filter),
    ]);

    res.json({
      data: tasks.map(formatTask),
      total,
      page: parseInt(page),
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createTask = async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ message: 'Tenant required' });

    const { title, description, status, priority, assigneeId, projectId, sprintId, dueDate } = req.body;

    const task = await Task.create({
      tenantId,
      projectId: projectId || null,
      sprintId: sprintId || null,
      title,
      description,
      status: status || 'backlog',
      priority: priority || 'medium',
      assignee: assigneeId || null,
      dueDate: dueDate || null,
      createdBy: req.user._id,
      updatedBy: req.user._id,
    });

    const populated = await Task.findById(task._id)
      .populate('assignee', 'firstName lastName avatarUrl');

    res.status(201).json({ data: formatTask(populated) });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ message: 'Tenant required' });

    const task = await Task.findOne({ _id: req.params.id, tenantId, isDeleted: { $ne: true } });
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const { title, description, status, priority, assigneeId, projectId, sprintId, dueDate } = req.body;
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (status !== undefined) task.status = status;
    if (priority !== undefined) task.priority = priority;
    if (assigneeId !== undefined) task.assignee = assigneeId || null;
    if (projectId !== undefined) task.projectId = projectId;
    if (sprintId !== undefined) task.sprintId = sprintId;
    if (dueDate !== undefined) task.dueDate = dueDate;
    task.updatedBy = req.user._id;

    await task.save();

    const populated = await Task.findById(task._id)
      .populate('assignee', 'firstName lastName avatarUrl');

    res.json({ data: formatTask(populated) });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateTaskStatus = async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ message: 'Tenant required' });

    const task = await Task.findOne({ _id: req.params.id, tenantId, isDeleted: { $ne: true } });
    if (!task) return res.status(404).json({ message: 'Task not found' });

    task.status = req.body.status;
    task.updatedBy = req.user._id;
    await task.save();

    const populated = await Task.findById(task._id)
      .populate('assignee', 'firstName lastName avatarUrl');

    res.json({ data: formatTask(populated) });
  } catch (error) {
    console.error('Update task status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ message: 'Tenant required' });

    const task = await Task.findOne({ _id: req.params.id, tenantId });
    if (!task) return res.status(404).json({ message: 'Task not found' });

    task.isDeleted = true;
    await task.save();
    res.json({ data: null, message: 'Task removed' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.addComment = async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) return res.status(400).json({ message: 'Tenant required' });

    const task = await Task.findOne({ _id: req.params.id, tenantId, isDeleted: { $ne: true } });
    if (!task) return res.status(404).json({ message: 'Task not found' });

    task.comments.push({
      userId: req.user._id,
      text: req.body.text,
      createdAt: new Date(),
    });
    await task.save();

    const populated = await Task.findById(task._id)
      .populate('assignee', 'firstName lastName avatarUrl');

    res.status(201).json({ data: formatTask(populated) });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
