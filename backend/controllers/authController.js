// controllers/authController.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// @desc    Register a new user (only admin can create others)
// @route   POST /api/auth/register
// @access  Private (admin) – we'll check inside
exports.register = async (req, res) => {
  // Optional validation
  // const errors = validationResult(req);
  // if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, password, role, firstName, lastName } = req.body;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Determine who can create what role
    // If request comes from an authenticated user, check if they are admin
    // But for simplicity, we'll allow anyone to register? No – acceptance criteria says "Administrators can create user accounts"
    // So we need to protect this route so only admins can create users.
    // Let's implement that later by adding protect & authorize middleware in the route.
    // For now, we'll just create the user with default role 'team_member' unless specified and admin check is done via middleware.

    // We'll assume the route is protected and req.user is available (admin)
    // But this endpoint might also be used for self-registration? The criteria only mentions admin creates users.
    // So we'll make it admin-only.

    // For now, we'll leave the logic simple and add the middleware when we define the route.

    const user = await User.create({
      email,
      password,
      role: role || 'team_member',
      firstName,
      lastName
    });

    res.status(201).json({
      _id: user._id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      token: generateToken(user._id)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    if (!user.isActive) {
      return res.status(403).json({ message: 'Account deactivated' });
    }
    res.json({
      _id: user._id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      token: generateToken(user._id)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};