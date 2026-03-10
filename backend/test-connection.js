require('dotenv').config();
const mongoose = require('mongoose');

async function main() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is not set in .env');
    }
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connection successful');
    process.exit(0);
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
    process.exit(1);
  }
}

main();
