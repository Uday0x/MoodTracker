function notFound(req, res) {
  res.status(404).json({ error: 'Route not found.' });
}

function errorHandler(error, req, res, next) {
  // Log all errors for debugging
  console.error('❌ ERROR HANDLER:', {
    path: req.path,
    method: req.method,
    message: error.message,
    code: error.code,
    stack: error.stack
  });

  if (res.headersSent) return next(error);

  if (error.name === 'ValidationError') {
    const messages = Object.values(error.errors).map((detail) => detail.message);
    return res.status(400).json({ error: messages.join(' ') });
  }

  if (error.code === 11000) {
    return res.status(409).json({ error: 'A record with those unique details already exists.' });
  }

  const status = error.statusCode || error.status || 500;
  return res.status(status).json({ error: error.message || 'Unexpected server error.' });
}

module.exports = { notFound, errorHandler };
