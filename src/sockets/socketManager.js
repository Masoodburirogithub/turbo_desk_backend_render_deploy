// backend/src/sockets/socketManager.js
const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');

let io;

// ✅ Build allowed origins list from env + sensible defaults
const buildAllowedOrigins = () => {
  const origins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:4173',
    'http://localhost:5173',
    'https://aurachronsys.com',
    'https://www.aurachronsys.com',
  ];

  // Add deploy-time frontend URL if provided
  if (process.env.FRONTEND_URL) {
    origins.push(process.env.FRONTEND_URL);
  }

  // Support comma-separated list in env: FRONTEND_URLS=https://a.com,https://b.com
  if (process.env.FRONTEND_URLS) {
    process.env.FRONTEND_URLS.split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((u) => origins.push(u));
  }

  // Remove duplicates
  return [...new Set(origins)];
};

const initializeSocket = (server) => {
  const allowedOrigins = buildAllowedOrigins();

  io = socketIO(server, {
    cors: {
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, server-to-server)
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }

        console.warn(`⚠️  Socket CORS blocked origin: ${origin}`);
        return callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
      methods: ['GET', 'POST'],
    },
    // ✅ Allow both transports — Render free tier sometimes blocks instant WS upgrade
    transports: ['websocket', 'polling'],
    // Heartbeat tuning for Render (free instances sleep)
    pingInterval: 25000,
    pingTimeout: 60000,
  });

  io.on('connection', (socket) => {
    console.log('🔌 New client connected:', socket.id);

    // Join user room based on sessionId
    socket.on('join-user', (sessionId) => {
      if (!sessionId) return;
      socket.join(sessionId);
      // console.log(`User ${sessionId} joined room`);
    });

    // Admin authentication via JWT
    socket.on('admin-auth', (token) => {
      try {
        if (!token) {
          return socket.emit('admin-auth-failed', { reason: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.role === 'admin') {
          socket.join('admin-room');
          socket.isAdmin = true;
          socket.adminId = decoded.id || decoded.userId;
          socket.emit('admin-auth-success');
          console.log('✅ Admin authenticated:', socket.id);
        } else {
          socket.emit('admin-auth-failed', { reason: 'Insufficient permissions' });
        }
      } catch (error) {
        console.log('❌ Admin auth failed:', error.message);
        socket.emit('admin-auth-failed', { reason: 'Invalid token' });
      }
    });

    // User typing indicator → notify admins
    socket.on('user-typing', ({ sessionId, isTyping }) => {
      if (!sessionId) return;
      socket.to('admin-room').emit('user-typing', { sessionId, isTyping });
    });

    // Admin typing indicator → notify the specific user's room
    socket.on('admin-typing', ({ conversationId, isTyping }) => {
      if (!conversationId) return;
      socket.to(conversationId).emit('admin-typing', { isTyping });
    });

    // Optional: ping/pong for client-side connection diagnostics
    socket.on('ping-server', (cb) => {
      if (typeof cb === 'function') cb({ ok: true, time: Date.now() });
    });

    socket.on('disconnect', (reason) => {
      console.log(`🔌 Client disconnected (${socket.id}): ${reason}`);
    });

    socket.on('error', (err) => {
      console.error('Socket error:', err);
    });
  });

  console.log('✅ Socket.IO initialized. Allowed origins:', allowedOrigins);
  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized. Call initializeSocket(server) first.');
  }
  return io;
};

// Helper utilities for emitting from anywhere in the app
const emitToAdmins = (event, data) => {
  getIO().to('admin-room').emit(event, data);
};

const emitToUser = (sessionId, event, data) => {
  if (!sessionId) return;
  getIO().to(sessionId).emit(event, data);
};

module.exports = {
  initializeSocket,
  getIO,
  emitToAdmins,
  emitToUser,
};