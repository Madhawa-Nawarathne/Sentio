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

// Routes middleware
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/users', userRoutes);

// Basic health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'SENTIO API is running smoothly' });
});

// Port and DB connection configuration
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.warn('WARNING: MONGODB_URI is not defined in the environment variables.');
  console.warn('The server will start but won\'t be able to connect to the database.');
}

// Connect to MongoDB
mongoose.connect(MONGODB_URI || 'mongodb://localhost:27017/sentio')
  .then(() => {
    console.log('MongoDB Connected successfully');
    // Start listening only after successful connection (or log it)
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Database connection failed:', err.message);
    console.log('Ensure you have provided a valid MONGODB_URI and your IP address is whitelisted in MongoDB Atlas.');
    // Start the server anyway to allow setup troubleshooting
    app.listen(PORT, () => {
      console.log(`Server running with DB error fallback on port ${PORT}`);
    });
  });
