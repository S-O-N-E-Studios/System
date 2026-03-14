const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true,
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
  },
  sprintId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sprint',
  },
  title: {
    type: String,
    required: true,
  },
  description: String,
  status: {
    type: String,
    enum: ['backlog', 'todo', 'in_progress', 'in_review', 'done'],
    default: 'backlog',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
  },
  assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  dueDate: Date,
  attachments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'File' }],
  comments: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: String,
    createdAt: { type: Date, default: Date.now },
  }],
  isDeleted: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
});

taskSchema.set('toJSON', { virtuals: true });
taskSchema.set('toObject', { virtuals: true });

taskSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

module.exports = mongoose.model('Task', taskSchema);
