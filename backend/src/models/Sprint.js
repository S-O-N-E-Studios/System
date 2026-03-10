const mongoose = require('mongoose');

const sprintSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    startDate: { type: Date },
    endDate: { type: Date },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Sprint', sprintSchema);
