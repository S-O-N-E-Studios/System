// controllers/projectController.js
const Project = require('../models/Project');

// @desc    Create a new project
// @route   POST /api/projects
exports.createProject = async (req, res) => {
  try {
    const { name, description, budgetAllocated, location } = req.body;
    const project = await Project.create({
      name,
      description,
      budgetAllocated,
      location,
      createdBy: req.user._id,
      updatedBy: req.user._id
    });
    res.status(201).json(project);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all projects (with filters)
// @route   GET /api/projects
exports.getProjects = async (req, res) => {
  try {
    const { status } = req.query;
    let filter = {};
    if (status) filter.status = status;

    // Only show projects that user is part of? For MVP, show all (simpler)
    const projects = await Project.find(filter)
      .populate('team.user', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName');
    res.json(projects);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single project by ID
// @route   GET /api/projects/:id
exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('team.user', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName')
      .populate('files'); // we'll add file model later
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.json(project);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update a project
// @route   PUT /api/projects/:id
exports.updateProject = async (req, res) => {
  try {
    let project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Update fields
    const { name, description, status, budgetAllocated, expenditureToDate, location } = req.body;
    if (name) project.name = name;
    if (description) project.description = description;
    if (status) project.status = status;
    if (budgetAllocated !== undefined) project.budgetAllocated = budgetAllocated;
    if (expenditureToDate !== undefined) project.expenditureToDate = expenditureToDate;
    if (location) project.location = location;
    project.updatedBy = req.user._id;

    await project.save();
    res.json(project);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete a project (soft delete maybe, but here hard delete for simplicity)
// @route   DELETE /api/projects/:id
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    await project.remove();
    res.json({ message: 'Project removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};