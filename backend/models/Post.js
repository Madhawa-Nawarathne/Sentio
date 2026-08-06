const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  content: {
    type: String,
    required: true,
    trim: true
  },

  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  // Final calculated stress percentage
  stressScore: {
    type: Number,
    default: null
  },

  // Emotion detected by the AI model
  stressLabel: {
    type: String,
    default: ''
  },

  // AI model confidence for the detected emotion
  emotionConfidence: {
    type: Number,
    default: null
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model(
  'Post',
  PostSchema
);