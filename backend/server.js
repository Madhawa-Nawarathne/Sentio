require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');
const commentRoutes = require('./routes/comments');
const userRoutes = require('./routes/users');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Database connection helper for Vercel Serverless
let isConnected = false;
const connectDB = async () => {
  if (isConnected || mongoose.connection.readyState >= 1) {
    isConnected = true;
    return;
  }
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    console.warn('WARNING: MONGODB_URI is not defined in environment variables.');
    return;
  }
  try {
    await mongoose.connect(MONGODB_URI);
    isConnected = true;
    console.log('MongoDB Connected successfully');
  } catch (err) {
    console.error('Database connection failed:', err.message);
  }
};

// Ensure DB connection before processing routes
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

// Root welcome & status route
app.get('/', (req, res) => {
  res.json({ status: 'OK', message: 'SENTIO Backend API is running smoothly on Vercel' });
});

// Routes middleware
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/users', userRoutes);

// Basic health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'SENTIO API is running smoothly on Vercel' });
});

// Port configuration
const PORT = process.env.PORT || 5000;

// Start server if not running in Vercel serverless environment
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;

