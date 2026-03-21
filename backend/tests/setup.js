const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

// Jest runs should not be throttled by the production rate limiters.
// Increase auth/general limits (or effectively disable them) for stability.
process.env.NODE_ENV = 'test';
process.env.RATE_LIMIT_AUTH_MAX = process.env.RATE_LIMIT_AUTH_MAX || '1000';
process.env.RATE_LIMIT_GENERAL_MAX = process.env.RATE_LIMIT_GENERAL_MAX || '10000';

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});
