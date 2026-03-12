// controllers/dashboardController.js
const Project = require('../models/Project');
const Task = require('../models/Task');

// @desc    Get dashboard summary
// @route   GET /api/dashboard
exports.getSummary = async (req, res) => {
  try {
    // Count projects by status
    const projectStats = await Project.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    // Count tasks by status
    const taskStats = await Task.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    // Total projects
    const totalProjects = await Project.countDocuments();

    // Total tasks
    const totalTasks = await Task.countDocuments();

    // You can add more metrics

    res.json({
      totalProjects,
      totalTasks,
      projectStats,
      taskStats
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};