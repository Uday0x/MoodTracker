const mongoose = require('mongoose');
const dns = require('dns');
const env = require('./env');

function maskMongoUri(uri = '') {
  return uri.replace(/(mongodb(?:\+srv)?:\/\/)([^:]+):([^@]+)@/i, '$1$2:***@');
}

async function connectDatabase() {
  mongoose.set('strictQuery', true);

  if (env.mongoDnsServers.length > 0) {
    dns.setServers(env.mongoDnsServers);
    console.log(`Using custom DNS servers: ${dns.getServers().join(', ')}`);
  }

  console.log('Connecting to MongoDB...');
  console.log(`MongoDB URI: ${maskMongoUri(env.mongoUri)}`);

  try {
    await mongoose.connect(env.mongoUri);
  } catch (error) {
    if (error && error.code === 'ECONNREFUSED' && String(error.message).includes('querySrv')) {
      console.error('MongoDB SRV DNS lookup failed. If this persists, set MONGODB_DNS_SERVERS=8.8.8.8,1.1.1.1 in backend .env');
    }
    throw error;
  }

  return mongoose.connection;
}

module.exports = connectDatabase;
