const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');

async function optionalAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    req.user = await User.findById(payload.sub);
    return next();
  } catch (error) {
    req.user = null;
    return next();
  }
}

function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  return next();
}

module.exports = { optionalAuth, requireAuth };
