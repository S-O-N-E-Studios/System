const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const ROLES = ['SUPER_ADMIN', 'ORG_ADMIN', 'PROJECT_MANAGER', 'MEMBER', 'VIEWER'];

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: function () {
      return this.status !== 'invited';
    },
    minlength: 6,
  },
  firstName: { type: String, trim: true },
  lastName: { type: String, trim: true },
  avatarUrl: String,
  status: {
    type: String,
    enum: ['active', 'suspended', 'invited'],
    default: 'active',
  },
  tenants: [{
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant' },
    role: { type: String, enum: ROLES, default: 'MEMBER' },
  }],
  role: {
    type: String,
    enum: ROLES,
    default: 'MEMBER',
  },
  inviteToken: String,
  inviteTokenExpiry: Date,
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

userSchema.set('toJSON', {
  virtuals: true,
  transform: function (_doc, ret) {
    delete ret.password;
    delete ret.inviteToken;
    delete ret.inviteTokenExpiry;
    return ret;
  },
});
userSchema.set('toObject', { virtuals: true });

userSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
module.exports.ROLES = ROLES;
