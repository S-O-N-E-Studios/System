const Tenant = require('../models/Tenant');
const User = require('../models/User');

function formatTenant(t, userCount) {
  const obj = t.toObject ? t.toObject() : t;
  return {
    id: (obj._id || obj.id).toString(),
    slug: obj.slug,
    name: obj.name,
    logo: obj.logo || null,
    plan: obj.plan,
    primaryContact: obj.primaryContact || '',
    primaryEmail: obj.primaryEmail || '',
    address: obj.address || null,
    timezone: obj.timezone || 'UTC',
    isActive: obj.isActive,
    userCount: userCount !== undefined ? userCount : 0,
    createdAt: obj.createdAt ? (obj.createdAt.toISOString ? obj.createdAt.toISOString() : obj.createdAt) : null,
  };
}

// GET /api/admin/tenants
exports.getTenants = async (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    const limit = parseInt(pageSize);

    const [tenants, total] = await Promise.all([
      Tenant.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Tenant.countDocuments(),
    ]);

    const data = await Promise.all(
      tenants.map(async (t) => {
        const userCount = await User.countDocuments({ 'tenants.tenant': t._id });
        return formatTenant(t, userCount);
      })
    );

    res.json({
      data,
      total,
      page: parseInt(page),
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Get tenants error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/admin/tenants/:id
exports.getTenantById = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    const userCount = await User.countDocuments({ 'tenants.tenant': tenant._id });
    res.json({ data: formatTenant(tenant, userCount) });
  } catch (error) {
    console.error('Get tenant error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/admin/tenants/:id/suspend
exports.suspendTenant = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    tenant.isActive = false;
    await tenant.save();

    res.json({ data: null, message: 'Tenant suspended' });
  } catch (error) {
    console.error('Suspend tenant error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/admin/tenants/:id/reactivate
exports.reactivateTenant = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    tenant.isActive = true;
    await tenant.save();

    res.json({ data: null, message: 'Tenant reactivated' });
  } catch (error) {
    console.error('Reactivate tenant error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
