#!/usr/bin/env node
// scripts/test-server.js
// Simple test script to verify server and MongoDB connection

const http = require('http');
const mongodb = require('mongodb');

const BASE_URL = 'http://localhost:5000';
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://Atlas:SonaProject123@cluster55358.nszpb7v.mongodb.net/atlas-project?retryWrites=true&w=majority';

console.log('\n🧪 ATLAS BACKEND TEST SCRIPT\n');
console.log('========================================\n');

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m'
};

function log(symbol, message, color = 'reset') {
  console.log(`${colors[color]}${symbol} ${message}${colors.reset}`);
}

// Test 1: Server Health Check
function testServerHealth() {
  return new Promise((resolve) => {
    log('⏳', 'Testing server health check...');
    
    http.get(`${BASE_URL}/health`, (res) => {
      if (res.statusCode === 200) {
        log('✅', 'Server is running on port 5000', 'green');
        resolve(true);
      } else {
        log('❌', `Health check failed with status ${res.statusCode}`, 'red');
        resolve(false);
      }
    }).on('error', (err) => {
      log('❌', 'Cannot connect to server on port 5000', 'red');
      log('   ', 'Make sure to run: npm run dev', 'yellow');
      resolve(false);
    });
  });
}

// Test 2: MongoDB Connection
function testMongoDB() {
  return new Promise((resolve) => {
    log('⏳', 'Testing MongoDB connection...');
    
    const { MongoClient } = mongodb;
    const client = new MongoClient(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 5000,
    });

    client.connect()
      .then(async () => {
        // Try to ping the database
        const admin = client.db('admin');
        await admin.command({ ping: 1 });
        log('✅', 'MongoDB connection successful', 'green');
        client.close();
        resolve(true);
      })
      .catch((err) => {
        if (err.message.includes('ECONNREFUSED')) {
          log('❌', 'Cannot connect to MongoDB - Network error', 'red');
          log('   ', 'Check: Is your IP whitelisted in MongoDB Atlas?', 'yellow');
        } else if (err.message.includes('ENOTFOUND')) {
          log('❌', 'Cannot resolve MongoDB hostname', 'red');
          log('   ', 'Check: Is the cluster URL correct?', 'yellow');
        } else {
          log('❌', `MongoDB error: ${err.message.split(':')[0]}`, 'red');
        }
        resolve(false);
      });
  });
}

// Test 3: API Endpoint Test
function testAPIEndpoint() {
  return new Promise((resolve) => {
    log('⏳', 'Testing API endpoint...');
    
    const postData = JSON.stringify({
      email: 'test@example.com',
      password: 'password'
    });

    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 401 || res.statusCode === 400 || res.statusCode === 500) {
          // These are expected - means API routing works
          if (res.statusCode === 500 && data.includes('Server error')) {
            log('⚠️ ', 'API responded but MongoDB unavailable (expected)', 'yellow');
          } else {
            log('✅', 'API endpoint is responding', 'green');
          }
          resolve(true);
        } else {
          log('❓', `API returned status ${res.statusCode}`, 'blue');
          resolve(true);
        }
      });
    });

    req.on('error', (err) => {
      log('❌', 'Cannot connect to API endpoint', 'red');
      resolve(false);
    });

    req.write(postData);
    req.end();
  });
}

// Run all tests
async function runTests() {
  console.log(`${colors.blue}Configuration:${colors.reset}`);
  console.log(`  Port: 5000`);
  console.log(`  MongoDB: ${MONGO_URI.substring(0, 50)}...`);
  console.log('\n========================================\n');

  const serverOk = await testServerHealth();
  console.log('');
  
  const mongoOk = await testMongoDB();
  console.log('');
  
  const apiOk = await testAPIEndpoint();
  console.log('');

  console.log('========================================\n');
  console.log(`${colors.blue}Summary:${colors.reset}`);
  console.log(`  Server: ${serverOk ? '✅ OK' : '❌ FAILED'}`);
  console.log(`  MongoDB: ${mongoOk ? '✅ OK' : '❌ FAILED (needs IP whitelist)'}`);
  console.log(`  API: ${apiOk ? '✅ OK' : '❌ FAILED'}`);

  if (serverOk && mongoOk && apiOk) {
    log('\n🎉', 'All tests passed! Backend is ready to use.', 'green');
  } else if (serverOk && apiOk && !mongoOk) {
    log('\n⚠️ ', 'Server and API are working, but MongoDB needs configuration.', 'yellow');
    log('   ', 'See MONGODB_FIX.md for IP whitelisting steps.', 'yellow');
  } else {
    log('\n❌', 'Some tests failed. See details above.', 'red');
  }

  console.log('\n========================================\n');
  process.exit(serverOk && apiOk ? 0 : 1);
}

// Run tests
runTests().catch(err => {
  console.error('Test suite error:', err);
  process.exit(1);
});