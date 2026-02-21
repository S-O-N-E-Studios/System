const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    status: { type: String, enum: ['todo', 'in_progress', 'review', 'done'], default: 'todo' },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Task', taskSchema);
