const Project = require('../models/Project');
const Task = require('../models/Task');
const Sprint = require('../models/Sprint');

// GET /api/dashboard/stats
exports.getStats = async (req, res) => {
  try {
    const tenantId = req.tenant ? req.tenant._id : null;
    const filter = tenantId ? { tenantId } : {};

    const [
      totalProjects,
      projects,
      tasks,
      sprints,
    ] = await Promise.all([
      Project.countDocuments(filter),
      Project.find(filter).sort({ updatedAt: -1 }).limit(10).lean(),
      Task.find(filter).populate('assignee', 'firstName lastName').lean(),
      Sprint.find({ ...filter, isActive: true }).lean(),
    ]);

    const portfolioValue = projects.reduce((sum, p) => sum + (p.contractValue || 0), 0);
    const expenditureToDate = projects.reduce((sum, p) => sum + (p.expenditureToDate || 0), 0);
    const expenditurePercent = portfolioValue > 0
      ? Math.round((expenditureToDate / portfolioValue) * 100)
      : 0;

    const reportsPending = projects.filter(
      (p) => p.status === 'in_review'
    ).length;

    const stats = {
      totalProjects,
      portfolioValue,
      expenditureToDate,
      expenditurePercent,
      reportsPending,
    };

    const recentProjects = projects.slice(0, 5).map((p) => ({
      id: p._id.toHexString(),
      name: p.name,
      status: p.status === 'in_review' ? 'review' : p.status === 'not_started' ? 'planning' : p.status === 'complete' ? 'done' : 'active',
      updatedAt: p.updatedAt ? p.updatedAt.toISOString() : new Date().toISOString(),
    }));

    const now = new Date();
    const outstandingTasks = tasks
      .filter((t) => t.status !== 'done' && t.dueDate)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 5)
      .map((t) => {
        const due = new Date(t.dueDate);
        const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
        let dueStatus = 'planning';
        if (diffDays < 0) dueStatus = 'danger';
        else if (diffDays <= 3) dueStatus = 'review';

        return {
          id: t._id.toHexString(),
          title: t.title,
          dueStatus,
          due: due.toISOString(),
        };
      });

    const sprintProgress = sprints.map((s) => {
      const sprintTasks = tasks.filter(
        (t) => t.sprintId && t.sprintId.toString() === s._id.toString()
      );
      const doneTasks = sprintTasks.filter((t) => t.status === 'done').length;
      const progress = sprintTasks.length > 0
        ? Math.round((doneTasks / sprintTasks.length) * 100)
        : 0;

      return {
        name: s.name,
        sprint: `Sprint ${s.number}`,
        progress,
        status: s.isActive ? 'active' : 'planning',
      };
    });

    res.json({
      data: {
        stats,
        recentProjects,
        outstandingTasks,
        sprintProgress,
      },
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
