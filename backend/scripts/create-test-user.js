// scripts/create-test-user.js
// This script creates a test admin user in MongoDB
// Run with: node scripts/create-test-user.js

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const createTestUser = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Check if test user exists
    const existingUser = await User.findOne({ email: 'admin@test.com' });
    if (existingUser) {
      console.log('✅ Test admin user already exists');
      process.exit(0);
    }

    // Create test admin user
    await User.create({
      email: 'admin@test.com',
      password: 'AdminPass123',
      role: 'admin',
      firstName: 'Test',
      lastName: 'Admin',
      isActive: true
    });

    console.log('✅ Test admin user created:');
    console.log('   Email: admin@test.com');
    console.log('   Password: AdminPass123');
    console.log('   Role: admin');
    
    // Create test team member
    await User.create({
      email: 'member@test.com',
      password: 'MemberPass123',
      role: 'team_member',
      firstName: 'Test',
      lastName: 'Member',
      isActive: true
    });

    console.log('✅ Test member user created:');
    console.log('   Email: member@test.com');
    console.log('   Password: MemberPass123');
    console.log('   Role: team_member');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
};

createTestUser();