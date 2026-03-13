const Tenant = require('../models/Tenant');

const resolveTenant = async (req, res, next) => {
  const slug = req.headers['x-tenant-slug'];

  if (!slug) {
    return next();
  }

  try {
    const tenant = await Tenant.findOne({ slug });
    if (!tenant) {
      return res.status(404).json({ message: `Tenant "${slug}" not found` });
    }
    if (!tenant.isActive) {
      return res.status(403).json({ message: 'This organisation has been suspended' });
    }
    req.tenant = tenant;
    next();
  } catch (error) {
    console.error('Tenant middleware error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { resolveTenant };
