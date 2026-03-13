const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      return res.status(401).json({ message: 'User not found' });
    }
    if (req.user.status === 'suspended') {
      return res.status(403).json({ message: 'Account has been suspended' });
    }
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (req.user.role === 'SUPER_ADMIN') {
      return next();
    }

    if (req.tenant) {
      const membership = req.user.tenants.find(
        (t) => t.tenant.toString() === req.tenant._id.toString()
      );
      if (membership && roles.includes(membership.role)) {
        return next();
      }
    }

    if (roles.includes(req.user.role)) {
      return next();
    }

    return res.status(403).json({ message: `Role ${req.user.role} is not authorized` });
  };
};

const requireTenant = (req, res, next) => {
  if (!req.tenant) {
    return res.status(400).json({ message: 'X-Tenant-Slug header is required' });
  }
  next();
};

module.exports = { protect, authorize, requireTenant };
