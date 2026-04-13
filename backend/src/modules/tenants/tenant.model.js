const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    orgType: {
      type: String,
      enum: ['provincial_gov', 'private_firm'],
      required: true,
    },
    plan: {
      type: String,
      default: 'trial',
    },
    primaryContact: {
      type: String,
      default: null,
    },
    emailDomain: {
      type: String,
      default: null,
      trim: true,
    },
    localMunicipalities: {
      type: [String],
      default: [],
    },
    logoUrl: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['active', 'suspended', 'trial'],
      default: 'trial',
    },
    theme: {
      primaryColour: { type: String, default: '#C0642C' },
      fontHeading: { type: String, default: 'DM Serif Display' },
      fontBody: { type: String, default: 'Inter' },
      defaultMode: { type: String, enum: ['light', 'dark'], default: 'light' },
    },
  },
  { timestamps: true }
);

tenantSchema.index({ status: 1 });

const Tenant = mongoose.model('Tenant', tenantSchema);

module.exports = Tenant;
