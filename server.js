// ============================================
// backend/server.js
// LOAD ENV FIRST - BEFORE ANY OTHER REQUIRES
// (Prisma reads process.env at require-time, so dotenv MUST run first)
// ============================================
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
const cookieParser = require('cookie-parser');

// Routes & middleware (these import Prisma indirectly, so env MUST be loaded first)
const { initializeSocket } = require('./src/sockets/socketManager');
const serviceRoutes = require('./src/routes/serviceRoutes');
const pageSettingRoutes = require('./src/routes/pageSettingRoutes');
const navigationRoutes = require('./src/routes/navigationRoutes');
const dynamicServiceRoutes = require('./src/routes/dynamicServiceRoutes');
const heroRoutes = require('./src/routes/heroRoutes');
const ragRoutes = require('./src/routes/ragRoutes');
const { trackVisitor } = require('./src/middleware/visitorTracking');
const demoRoutes = require('./src/routes/demoRoutes');

const app = express();
const server = http.createServer(app);
const io = initializeSocket(server);

// ============================================
// MIDDLEWARE - ORDER MATTERS!
// ============================================

// CORS - allow local dev + production frontend
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:4173',
    'http://localhost:5173',
    'https://turbodesksolutions.com',
    'https://www.turbodesksolutions.com',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true
}));

// Body parsers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// IMPORTANT: cookieParser MUST come BEFORE trackVisitor
app.use(cookieParser());  // ✅ First - parse cookies

// Visitor tracking - depends on cookies, skip static assets
app.use((req, res, next) => {
  // Skip tracking for static files
  if (req.path.match(/\.(css|js|jpg|jpeg|png|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
    return next();
  }
  return trackVisitor(req, res, next);
});

// Serve static files
// Serve static files with CORS headers for cross-origin image loading
const staticOptions = {
  setHeaders: (res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
  }
};
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), staticOptions));
app.use('/uploads/case-studies', express.static(path.join(__dirname, 'uploads/case-studies'), staticOptions));
// Make io accessible to routes
app.set('io', io);

// ============================================
// IMPORT REMAINING ROUTES
// ============================================
const authRoutes = require('./src/routes/authRoutes');
const contactRoutes = require('./src/routes/contactRoutes');
const careerRoutes = require('./src/routes/careerRoutes');
const caseStudyRoutes = require('./src/routes/caseStudyRoutes');
const chatbotRoutes = require('./src/routes/chatbotRoutes');
const adminRoutes = require('./src/routes/adminRoutes');

// ============================================
// API ROUTES
// ============================================
app.use('/api/auth', authRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/careers', careerRoutes);
app.use('/api/case-studies', caseStudyRoutes);
// app.use('/api/chatbot', chatbotRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/page-settings', pageSettingRoutes);
app.use('/api/navigation', navigationRoutes);
app.use('/api/dynamic-services', dynamicServiceRoutes);
app.use('/api/hero', heroRoutes);
app.use('/api/rag', ragRoutes);
app.use('/api/demo', demoRoutes);

// ============================================
// HEALTH CHECK (used by Render to verify deployment)
// ============================================
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
    dbConnected: !!process.env.DATABASE_URL
  });
});

// Root route - friendly message
app.get('/', (req, res) => {
  res.json({
    message: 'Turbo Desk API is running 🚀',
    health: '/api/health',
    docs: 'https://turbodesksolutions.com'
  });
});

// ============================================
// ERROR HANDLERS
// ============================================

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.stack);
  res.status(500).json({ error: err.message });
});

// 404 handler (MUST be last)
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found', path: req.path });
});

// ============================================
// START SERVER
// ============================================
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log('========================================');
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗄️  Database: ${process.env.DATABASE_URL ? 'Connected ✅' : 'NOT configured ❌'}`);
  console.log('========================================');
});

// Graceful shutdown (important for Render)
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});