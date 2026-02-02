const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Allowed origins
const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL]
  : [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'http://127.0.0.1:5500',
    'http://localhost:5500'
  ];

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Make io accessible to routes
app.set('io', io);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Join organization room
  socket.on('join-organisation', (orgId) => {
    socket.join(`org-${orgId}`);
    console.log(`Socket ${socket.id} joined org-${orgId}`);
  });

  // Join queue room
  socket.on('join-queue', (queueId) => {
    socket.join(`queue-${queueId}`);
    console.log(`Socket ${socket.id} joined queue-${queueId}`);
  });

  // Join token room (for individual tracking)
  socket.on('join-token', (tokenId) => {
    socket.join(`token-${tokenId}`);
    console.log(`Socket ${socket.id} joined token-${tokenId}`);
  });

  // Leave rooms
  socket.on('leave-organisation', (orgId) => {
    socket.leave(`org-${orgId}`);
  });

  socket.on('leave-queue', (queueId) => {
    socket.leave(`queue-${queueId}`);
  });

  socket.on('leave-token', (tokenId) => {
    socket.leave(`token-${tokenId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Test route
app.get('/', (req, res) => {
  res.json({
    message: 'Q-Ease API is running!',
    version: '1.0.0',
    status: 'healthy'
  });
});

// Health check route
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Import routes
const authRoutes = require('./routes/authRoutes');
const organisationRoutes = require('./routes/organisationRoutes');
const queueRoutes = require('./routes/queueRoutes');
const tokenRoutes = require('./routes/tokenRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const { authenticateToken } = require('./middleware/authMiddleware');
const systemAuth = require('./middleware/systemAuthMiddleware');
const { createTenant } = require('./controllers/systemAdminController');
const { createAdmin, getMyAdmins } = require('./controllers/superUserController');
const usersRoutes = require('./routes/users');
const qrCodeRoutes = require('./routes/qrCodeRoutes');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/organisations', organisationRoutes);
app.use('/api/queues', queueRoutes);
app.use('/api/tokens', tokenRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/qr', qrCodeRoutes);

// System routes
app.post('/api/system/create-tenant', systemAuth, createTenant);

// Super Admin routes
app.post('/api/super/admins', authenticateToken, createAdmin);
app.get('/api/super/admins', authenticateToken, getMyAdmins);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);

  // Prisma errors
  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      message: 'A record with this value already exists',
      field: err.meta?.target
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      message: 'Record not found'
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired'
    });
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: err.errors
    });
  }

  // Default error
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.IO enabled`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API URL: http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

module.exports = app;


