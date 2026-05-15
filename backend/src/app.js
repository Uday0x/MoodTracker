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

// Frontend dist folder - use simple relative path from backend root
// __dirname = backend/src
// ../../frontend/dist = frontend/dist (2 levels up from src)
const frontendDist = path.join(__dirname, '../../frontend/dist');

console.log('='.repeat(60));
console.log('📦 STATIC FILE SERVING DEBUG');
console.log('='.repeat(60));
console.log('__dirname:', __dirname);
console.log('process.cwd():', process.cwd());
console.log('frontendDist:', frontendDist);
console.log('Exists:', fs.existsSync(frontendDist));
if (fs.existsSync(frontendDist)) {
  const files = fs.readdirSync(frontendDist);
  console.log('Files in dist:', files);
}
console.log('='.repeat(60));

// Serve static files FIRST (before CORS checks)
app.use(express.static(frontendDist));

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

// Apply auth middleware only to API routes
app.use('/api', optionalAuth);

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'pollpulse-api' });
});

app.use('/api/auth', authRoutes);
app.use('/api/polls', pollRoutes);

// SPA fallback - serve index.html for all non-API routes
app.get('*', (req, res, next) => {
  // Don't serve index.html for API routes
  if (req.path.startsWith('/api/')) {
    return notFound(req, res);
  }
  
  const indexPath = path.join(frontendDist, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('Error serving index.html:', err.message);
      res.status(404).send('Not Found');
    }
  });
});

app.use(notFound);
app.use(errorHandler);

module.exports = app;
