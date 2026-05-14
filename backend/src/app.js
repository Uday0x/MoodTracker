const express = require('express');
const cors = require('cors');
const path = require('path');
const env = require('./config/env');
const { optionalAuth } = require('./middleware/auth');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const authRoutes = require('./routes/authRoutes');
const pollRoutes = require('./routes/pollRoutes');

const app = express();
const frontendDist = path.join(__dirname, '..', '..', 'frontend', 'dist');

app.use(cors({ origin: env.clientUrl, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(optionalAuth);

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'pollpulse-api' });
});

app.use('/api/auth', authRoutes);
app.use('/api/polls', pollRoutes);

app.use(express.static(frontendDist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return notFound(req, res);
  return res.sendFile(path.join(frontendDist, 'index.html'), (error) => {
    if (error) return next();
    return undefined;
  });
});

app.use(notFound);
app.use(errorHandler);

module.exports = app;
