const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
require('dotenv').config();
const config = require('./config');
const FeedbackDatabase = require('./database');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Debug: Check if ADMIN_TOKEN is loaded
console.log('ADMIN_TOKEN loaded:', process.env.ADMIN_TOKEN ? '✓ YES' : '✗ NO');
console.log('ADMIN_TOKEN value:', process.env.ADMIN_TOKEN ? '[HIDDEN]' : 'undefined');

// Initialize Express app
const app = express();

// Initialize database
const db = new FeedbackDatabase();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: config.SECURITY.contentSecurityPolicy,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'no-referrer' }
}));

// Disable powered-by header
app.disable('x-powered-by');

// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api', require('./routes/feedback')(db));
app.use('/api/admin', require('./routes/admin')(db));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// 404 handler
app.use(notFoundHandler);

// Error handling middleware (must be last)
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    db.close();
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  db.close();
  process.exit(0);
});

// Start server
const server = app.listen(config.PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║   Anonymous Feedback System                                ║
║   Privacy-First • Secure • Production-Ready                ║
╚════════════════════════════════════════════════════════════╝

🚀 Server running on http://localhost:${config.PORT}
📝 User Interface: http://localhost:${config.PORT}
🔐 Admin Dashboard: http://localhost:${config.PORT}/admin
🏥 Health Check: http://localhost:${config.PORT}/health

🔒 Privacy Guarantees:
   ✓ No authentication required for submissions
   ✓ No IP logging or tracking
   ✓ No cookies or fingerprinting
   ✓ Rate-limited to prevent abuse
   ✓ Input sanitization enabled

⚠️  Remember to change ADMIN_TOKEN in production!
  `);
});

module.exports = app;
