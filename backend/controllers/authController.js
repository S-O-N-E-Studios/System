const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Tenant = require('../models/Tenant');
const RefreshToken = require('../models/RefreshToken');

const JWT_EXPIRY = process.env.JWT_EXPIRY || '15m';
const JWT_REFRESH_EXPIRY_DAYS = parseInt(process.env.JWT_REFRESH_EXPIRY_DAYS || '30', 10);

const generateAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: JWT_EXPIRY });
};

const generateRefreshToken = async (userId) => {
  const token = crypto.randomBytes(40).toString('hex');
  const expiresAt = new Date(Date.now() + JWT_REFRESH_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
  await RefreshToken.create({ userId, token, expiresAt });
  return token;
};

const buildUserResponse = async (user) => {
  const populated = await User.findById(user._id)
    .select('-password -inviteToken -inviteTokenExpiry')
    .populate('tenants.tenant', 'slug name logo');

  const tenants = (populated.tenants || [])
    .filter((t) => t.tenant)
    .map((t) => ({
      id: t.tenant._id.toHexString(),
      slug: t.tenant.slug,
      name: t.tenant.name,
      logo: t.tenant.logo || null,
      role: t.role,
    }));

  return {
    id: populated._id.toHexString(),
    email: populated.email,
    firstName: populated.firstName,
    lastName: populated.lastName,
    role: populated.role,
    avatarUrl: populated.avatarUrl || null,
    status: populated.status,
    tenants,
  };
};

// POST /api/auth/login
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    if (user.status === 'suspended') {
      return res.status(403).json({ message: 'Account has been suspended' });
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = await generateRefreshToken(user._id);
    const userData = await buildUserResponse(user);

    res.json({
      data: {
        user: userData,
        tokens: { accessToken, refreshToken },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/auth/register-org
exports.registerOrg = async (req, res) => {
  const {
    orgName, slug, industryType,
    primaryContactName, primaryContactEmail,
    adminFirstName, adminLastName, adminEmail, adminPassword,
  } = req.body;

  try {
    if (!orgName || !slug || !adminEmail || !adminPassword) {
      return res.status(400).json({ message: 'Required fields missing' });
    }

    const existingTenant = await Tenant.findOne({ slug });
    if (existingTenant) {
      return res.status(400).json({ message: 'Slug is already taken' });
    }
    const existingUser = await User.findOne({ email: adminEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'Email is already registered' });
    }

    const tenant = await Tenant.create({
      slug,
      name: orgName,
      industryType,
      primaryContact: primaryContactName,
      primaryEmail: primaryContactEmail,
    });

    const user = await User.create({
      email: adminEmail,
      password: adminPassword,
      firstName: adminFirstName,
      lastName: adminLastName,
      role: 'ORG_ADMIN',
      status: 'active',
      tenants: [{ tenant: tenant._id, role: 'ORG_ADMIN' }],
    });

    tenant.createdBy = user._id;
    await tenant.save();

    const accessToken = generateAccessToken(user._id);
    const refreshToken = await generateRefreshToken(user._id);
    const userData = await buildUserResponse(user);

    res.status(201).json({
      data: {
        user: userData,
        tokens: { accessToken, refreshToken },
      },
    });
  } catch (error) {
    console.error('Register org error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/auth/check-slug/:slug
exports.checkSlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const existing = await Tenant.findOne({ slug: slug.toLowerCase() });

    if (existing) {
      const suggestion = `${slug}-${Math.random().toString(36).slice(2, 5)}`;
      return res.json({ data: { available: false, suggestion } });
    }

    res.json({ data: { available: true } });
  } catch (error) {
    console.error('Check slug error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/auth/accept-invite
exports.acceptInvite = async (req, res) => {
  const { token, password } = req.body;
  try {
    if (!token || !password) {
      return res.status(400).json({ message: 'Token and password are required' });
    }

    const user = await User.findOne({
      inviteToken: token,
      inviteTokenExpiry: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired invite token' });
    }

    user.password = password;
    user.status = 'active';
    user.inviteToken = undefined;
    user.inviteTokenExpiry = undefined;
    await user.save();

    const accessToken = generateAccessToken(user._id);
    const refreshToken = await generateRefreshToken(user._id);
    const userData = await buildUserResponse(user);

    res.json({
      data: {
        user: userData,
        tokens: { accessToken, refreshToken },
      },
    });
  } catch (error) {
    console.error('Accept invite error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/auth/change-password
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required' });
    }

    const user = await User.findById(req.user._id);
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ data: null, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/auth/refresh
exports.refresh = async (req, res) => {
  const { refreshToken } = req.body;
  try {
    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }

    const stored = await RefreshToken.findOne({ token: refreshToken });
    if (!stored || stored.expiresAt < new Date()) {
      if (stored) await stored.deleteOne();
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }

    await stored.deleteOne();

    const user = await User.findById(stored.userId);
    if (!user || user.status === 'suspended') {
      return res.status(401).json({ message: 'User not found or suspended' });
    }

    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = await generateRefreshToken(user._id);

    res.json({
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const userData = await buildUserResponse(req.user);
    res.json({ data: userData });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
