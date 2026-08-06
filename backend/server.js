require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

// ============================================================
// ROUTES
// ============================================================

const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');
const commentRoutes = require('./routes/comments');
const userRoutes = require('./routes/users');
const analyticsRoutes = require('./routes/analytics');


// ============================================================
// EXPRESS APP
// ============================================================

const app = express();


// ============================================================
// MIDDLEWARE
// ============================================================

app.use(cors());

app.use(
  express.json({
    limit: '5mb'
  })
);


// ============================================================
// DATABASE CONNECTION
// ============================================================

// This variable helps prevent creating
// multiple MongoDB connections.
let isConnected = false;


const connectDB = async () => {

  // If MongoDB is already connected,
  // do not create another connection.
  if (
    isConnected ||
    mongoose.connection.readyState >= 1
  ) {

    isConnected = true;

    return;
  }


  const MONGODB_URI =
    process.env.MONGODB_URI;


  // Check whether the MongoDB URI exists.
  if (!MONGODB_URI) {

    console.warn(
      'WARNING: MONGODB_URI is not defined ' +
      'in environment variables.'
    );

    return;
  }


  try {

    await mongoose.connect(
      MONGODB_URI
    );

    isConnected = true;

    console.log(
      'MongoDB Connected successfully'
    );

  } catch (err) {

    console.error(
      'Database connection failed:',
      err.message
    );

  }

};


// ============================================================
// ENSURE DATABASE CONNECTION
// ============================================================

// This middleware checks the database
// connection before processing requests.
app.use(
  async (
    req,
    res,
    next
  ) => {

    await connectDB();

    next();

  }
);


// ============================================================
// ROOT ROUTE
// ============================================================

app.get(
  '/',
  (
    req,
    res
  ) => {

    res.json({

      status:
        'OK',

      message:
        'SENTIO Backend API is running smoothly on Vercel'

    });

  }
);


// ============================================================
// API ROUTES
// ============================================================

app.use(
  '/api/auth',
  authRoutes
);


app.use(
  '/api/posts',
  postRoutes
);


app.use(
  '/api/comments',
  commentRoutes
);


app.use(
  '/api/users',
  userRoutes
);


// New dashboard analytics route
app.use(
  '/api/analytics',
  analyticsRoutes
);


// ============================================================
// HEALTH CHECK
// ============================================================

app.get(
  '/api/health',
  (
    req,
    res
  ) => {

    res.json({

      status:
        'OK',

      message:
        'SENTIO API is running smoothly on Vercel'

    });

  }
);


// ============================================================
// PORT CONFIGURATION
// ============================================================

const PORT =
  process.env.PORT ||
  5000;


// ============================================================
// START SERVER
// ============================================================

// Start the server only when
// not running on Vercel.
if (
  !process.env.VERCEL
) {

  app.listen(
    PORT,
    () => {

      console.log(
        `Server is running on port ${PORT}`
      );

    }
  );

}


// ============================================================
// EXPORT APP
// ============================================================

module.exports = app;