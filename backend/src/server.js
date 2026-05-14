const http = require('http');
const app = require('./app');
const connectDatabase = require('./config/database');
const env = require('./config/env');
const { initializeSocket } = require('./socket');

async function startServer() {
  await connectDatabase();
  const server = http.createServer(app);
  initializeSocket(server);

  server.listen(env.port, () => {
    console.log(`PollPulse API running on port ${env.port}`);
    console.log(`Client URL: ${env.clientUrl}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start PollPulse backend:', error.message);
  process.exit(1);
});
