const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authMiddleware = require('./authMiddleware');
const { sendVerificationCode } = require('../utils/email');

function generateVerificationCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function createToken(user) {
  return jwt.sign(
    { id: user._id, username: user.username },
    process.env.JWT_SECRET || 'your_jwt_secret_key_here',
    { expiresIn: '7d' }
  );
}

function formatUser(user) {
  return {
    id: user._id,
    username: user.username,
    email: user.email,
    name: user.name,
    bio: user.bio,
    avatar: user.avatar,
    header: user.header,
    followers: user.followers,
    following: user.following,
    createdAt: user.createdAt
  };
}

// @route   POST /api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', async (req, res) => {
  const { username, email, password, name } = req.body;

  // Simple validation
  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Please enter all fields' });
  }

  try {
    // Check for existing user
    let userByEmail = await User.findOne({ email: email.toLowerCase() });
    if (userByEmail) {
      if (userByEmail.emailVerified === false) {
        const code = generateVerificationCode();
        userByEmail.verificationCode = code;
        userByEmail.verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000);
        await userByEmail.save();
        await sendVerificationCode(userByEmail.email, code);
        return res.status(201).json({
          needsVerification: true,
          email: userByEmail.email,
          message: 'Verification code sent to your email'
        });
      }
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    let userByUsername = await User.findOne({ username: username.toLowerCase() });
    if (userByUsername) {
      return res.status(400).json({ message: 'Username is already taken' });
    }

    const newUser = new User({
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password,
      name: name || username
    });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    newUser.password = await bcrypt.hash(password, salt);

    const code = generateVerificationCode();
    newUser.emailVerified = false;
    newUser.verificationCode = code;
    newUser.verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000);

    await newUser.save();

    try {
      await sendVerificationCode(newUser.email, code);
    } catch (emailErr) {
      console.error('Failed to send verification email:', emailErr);
      await User.findByIdAndDelete(newUser._id);
      return res.status(500).json({ message: 'Failed to send verification email. Please try again.' });
    }

    res.status(201).json({
      needsVerification: true,
      email: newUser.email,
      message: 'Verification code sent to your email'
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/verify-email
// @desc    Verify email with 6-digit code
// @access  Public
router.post('/verify-email', async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ message: 'Email and verification code are required' });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    if (user.emailVerified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }

    if (!user.verificationCode || user.verificationCode !== String(code).trim()) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    if (!user.verificationCodeExpires || user.verificationCodeExpires < new Date()) {
      return res.status(400).json({ message: 'Verification code has expired. Please request a new one.' });
    }

    user.emailVerified = true;
    user.verificationCode = null;
    user.verificationCodeExpires = null;
    await user.save();

    const token = createToken(user);

    res.json({
      token,
      user: formatUser(user)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/resend-code
// @desc    Resend verification code
// @access  Public
router.post('/resend-code', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: 'No account found with this email' });
    }

    if (user.emailVerified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }

    const code = generateVerificationCode();
    user.verificationCode = code;
    user.verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendVerificationCode(user.email, code);

    res.json({ message: 'Verification code sent' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to send verification email' });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  const { usernameOrEmail, password } = req.body;

  if (!usernameOrEmail || !password) {
    return res.status(400).json({ message: 'Please enter all fields' });
  }

  try {
    // Check username or email
    const term = usernameOrEmail.toLowerCase();
    const user = await User.findOne({
      $or: [{ email: term }, { username: term }]
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid Username/Email or Password' });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid Username/Email or Password' });
    }

    if (user.emailVerified === false) {
      return res.status(403).json({
        message: 'Please verify your email before logging in',
        needsVerification: true,
        email: user.email
      });
    }

    const token = createToken(user);

    res.json({
      token,
      user: formatUser(user)
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/auth/me
// @desc    Get user data
// @access  Private
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/auth/change-password
// @desc    Change user password
// @access  Private
router.put('/change-password', authMiddleware, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Please provide current and new password' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'New password must be at least 6 characters' });
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
