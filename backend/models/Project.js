// models/Project.js
const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  status: {
    type: String,
    enum: ['planning', 'active', 'on_hold', 'completed'],
    default: 'planning'
  },
  // For location – we can store address and coordinates later
  location: {
    address: String,
    coordinates: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: [Number] // [lng, lat]
    }
  },
  // Budget fields (for auto‑balance)
  budgetAllocated: {
    type: Number,
    default: 0
  },
  expenditureToDate: {
    type: Number,
    default: 0
  },
  // Virtual or pre-save calculated balance
  team: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    roleInProject: String,
    addedAt: { type: Date, default: Date.now }
  }],
  files: [{ type: mongoose.Schema.Types.ObjectId, ref: 'File' }], // will reference file model later
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

// Virtual for balance
projectSchema.virtual('balance').get(function() {
  return this.budgetAllocated - this.expenditureToDate;
});

// Ensure virtuals are included when converting to JSON
projectSchema.set('toJSON', { virtuals: true });
projectSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Project', projectSchema);