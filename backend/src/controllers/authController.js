const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { signToken } = require('../utils/tokens');

async function register(req, res, next) {
  try {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    if (!name || !/^\S+@\S+\.\S+$/.test(email) || password.length < 6) {
      return res.status(400).json({ error: 'Name, valid email and a 6+ character password are required.' });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ error: 'An account with that email already exists.' });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, passwordHash });
    return res.status(201).json({ user: user.toPublicJSON(), token: signToken(user) });
  } catch (error) {
    return next(error);
  }
}

async function login(req, res, next) {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    return res.json({ user: user.toPublicJSON(), token: signToken(user) });
  } catch (error) {
    return next(error);
  }
}

function me(req, res) {
  return res.json({ user: req.user.toPublicJSON() });
}

module.exports = { register, login, me };
