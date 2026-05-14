const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { URL } = require('url');

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-pollpulse-secret-change-me';
const DB_FILE = path.join(__dirname, 'data', 'db.json');
const PUBLIC_DIR = path.join(__dirname, 'public');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.ico': 'image/x-icon'
};

function createId() {
  return crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');
}

function ensureDb() {
  if (!fs.existsSync(path.dirname(DB_FILE))) fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ users: [], polls: [] }, null, 2));
  }
}

function readDb() {
  ensureDb();
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

function writeDb(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.pbkdf2Sync(password, salt, 120000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, expected] = stored.split(':');
  const actual = crypto.pbkdf2Sync(password, salt, 120000, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(actual, 'hex'), Buffer.from(expected, 'hex'));
}

function base64Url(input) {
  return Buffer.from(input).toString('base64url');
}

function signToken(payload) {
  const header = base64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64Url(JSON.stringify({ ...payload, exp: Date.now() + 1000 * 60 * 60 * 24 * 7 }));
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

function verifyToken(token) {
  if (!token) return null;
  const [header, body, signature] = token.split('.');
  if (!header || !body || !signature) return null;
  const expected = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  if (payload.exp < Date.now()) return null;
  const db = readDb();
  const user = db.users.find((candidate) => candidate.id === payload.sub);
  return user ? { id: user.id, name: user.name, email: user.email } : null;
}

function getAuthUser(req) {
  const auth = req.headers.authorization || '';
  return verifyToken(auth.startsWith('Bearer ') ? auth.slice(7) : null);
}

function sendJson(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error('Request body is too large.'));
        req.destroy();
      }
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(new Error('Invalid JSON body.'));
      }
    });
  });
}

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email };
}

function isExpired(poll) {
  return new Date(poll.expiresAt).getTime() <= Date.now();
}

function pollStatus(poll) {
  if (poll.published) return 'published';
  return isExpired(poll) ? 'expired' : 'active';
}

function summarizePoll(poll) {
  const summary = poll.questions.map((question) => {
    const optionCounts = question.options.map((option) => ({
      id: option.id,
      text: option.text,
      count: 0,
      percentage: 0
    }));
    let answered = 0;
    for (const response of poll.responses) {
      const answer = response.answers.find((candidate) => candidate.questionId === question.id);
      if (!answer) continue;
      answered += 1;
      const option = optionCounts.find((candidate) => candidate.id === answer.optionId);
      if (option) option.count += 1;
    }
    for (const option of optionCounts) {
      option.percentage = answered ? Math.round((option.count / answered) * 100) : 0;
    }
    return {
      id: question.id,
      text: question.text,
      required: question.required,
      answered,
      skipped: poll.responses.length - answered,
      options: optionCounts
    };
  });

  const authenticatedResponses = poll.responses.filter((response) => response.userId).length;
  return {
    pollId: poll.id,
    title: poll.title,
    totalResponses: poll.responses.length,
    authenticatedResponses,
    anonymousResponses: poll.responses.length - authenticatedResponses,
    status: pollStatus(poll),
    expiresAt: poll.expiresAt,
    published: poll.published,
    questions: summary,
    recentResponses: poll.responses.slice(-5).reverse().map((response) => ({
      id: response.id,
      createdAt: response.createdAt,
      respondent: response.userId ? 'Authenticated participant' : 'Anonymous participant'
    }))
  };
}

function safePoll(poll, includeResults = false) {
  const base = {
    id: poll.id,
    title: poll.title,
    description: poll.description,
    responseMode: poll.responseMode,
    expiresAt: poll.expiresAt,
    published: poll.published,
    status: pollStatus(poll),
    createdAt: poll.createdAt,
    questions: poll.questions
  };
  if (includeResults) base.analytics = summarizePoll(poll);
  return base;
}

function validatePollInput(input) {
  const errors = [];
  if (!input.title || input.title.trim().length < 3) errors.push('Title must be at least 3 characters.');
  if (!['anonymous', 'authenticated'].includes(input.responseMode)) errors.push('Choose anonymous or authenticated response mode.');
  if (!input.expiresAt || Number.isNaN(new Date(input.expiresAt).getTime())) errors.push('A valid expiry date and time is required.');
  if (input.expiresAt && new Date(input.expiresAt).getTime() <= Date.now()) errors.push('Expiry time must be in the future.');
  if (!Array.isArray(input.questions) || input.questions.length === 0) errors.push('Add at least one question.');

  (input.questions || []).forEach((question, index) => {
    if (!question.text || question.text.trim().length < 3) errors.push(`Question ${index + 1} needs meaningful text.`);
    if (!Array.isArray(question.options) || question.options.length < 2) errors.push(`Question ${index + 1} needs at least two options.`);
    (question.options || []).forEach((option, optionIndex) => {
      const text = typeof option === 'string' ? option : option.text;
      if (!text || text.trim().length === 0) errors.push(`Option ${optionIndex + 1} for question ${index + 1} cannot be blank.`);
    });
  });
  return errors;
}

