// config/db.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    console.log('⚠️  Server will start but database operations will fail until MongoDB is available');
    // Don't exit - let server start so we can test API structure
    console.log('⚠️  Please verify:');
    console.log('   1. MongoDB Atlas cluster is running');
    console.log('   2. Your IP is whitelisted in MongoDB Atlas');
    console.log('   3. Connection string credentials are correct');
  }
};

module.exports = connectDB;