const crypto = require('crypto');
const User = require('../models/User');

function formatUser(u) {
  const obj = u.toObject ? u.toObject() : u;
  const tenants = (obj.tenants || [])
    .filter((t) => t.tenant)
    .map((t) => {
      const tenant = typeof t.tenant === 'object' ? t.tenant : { _id: t.tenant };
      return {
        id: tenant._id ? tenant._id.toString() : tenant.toString(),
        slug: tenant.slug || '',
        name: tenant.name || '',
        logo: tenant.logo || null,
        role: t.role,
      };
    });

  return {
    id: (obj._id || obj.id).toString(),
    email: obj.email,
    firstName: obj.firstName || '',
    lastName: obj.lastName || '',
    role: obj.role,
    avatarUrl: obj.avatarUrl || null,
    status: obj.status,
    tenants,
  };
}

// GET /api/users
exports.getUsers = async (req, res) => {
  try {
    const tenantId = req.tenant ? req.tenant._id : null;

    let users;
    if (tenantId) {
      users = await User.find({ 'tenants.tenant': tenantId })
        .select('-password -inviteToken -inviteTokenExpiry')
        .populate('tenants.tenant', 'slug name logo');
    } else {
      users = await User.find()
        .select('-password -inviteToken -inviteTokenExpiry')
        .populate('tenants.tenant', 'slug name logo');
    }

    res.json({ data: users.map(formatUser) });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/users/invite
exports.inviteUser = async (req, res) => {
  try {
    const tenantId = req.tenant ? req.tenant._id : null;
    const { email, role, firstName, lastName } = req.body;

    if (!email || !role) {
      return res.status(400).json({ message: 'Email and role are required' });
    }

    let user = await User.findOne({ email });

    if (user) {
      if (tenantId) {
        const alreadyMember = user.tenants.some(
          (t) => t.tenant.toString() === tenantId.toString()
        );
        if (alreadyMember) {
          return res.status(400).json({ message: 'User is already a member of this organisation' });
        }
        user.tenants.push({ tenant: tenantId, role });
        await user.save();
      }
    } else {
      const inviteToken = crypto.randomBytes(32).toString('hex');
      const inviteTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      user = await User.create({
        email,
        firstName: firstName || '',
        lastName: lastName || '',
        role,
        status: 'invited',
        inviteToken,
        inviteTokenExpiry,
        tenants: tenantId ? [{ tenant: tenantId, role }] : [],
      });
    }

    // In production, send email with invite link here
    // For MVP, just return success
    res.status(201).json({ data: null, message: 'Invitation sent' });
  } catch (error) {
    console.error('Invite user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// PATCH /api/users/:userId/role
exports.updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    const tenantId = req.tenant ? req.tenant._id : null;

    if (!role) {
      return res.status(400).json({ message: 'Role is required' });
    }

    const user = await User.findById(userId).populate('tenants.tenant', 'slug name logo');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (tenantId) {
      const membership = user.tenants.find(
        (t) => t.tenant && t.tenant._id.toString() === tenantId.toString()
      );
      if (!membership) {
        return res.status(404).json({ message: 'User is not a member of this organisation' });
      }
      membership.role = role;
    }

    user.role = role;
    await user.save();

    res.json({ data: formatUser(user) });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/users/:userId/suspend
exports.suspendUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.status = 'suspended';
    user.isActive = false;
    await user.save();

    res.json({ data: null, message: 'User suspended' });
  } catch (error) {
    console.error('Suspend user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/users/:userId/reactivate
exports.reactivateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.status = 'active';
    user.isActive = true;
    await user.save();

    res.json({ data: null, message: 'User reactivated' });
  } catch (error) {
    console.error('Reactivate user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
