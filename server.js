require('dotenv').config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const studentRoutes = require('./routes/students');
const feeRoutes = require('./routes/fees');
const notificationRoutes = require('./routes/notifications');

const app = express();

// DB connect
connectDB();

app.use(cors({
  origin: [
    "http://localhost:5000",
    "http://localhost:5173",
    "http://localhost:5174",
    "https://feesmanagementfrontend.onrender.com"
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Custom JSON parser that handles malformed JSON
app.use((req, res, next) => {
  if (req.headers['content-type'] === 'application/json' || req.headers['content-type']?.includes('application/json')) {
    let data = '';
    req.on('data', chunk => data += chunk);
    req.on('end', () => {
      try {
        req.body = JSON.parse(data);
      } catch (e) {
        // If JSON parsing fails and it's a number, treat as phone
        if (/^\d+$/.test(data.trim())) {
          req.body = { phone: data.trim() };
        } else {
          req.body = { message: data };
        }
      }
      next();
    });
  } else {
    express.json()(req, res, next);
  }
});
app.use(express.text());
app.use(express.urlencoded({ extended: true }));

// Test route
app.get('/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/notifications', notificationRoutes);

// Global error handler
app.use((error, req, res, next) => {
  // console.error('Global error:', {
  //   message: error.message,
  //   stack: error.stack,
  //   url: req.originalUrl,
  //   method: req.method,
  //   body: req.body
  // });
  res.status(500).json({ 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  // console.log(`Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ message: `Cannot ${req.method} ${req.originalUrl}` });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  // console.error('Unhandled Promise Rejection:', err);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  // console.error('Uncaught Exception:', err);
  process.exit(1);
});

const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, () => {
  // console.log(`Server running on port ${PORT}`);
});

// Handle server errors
server.on('error', (error) => {
  // console.error('Server error:', error);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  // console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    // console.log('Process terminated');
  });
});
