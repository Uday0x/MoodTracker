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
// Try multiple possible locations
let frontendDist;
const possiblePaths = [
  path.resolve(path.join(__dirname, '../../frontend/dist')), // backend/src/app.js -> ../../frontend/dist
  path.resolve(path.join(__dirname, '../../../frontend/dist')), // if in different structure
  path.resolve('frontend/dist'), // relative to cwd
  path.resolve('/opt/render/project/frontend/dist'), // Render specific
];

for (const p of possiblePaths) {
  if (fs.existsSync(p)) {
    frontendDist = p;
    console.log('✓ Found frontend dist at:', frontendDist);
    break;
  }
}

if (!frontendDist) {
  console.warn('⚠ Frontend dist not found! Checked:', possiblePaths);
  frontendDist = possiblePaths[0]; // Use first option as fallback
}

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
  app.use((req, res, next) => {
    if (req.path.startsWith('/assets/')) {
      console.log('📦 Serving asset:', req.path);
    }
    next();
  });

  app.use(express.static(frontendDist, {
    dotfiles: 'ignore',
    maxAge: '1d',
    setHeaders: (res, path) => {
      if (path.endsWith('.html')) {
        res.set('Cache-Control', 'no-cache');
      }
    }
  }));
  
  // Serve index.html for all non-API routes (SPA routing)
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return notFound(req, res);
    const indexPath = path.join(frontendDist, 'index.html');
    console.log('📄 Serving index.html for:', req.path);
    res.sendFile(indexPath, (error) => {
      if (error) {
        console.error('❌ Error serving index.html:', error.message);
        return next(error);
      }
    });
  });
} else {
  console.error('❌ CRITICAL: Frontend dist folder not found at:', frontendDist);
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) return notFound(req, res);
    res.status(200).send(`
      <html>
        <head><title>Frontend Build Missing</title></head>
        <body style="font-family: Arial; padding: 20px; background: #f0f0f0;">
          <h1>❌ Frontend Not Found</h1>
          <p><strong>Debug Info:</strong></p>
          <p>Expected path: ${frontendDist}</p>
          <p>cwd: ${process.cwd()}</p>
          <p><strong>Available routes:</strong></p>
          <ul>
            <li><a href="/api/health">/api/health</a></li>
          </ul>
        </body>
      </html>
    `);
  });
}

app.use(notFound);
app.use(errorHandler);

module.exports = app;
