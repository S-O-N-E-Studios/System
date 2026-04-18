
//  * Connects to MongoDB then starts the Express server.
//  * Handles graceful shutdown on SIGTERM/SIGINT.


require("dotenv").config();

const { connect } = require('./config/database');
const env         = require('./config/env');
const app         = require('./app');

let server;

const start = async () => {
  await connect();

  server = app.listen(env.PORT, () => {
    console.log(` Server running on port ${env.PORT} [${env.NODE_ENV}]`);
  });
};

//  Graceful shutdown 

const shutdown = (signal) => {
  console.log(`\n${signal} received — shutting down gracefully`);

  if (server) {
    server.close(async () => {
      const mongoose = require('mongoose');
      await mongoose.connection.close();
      console.log('MongoDB connection closed');
      process.exit(0);
    });

    // Force exit if graceful shutdown takes too long
    setTimeout(() => {
      console.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10_000);
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
  shutdown('unhandledRejection');
});

start();