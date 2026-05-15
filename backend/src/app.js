const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const env = require('./config/env');
const { optionalAuth } = require('./middleware/auth');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const authRoutes = require('./routes/authRoutes');
const pollRoutes = require('./routes/pollRoutes');

const app = express();

// Calculate the correct path to frontend dist
// backend/src/app.js -> go up to backend, then up to root, then into frontend/dist
const frontendDist = path.resolve(path.join(__dirname, '../../frontend/dist'));

console.log('Frontend dist path:', frontendDist);
console.log('Frontend dist exists:', fs.existsSync(frontendDist));

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

// Serve static files from frontend dist
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist, {
    dotfiles: 'ignore',
    maxAge: '1d'
  }));
  
  // Serve index.html for all non-API routes (SPA routing)
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return notFound(req, res);
    res.sendFile(path.join(frontendDist, 'index.html'), (error) => {
      if (error) return next(error);
    });
  });
} else {
  console.warn('Frontend dist folder not found at:', frontendDist);
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) return notFound(req, res);
    res.status(200).send(`
      <html>
        <body style="font-family: Arial; padding: 20px;">
          <h1>Frontend Not Found</h1>
          <p>The frontend build is not available at: ${frontendDist}</p>
          <p>Available routes:</p>
          <ul>
            <li>/api/health - API health check</li>
            <li>/api/auth/* - Authentication endpoints</li>
            <li>/api/polls/* - Polls endpoints</li>
          </ul>
        </body>
      </html>
    `);
  });
}

app.use(notFound);
app.use(errorHandler);

module.exports = app;
