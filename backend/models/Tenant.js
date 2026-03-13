const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema({
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[a-z0-9-]+$/, 'Slug may only contain lowercase letters, numbers, and hyphens'],
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  logo: String,
  plan: {
    type: String,
    enum: ['starter', 'professional', 'enterprise'],
    default: 'starter',
  },
  industryType: String,
  primaryContact: String,
  primaryEmail: {
    type: String,
    lowercase: true,
    trim: true,
  },
  address: String,
  timezone: {
    type: String,
    default: 'UTC',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
});

tenantSchema.set('toJSON', { virtuals: true });
tenantSchema.set('toObject', { virtuals: true });

tenantSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

module.exports = mongoose.model('Tenant', tenantSchema);
