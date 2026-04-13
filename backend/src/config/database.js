const mongoose = require("mongoose");
const env = require("./env");
let memoryServer;

const connect = async () => {
  if (mongoose.connection.readyState === 1) return mongoose.connection;

  mongoose.set("strictQuery", true);

  let mongoUri = env.DATABASE_URL;

  if (process.env.USE_MEMORY_DB === "true") {
    // Dev/test convenience: run without local MongoDB installed.
    const { MongoMemoryServer } = require("mongodb-memory-server");
    memoryServer = await MongoMemoryServer.create();
    mongoUri = memoryServer.getUri();
  }

  await mongoose.connect(mongoUri, {
    autoIndex: env.isDevelopment,
  });

  return mongoose.connection;
};

const disconnect = async () => {
  await mongoose.connection.close();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = undefined;
  }
};

module.exports = { connect, disconnect };