function validateAnswers(poll, answers) {
  const errors = [];
  const answerMap = new Map((answers || []).map((answer) => [answer.questionId, answer.optionId]));

  for (const question of poll.questions) {
    const selected = answerMap.get(question.id);
    if (!selected) {
      if (question.required) errors.push(`Question "${question.text}" is required.`);
      continue;
    }
    if (!question.options.some((option) => option.id === selected)) {
      errors.push(`Question "${question.text}" has an invalid option selected.`);
    }
  }

  return errors;
}

const socketsByPoll = new Map();

function encodeWebSocketFrame(payload) {
  const data = Buffer.from(payload);
  const length = data.length;
  if (length < 126) return Buffer.concat([Buffer.from([0x81, length]), data]);
  if (length < 65536) {
    const header = Buffer.alloc(4);
    header[0] = 0x81;
    header[1] = 126;
    header.writeUInt16BE(length, 2);
    return Buffer.concat([header, data]);
  }
  const header = Buffer.alloc(10);
  header[0] = 0x81;
  header[1] = 127;
  header.writeBigUInt64BE(BigInt(length), 2);
  return Buffer.concat([header, data]);
}

function decodeWebSocketFrame(buffer) {
  if (buffer.length < 6) return null;
  const lengthByte = buffer[1] & 0x7f;
  let offset = 2;
  let length = lengthByte;
  if (lengthByte === 126) {
    length = buffer.readUInt16BE(offset);
    offset += 2;
  } else if (lengthByte === 127) {
    length = Number(buffer.readBigUInt64BE(offset));
    offset += 8;
  }
  const mask = buffer.slice(offset, offset + 4);
  offset += 4;
  const payload = buffer.slice(offset, offset + length);
  return Buffer.from(payload.map((byte, index) => byte ^ mask[index % 4])).toString('utf8');
}

function broadcastAnalytics(pollId) {
  const sockets = socketsByPoll.get(pollId);
  if (!sockets || sockets.size === 0) return;
  const db = readDb();
  const poll = db.polls.find((candidate) => candidate.id === pollId);
  if (!poll) return;
  const message = encodeWebSocketFrame(JSON.stringify({ type: 'analytics:update', analytics: summarizePoll(poll) }));
  for (const socket of sockets) {
    if (!socket.destroyed) socket.write(message);
  }
}

function addSocketToPoll(socket, pollId) {
  if (!socketsByPoll.has(pollId)) socketsByPoll.set(pollId, new Set());
  socketsByPoll.get(pollId).add(socket);
  socket.pollIds.add(pollId);
  broadcastAnalytics(pollId);
}

