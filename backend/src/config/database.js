const mongoose = require("mongoose");
const env = require("./env");
let memoryServer;

const sanitizeMongoUri = (uri) => {
  if (!uri) return "";
  // Hide credentials in logs: mongodb+srv://user:pass@host/db -> mongodb+srv://user:***@host/db
  return String(uri).replace(/\/\/([^:/]+):([^@]+)@/g, "//$1:***@");
};

const connectToUri = async (mongoUri, { label } = {}) => {
  await mongoose.connect(mongoUri, {
    autoIndex: env.isDevelopment,
  });
  const dbName = mongoose.connection?.name || "(unknown-db)";
  const host = mongoose.connection?.host || "(unknown-host)";
  const port = mongoose.connection?.port || "";
  // eslint-disable-next-line no-console
  console.log(
    `[db] connected (${label || "mongo"}): ${host}${port ? `:${port}` : ""}/${dbName}`
  );
  return mongoose.connection;
};

const connect = async () => {
  if (mongoose.connection.readyState === 1) return mongoose.connection;

  mongoose.set("strictQuery", true);

  const configuredUri = env.DATABASE_URL;

  // Explicit override: force in-memory DB (tests/dev only).
  if (process.env.USE_MEMORY_DB === "true") {
    const { MongoMemoryServer } = require("mongodb-memory-server");
    memoryServer = await MongoMemoryServer.create();
    const mongoUri = memoryServer.getUri();
    // eslint-disable-next-line no-console
    console.log(
      `[db] USE_MEMORY_DB=true, using in-memory mongodb: ${sanitizeMongoUri(mongoUri)}`
    );
    return connectToUri(mongoUri, { label: "memory" });
  }

  // Try configured URI first (Atlas/local/etc).
  try {
    // eslint-disable-next-line no-console
    console.log(`[db] connecting: ${sanitizeMongoUri(configuredUri)}`);
    return await connectToUri(configuredUri, { label: "configured" });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`[db] connect failed (configured): ${sanitizeMongoUri(configuredUri)}`);
    // In production we should never silently fall back.
    if (env.isProduction) throw err;
  }

  // Dev fallback: try local mongo.
  const localFallbackUri = "mongodb://127.0.0.1:27017/project360";
  try {
    // eslint-disable-next-line no-console
    console.log(`[db] falling back to local: ${sanitizeMongoUri(localFallbackUri)}`);
    return await connectToUri(localFallbackUri, { label: "local" });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[db] connect failed (local). Falling back to in-memory mongodb.");
  }

  // Final fallback: in-memory mongo (so app can still run end-to-end).
  // In production, fail fast instead of silently using a temporary DB.
  if (env.isProduction) {
    throw new Error("[db] No MongoDB connection available in production.");
  }
  const { MongoMemoryServer } = require("mongodb-memory-server");
  memoryServer = await MongoMemoryServer.create();
  const memoryUri = memoryServer.getUri();
  // eslint-disable-next-line no-console
  console.log(`[db] using in-memory mongodb: ${sanitizeMongoUri(memoryUri)}`);
  return connectToUri(memoryUri, { label: "memory-fallback" });
};

const disconnect = async () => {
  await mongoose.connection.close();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = undefined;
  }
};

module.exports = { connect, disconnect };
