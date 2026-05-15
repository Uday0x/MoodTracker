const { Server } = require('socket.io');
const env = require('../config/env');
const Poll = require('../models/Poll');
const { buildAnalytics } = require('../services/analyticsService');

let io;

function initializeSocket(server) {
  io = new Server(server, {
    cors: {
      origin: function (origin, callback) {
        // Allow localhost (development)
        if (!origin || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
          return callback(null, true);
        }
        // Allow Render production domain
        if (origin && origin.includes('onrender.com')) {
          return callback(null, true);
        }
        // Allow configured origins
        const allowedOrigins = Array.isArray(env.clientUrl) ? env.clientUrl : [env.clientUrl];
        if (origin && allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        callback(null, true); // Allow all for WebSocket
      },
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    socket.on('poll:subscribe', async (pollId) => {
      if (!pollId) return;
      socket.join(`poll:${pollId}`);
      const poll = await Poll.findOne({ publicId: pollId });
      if (poll) socket.emit('analytics:update', buildAnalytics(poll));
    });

    socket.on('poll:unsubscribe', (pollId) => {
      if (pollId) socket.leave(`poll:${pollId}`);
    });
  });

  return io;
}

async function emitPollAnalytics(pollId) {
  if (!io) return;
  const poll = await Poll.findOne({ publicId: pollId });
  if (!poll) return;
  io.to(`poll:${pollId}`).emit('analytics:update', buildAnalytics(poll));
}

module.exports = { initializeSocket, emitPollAnalytics };