async function handleApi(req, res, pathname) {
  try {
    const db = readDb();
    const user = getAuthUser(req);

    if (req.method === 'POST' && pathname === '/api/auth/register') {
      const body = await parseBody(req);
      const email = String(body.email || '').trim().toLowerCase();
      const name = String(body.name || '').trim();
      const password = String(body.password || '');
      if (!name || !email.includes('@') || password.length < 6) {
        return sendJson(res, 400, { error: 'Name, valid email and a 6+ character password are required.' });
      }
      if (db.users.some((candidate) => candidate.email === email)) {
        return sendJson(res, 409, { error: 'An account with that email already exists.' });
      }
      const created = { id: createId(), name, email, passwordHash: hashPassword(password), createdAt: new Date().toISOString() };
      db.users.push(created);
      writeDb(db);
      return sendJson(res, 201, { user: publicUser(created), token: signToken({ sub: created.id }) });
    }

    if (req.method === 'POST' && pathname === '/api/auth/login') {
      const body = await parseBody(req);
      const email = String(body.email || '').trim().toLowerCase();
      const password = String(body.password || '');
      const found = db.users.find((candidate) => candidate.email === email);
      if (!found || !verifyPassword(password, found.passwordHash)) return sendJson(res, 401, { error: 'Invalid email or password.' });
      return sendJson(res, 200, { user: publicUser(found), token: signToken({ sub: found.id }) });
    }

    if (req.method === 'GET' && pathname === '/api/me') {
      if (!user) return sendJson(res, 401, { error: 'Authentication required.' });
      return sendJson(res, 200, { user });
    }

    if (req.method === 'GET' && pathname === '/api/polls') {
      if (!user) return sendJson(res, 401, { error: 'Authentication required.' });
      const polls = db.polls.filter((poll) => poll.creatorId === user.id).map((poll) => ({
        ...safePoll(poll),
        totalResponses: poll.responses.length
      }));
      return sendJson(res, 200, { polls });
    }

    if (req.method === 'POST' && pathname === '/api/polls') {
      if (!user) return sendJson(res, 401, { error: 'Authentication required.' });
      const body = await parseBody(req);
      const errors = validatePollInput(body);
      if (errors.length) return sendJson(res, 400, { error: errors.join(' ') });
      const poll = {
        id: createId(),
        creatorId: user.id,
        title: body.title.trim(),
        description: String(body.description || '').trim(),
        responseMode: body.responseMode,
        expiresAt: new Date(body.expiresAt).toISOString(),
        published: false,
        createdAt: new Date().toISOString(),
        questions: body.questions.map((question) => ({
          id: createId(),
          text: question.text.trim(),
          required: Boolean(question.required),
          options: question.options.map((option) => ({ id: createId(), text: (typeof option === 'string' ? option : option.text).trim() }))
        })),
        responses: []
      };
      db.polls.push(poll);
      writeDb(db);
      return sendJson(res, 201, { poll: safePoll(poll) });
    }

    const pollMatch = pathname.match(/^\/api\/polls\/([^/]+)(?:\/(responses|analytics|publish))?$/);
    if (pollMatch) {
      const [, pollId, action] = pollMatch;
      const poll = db.polls.find((candidate) => candidate.id === pollId);
      if (!poll) return sendJson(res, 404, { error: 'Poll not found.' });

      if (req.method === 'GET' && !action) {
        const includeResults = poll.published || (user && user.id === poll.creatorId);
        return sendJson(res, 200, { poll: safePoll(poll, includeResults) });
      }

      if (req.method === 'POST' && action === 'responses') {
        if (poll.published) return sendJson(res, 400, { error: 'This poll has been published and no longer accepts responses.' });
        if (isExpired(poll)) return sendJson(res, 400, { error: 'This poll has expired and is no longer accepting responses.' });
        if (poll.responseMode === 'authenticated' && !user) return sendJson(res, 401, { error: 'Please log in to answer this authenticated poll.' });
        if (user && poll.responses.some((response) => response.userId === user.id)) {
          return sendJson(res, 409, { error: 'You have already submitted a response for this poll.' });
        }
        const body = await parseBody(req);
        const errors = validateAnswers(poll, body.answers);
        if (errors.length) return sendJson(res, 400, { error: errors.join(' ') });
        const answerMap = new Map((body.answers || []).map((answer) => [answer.questionId, answer.optionId]));
        poll.responses.push({
          id: createId(),
          userId: user ? user.id : null,
          createdAt: new Date().toISOString(),
          answers: poll.questions
            .filter((question) => answerMap.has(question.id))
            .map((question) => ({ questionId: question.id, optionId: answerMap.get(question.id) }))
        });
        writeDb(db);
        broadcastAnalytics(poll.id);
        return sendJson(res, 201, { message: 'Response submitted successfully.', analytics: summarizePoll(poll) });
      }

      if (req.method === 'GET' && action === 'analytics') {
        if (!user || user.id !== poll.creatorId) return sendJson(res, 403, { error: 'Only the poll creator can view this analytics dashboard.' });
        return sendJson(res, 200, { analytics: summarizePoll(poll) });
      }

      if (req.method === 'POST' && action === 'publish') {
        if (!user || user.id !== poll.creatorId) return sendJson(res, 403, { error: 'Only the poll creator can publish results.' });
        poll.published = true;
        poll.publishedAt = new Date().toISOString();
        writeDb(db);
        broadcastAnalytics(poll.id);
        return sendJson(res, 200, { poll: safePoll(poll, true) });
      }
    }

    return sendJson(res, 404, { error: 'API route not found.' });
  } catch (error) {
    return sendJson(res, 500, { error: error.message || 'Unexpected server error.' });
  }
}

function serveStatic(req, res, pathname) {
  let filePath = pathname === '/' ? path.join(PUBLIC_DIR, 'index.html') : path.join(PUBLIC_DIR, pathname);
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) filePath = path.join(PUBLIC_DIR, 'index.html');
  const ext = path.extname(filePath);
  res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
}

const server = http.createServer((req, res) => {
  const parsed = new URL(req.url, `http://${req.headers.host}`);
  if (parsed.pathname.startsWith('/api/')) return handleApi(req, res, parsed.pathname);
  return serveStatic(req, res, parsed.pathname);
});

server.on('upgrade', (req, socket) => {
  if (req.headers.upgrade !== 'websocket') return socket.destroy();
  const key = req.headers['sec-websocket-key'];
  const accept = crypto.createHash('sha1').update(`${key}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`).digest('base64');
  socket.write([
    'HTTP/1.1 101 Switching Protocols',
    'Upgrade: websocket',
    'Connection: Upgrade',
    `Sec-WebSocket-Accept: ${accept}`,
    '',
    ''
  ].join('\r\n'));
  socket.pollIds = new Set();
  socket.on('data', (buffer) => {
    try {
      const message = JSON.parse(decodeWebSocketFrame(buffer));
      if (message.type === 'subscribe' && message.pollId) addSocketToPoll(socket, message.pollId);
    } catch (error) {
      // Ignore malformed websocket messages so one bad client does not affect live dashboards.
    }
  });
  socket.on('close', () => {
    for (const pollId of socket.pollIds) socketsByPoll.get(pollId)?.delete(socket);
  });
});

ensureDb();
server.listen(PORT, () => {
  console.log(`PollPulse running at http://localhost:${PORT}`);
});
