const mongoose = require('mongoose');

const programSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    budget: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const departmentSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    budgetTotal: {
      type: Number,
      default: 0,
      min: 0,
    },
    budgetSpent: {
      type: Number,
      default: 0,
      min: 0,
    },
    headOfDept: {
      type: String,
      default: null,
      trim: true,
    },
    programs: {
      type: [programSchema],
      default: [],
    },
  },
  { timestamps: true }
);

departmentSchema.index({ tenantId: 1 });
departmentSchema.index({ tenantId: 1, slug: 1 }, { unique: true });

const Department = mongoose.model('Department', departmentSchema);

module.exports = Department;
