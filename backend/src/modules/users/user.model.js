
//  * Key design decisions:
//  *  - role is a top-level field (not per-tenant) for fast JWT middleware checks
//  *  - tenants[] array holds the per-org role, deptId, and slug for multi-tenancy
//  *  - temporaryAccessId links CLIENT_TEMP users to their TemporaryAccess record
//  *  - passwordHash is never selected by default (select: false)
//  *  - refreshTokenHash stored for refresh token rotation and invalidation on logout


const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const { ROLES } = require('../../constants/roles');

const SALT_ROUNDS = 10; // MVP spec: minimum 10 salt rounds

const tenantMembershipSchema = new mongoose.Schema(
  {
    tenantId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
    tenantSlug: { type: String, required: true },
    role: {
      type:     String,
      enum:     Object.values(ROLES),
      required: true,
    },
    deptId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const notificationPreferenceSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
    projectUpdates: { type: Boolean, default: true },
    taskAssignments: { type: Boolean, default: true },
    reportSubmissions: { type: Boolean, default: true },
    deadlineReminders: { type: Boolean, default: true },
    teamInvitations: { type: Boolean, default: true },
  },
  { _id: false }
);

const notificationReadSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
    notificationKey: { type: String, required: true, trim: true },
    readAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    email: {
      type:     String,
      required: true,
      unique:   true,
      lowercase: true,
      trim:     true,
    },

    passwordHash: {
      type:   String,
      select: false, // never returned in queries unless explicitly requested
    },

    fullName: {
      type:     String,
      required: true,
      trim:     true,
    },


    role: {
      type:     String,
      enum:     Object.values(ROLES),
      required: true,
    },

    // Multi-tenancy: all orgs this user belongs to
    tenants: {
      type:    [tenantMembershipSchema],
      default: [],
    },

    notificationPreferences: {
      type: [notificationPreferenceSchema],
      default: [],
    },
    notificationReads: {
      type: [notificationReadSchema],
      default: [],
    },

    // CLIENT_TEMP only — links to the TemporaryAccess record
    temporaryAccessId: {
      type:    mongoose.Schema.Types.ObjectId,
      ref:     'TemporaryAccess',
      default: null,
    },

    // Microsoft Entra SSO 
    entraOid: {
      type:    String,
      default: null,
    },

    avatarUrl: {
      type:    String,
      default: null,
    },

    isActive: {
      type:    Boolean,
      default: true,
    },

    // Hashed refresh token for rotation + logout invalidation.
    
    refreshTokenHash: {
      type:   String,
      select: false,
    },

    // One-time tokens — stored as SHA-256 hashes 
    passwordResetTokenHash:  { type: String, select: false, default: null },
    passwordResetExpiresAt:  { type: Date,   select: false, default: null },

    lastLoginAt: { type: Date, default: null },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

//  Indexes 

// email index handled by unique: true on field
userSchema.index({ 'tenants.tenantId': 1 });
userSchema.index({ 'notificationPreferences.tenantId': 1 });
userSchema.index({ temporaryAccessId: 1 });
userSchema.index({ entraOid: 1 }, { sparse: true });

//  Instance Methods 

userSchema.methods.comparePassword = async function (plainPassword) {
  if (!this.passwordHash) {
    throw new Error('passwordHash not selected. Use .select("+passwordHash") in your query.');
  }
  return bcrypt.compare(plainPassword, this.passwordHash);
};

//  Set a new password — hashes and stores it. 
userSchema.methods.setPassword = async function (plainPassword) {
  this.passwordHash = await bcrypt.hash(plainPassword, SALT_ROUNDS);
};

//  Compare a plain-text refresh token against the stored hash. 
userSchema.methods.compareRefreshToken = async function (plainToken) {
  if (!this.refreshTokenHash) return false;
  return bcrypt.compare(plainToken, this.refreshTokenHash);
};

//  Store a hashed refresh token. 
userSchema.methods.setRefreshToken = async function (plainToken) {
  this.refreshTokenHash = await bcrypt.hash(plainToken, SALT_ROUNDS);
};

//  Clear the refresh token (logout / revoke). 
userSchema.methods.clearRefreshToken = function () {
  this.refreshTokenHash = null;
};

//  Get this user's membership for a specific tenant.
userSchema.methods.getTenantMembership = function (tenantId) {
  return this.tenants.find(
    (t) => t.tenantId.toString() === tenantId.toString()
  ) || null;
};

//  Sanitised user object safe to include in API responses. Omits all sensitive fields. 
userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.refreshTokenHash;
  delete obj.passwordResetTokenHash;
  delete obj.passwordResetExpiresAt;
  return obj;
};

//  Statics 

//  Find a user by email and select the passwordHash for login 
userSchema.statics.findByEmailWithPassword = function (email) {
  return this.findOne({ email: email.toLowerCase() }).select('+passwordHash');
};

const User = mongoose.model('User', userSchema);

module.exports = User;