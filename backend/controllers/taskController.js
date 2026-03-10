// controllers/taskController.js
const Task = require('../models/Task');
const Project = require('../models/Project');

// Helper to get task by either id or taskId
const getTaskByIdHelper = async (id) => {
  return await Task.findById(id)
    .populate('assignee', 'firstName lastName email')
    .populate('createdBy', 'firstName lastName')
    .populate('project', 'name');
};

// @desc    Get all tasks for a project
// @route   GET /api/projects/:projectId/tasks
exports.getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ project: req.params.projectId })
      .populate('assignee', 'firstName lastName email');
    res.json(tasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create a task in a project
// @route   POST /api/projects/:projectId/tasks
exports.createTask = async (req, res) => {
  try {
    const { title, description, priority, assignee, dueDate } = req.body;
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const task = await Task.create({
      title,
      description,
      priority,
      assignee,
      dueDate,
      project: req.params.projectId,
      createdBy: req.user._id,
      updatedBy: req.user._id
    });

    res.status(201).json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single task by ID (works with both param names)
// @route   GET /api/tasks/:id  OR /api/projects/:projectId/tasks/:taskId
exports.getTaskById = async (req, res) => {
  try {
    const taskId = req.params.taskId || req.params.id;
    const task = await getTaskByIdHelper(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update a task
// @route   PUT /api/tasks/:id  OR /api/projects/:projectId/tasks/:taskId
exports.updateTask = async (req, res) => {
  try {
    const taskId = req.params.taskId || req.params.id;
    let task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const { title, description, status, priority, assignee, dueDate } = req.body;
    if (title) task.title = title;
    if (description) task.description = description;
    if (status) task.status = status;
    if (priority) task.priority = priority;
    if (assignee) task.assignee = assignee;
    if (dueDate) task.dueDate = dueDate;
    task.updatedBy = req.user._id;

    await task.save();
    res.json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id  OR /api/projects/:projectId/tasks/:taskId
exports.deleteTask = async (req, res) => {
  try {
    const taskId = req.params.taskId || req.params.id;
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    await task.remove();
    res.json({ message: 'Task removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};