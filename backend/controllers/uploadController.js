// controllers/uploadController.js
const File = require('../models/File');
const Project = require('../models/Project');
const Task = require('../models/Task');

// @desc    Upload file and attach to project or task
// @route   POST /api/upload
exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { projectId, taskId } = req.body;

    // Validate that either projectId or taskId is provided
    if (!projectId && !taskId) {
      return res.status(400).json({ message: 'Must provide projectId or taskId' });
    }

    // If projectId, check if project exists
    if (projectId) {
      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
    }
    // If taskId, check if task exists
    if (taskId) {
      const task = await Task.findById(taskId);
      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }
    }

    // Create file record
    const file = await File.create({
      originalName: req.file.originalname,
      filename: req.file.filename,
      path: req.file.path,
      size: req.file.size,
      mimeType: req.file.mimetype,
      project: projectId || null,
      task: taskId || null,
      uploadedBy: req.user._id
    });

    // If attached to project, push file id into project.files array
    if (projectId) {
      await Project.findByIdAndUpdate(projectId, {
        $push: { files: file._id }
      });
    }
    // If attached to task, we might want to add to task as well, but we don't have a files array in Task model. Let's keep it simple for now.

    res.status(201).json(file);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get file info (maybe download later)
// @route   GET /api/files/:id
exports.getFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id)
      .populate('uploadedBy', 'firstName lastName');
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }
    res.json(file);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Download file
// @route   GET /api/files/:id/download
exports.downloadFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }
    res.download(file.path, file.originalName);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};