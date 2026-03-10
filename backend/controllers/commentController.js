// controllers/commentController.js
const Comment = require('../models/Comment');
const Task = require('../models/Task');

// @desc    Get all comments for a task
// @route   GET /api/tasks/:taskId/comments
exports.getComments = async (req, res) => {
  try {
    const comments = await Comment.find({ task: req.params.taskId })
      .populate('createdBy', 'firstName lastName email');
    res.json(comments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Add a comment to a task
// @route   POST /api/tasks/:taskId/comments
exports.addComment = async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const comment = await Comment.create({
      text: req.body.text,
      task: req.params.taskId,
      createdBy: req.user._id,
      updatedBy: req.user._id
    });

    res.status(201).json(comment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update a comment
// @route   PUT /api/tasks/:taskId/comments/:commentId
exports.updateComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    // Only the creator or admin can edit? We'll check if user is creator or has role admin
    if (comment.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to edit this comment' });
    }

    comment.text = req.body.text || comment.text;
    comment.updatedBy = req.user._id;
    await comment.save();
    res.json(comment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete a comment
// @route   DELETE /api/tasks/:taskId/comments/:commentId
exports.deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    if (comment.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }
    await comment.remove();
    res.json({ message: 'Comment removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};