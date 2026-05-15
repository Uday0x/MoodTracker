const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const env = {
  port: Number(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGODB_URI,
  mongoDnsServers: (process.env.MONGODB_DNS_SERVERS || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean),
  jwtSecret: process.env.JWT_SECRET || 'dev-pollpulse-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrl: process.env.CLIENT_URL || [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
    'http://localhost:5177'
  ]
};

module.exports = env;
