const { Server } = require('socket.io');
const env = require('../config/env');
const Poll = require('../models/Poll');
const { buildAnalytics } = require('../services/analyticsService');

let io;

function initializeSocket(server) {
  io = new Server(server, {
    cors: {
      origin: env.clientUrl,
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
