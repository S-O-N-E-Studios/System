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
    address: {
      type: String,
      default: null,
      trim: true,
    },
    timezone: {
      type: String,
      default: 'Africa/Johannesburg',
      trim: true,
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

    /**
     * Organisation-owned SMTP (in-house relay). When enabled and configured,
     * transactional mail for that tenant (invites, client access, password reset
     * for members) is sent via this server instead of the platform default.
     */
    outboundEmail: {
      enabled: { type: Boolean, default: false },
      host: { type: String, default: null, trim: true },
      port: { type: Number, default: 587 },
      secure: { type: Boolean, default: false },
      authUser: { type: String, default: null, trim: true },
      authPassEncrypted: { type: String, default: null },
      fromName: { type: String, default: null, trim: true },
      fromAddress: { type: String, default: null, trim: true, lowercase: true },
      replyTo: { type: String, default: null, trim: true, lowercase: true },
    },
  },
  { timestamps: true }
);

const stripOutboundSecrets = (ret) => {
  if (ret.outboundEmail && typeof ret.outboundEmail === 'object') {
    const oe = { ...ret.outboundEmail };
    if (oe.authPassEncrypted) {
      oe.authPassSet = true;
      delete oe.authPassEncrypted;
    }
    ret.outboundEmail = oe;
  }
  return ret;
};

tenantSchema.set('toJSON', {
  transform(_doc, ret) {
    return stripOutboundSecrets(ret);
  },
});
tenantSchema.set('toObject', {
  transform(_doc, ret) {
    return stripOutboundSecrets(ret);
  },
});

tenantSchema.index({ status: 1 });

const Tenant = mongoose.model('Tenant', tenantSchema);

module.exports = Tenant;
