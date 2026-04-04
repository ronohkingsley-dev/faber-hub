// ══════════════════════════════════════════════════════
//  FABER.NET · backend/server.js — Express Entry Point
// ══════════════════════════════════════════════════════
require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const fs      = require('fs');

const app  = express();
const PORT = process.env.PORT || 4000;

// ─── ENSURE UPLOAD DIRECTORIES EXIST ─────────────────────────────────────────
['post', 'market', 'story', 'reel', 'tutorial', 'misc'].forEach(type => {
  const dir = path.join(__dirname, 'uploads', type);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// ─── MIDDLEWARE ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: (origin, cb) => {
    // Allow any localhost origin (any port) + no-origin requests (Postman, curl)
    if (!origin || /^http:\/\/localhost:\d+$/.test(origin) || origin.endsWith('netlify.app')) return cb(null, true);
    cb(new Error('CORS blocked: ' + origin));
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── ROUTES ──────────────────────────────────────────────────────────────────
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/posts',     require('./routes/posts'));
app.use('/api/market',    require('./routes/marketplace'));
app.use('/api/stories',   require('./routes/stories'));
app.use('/api/reels',     require('./routes/reels'));
app.use('/api/tutorials', require('./routes/tutorials'));
app.use('/api/upload',    require('./routes/upload'));
app.use('/api/admin',     require('./routes/admin'));
app.use('/api/pay',       require('./routes/pay'));
app.use('/api/reports',   require('./routes/reports'));

// ─── INLINE ENDPOINTS ────────────────────────────────────────────────────────
const authenticate = require('./middleware/auth');
const DB           = require('./db');
const { v4: uuid } = require('uuid');

// Notifications
app.get('/api/notifications', authenticate, (req, res) => res.json(DB.getNotifications(req.user.id)));
app.patch('/api/notifications/:id/read', authenticate, (req, res) => { DB.markRead(req.params.id, req.user.id); res.json({ ok: true }); });
app.patch('/api/notifications/read-all', authenticate, (req, res) => { DB.markAllRead(req.user.id); res.json({ ok: true }); });

// User profile
app.get('/api/users/:id', (req, res) => {
  const user = DB.findUserById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const stats = DB.getUserStats(req.params.id);
  res.json({ ...DB.sanitizeUser(user), ...stats });
});

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'OK', timestamp: new Date().toISOString() }));




// ─── ERROR HANDLER ────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// ─── START SERVER & SOCKET.IO ──────────────────────────────────────────────────
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// A basic in-memory messaging and calling registry
const activeUsers = {}; // socket.id -> uid

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  socket.on('register', (uid) => {
    activeUsers[uid] = socket.id;
    socket.uid = uid;
    io.emit('presence', Object.keys(activeUsers));
  });

  socket.on('disconnect', () => {
    if (socket.uid) { delete activeUsers[socket.uid]; io.emit('presence', Object.keys(activeUsers)); }
  });

  // Messenger logic
  socket.on('send_message', (payload) => {
    // payload: { to: uid, text, from: uid }
    const targetSocket = activeUsers[payload.to];
    if (targetSocket) {
      io.to(targetSocket).emit('receive_message', payload);
    }
  });

  // Call Signaling (Audio call ring/reject/accept logic before PeerJS takes over)
  socket.on('call_user', (data) => {
    const target = activeUsers[data.to];
    if (target) io.to(target).emit('incoming_call', { from: socket.uid, signal: data.signal });
  });

  socket.on('answer_call', (data) => {
    const target = activeUsers[data.to];
    if (target) io.to(target).emit('call_answered', data.signal);
  });
  
  socket.on('end_call', (data) => {
    const target = activeUsers[data.to];
    if (target) io.to(target).emit('call_ended');
  });
});

// ─── SERVE FRONTEND (PRODUCTION / LOCAL TUNNEL) ────────────────────────────────
const distPath = path.join(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send('API is running. (Frontend not built)');
  });
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n======================================================`);
  console.log(`[FABER.NET] BACKEND CORE DEPLOYED IN ${process.env.NODE_ENV || 'DEV'} MODE`);
  console.log(`[FABER.NET] RUNNING AT HTTP://LOCALHOST:${PORT}`);
  console.log(`======================================================\n`);
});

module.exports = app;
