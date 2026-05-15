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

// CORS configuration to allow all localhost origins during development
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow localhost on any port
    if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      return callback(null, true);
    }
    
    // Allow from config (for production)
    const allowedOrigins = Array.isArray(env.clientUrl) ? env.clientUrl : [env.clientUrl];
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
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
