const express = require('express');
const router = express.Router();

const Post = require('../models/Post');
const Comment = require('../models/Comment');
const authMiddleware = require('./authMiddleware');

const {
  analyzeEmotion
} = require('../services/aiService');


// ============================================================
// STRESS SCORE CALCULATION
// ============================================================

function calculateStressScore(
  emotion,
  confidence
) {
  // Estimated stress association for each emotion.
  // 0 = very low stress association
  // 100 = very high stress association
  const stressWeights = {
    anger: 85,
    annoyance: 55,
    disappointment: 65,
    disapproval: 55,
    disgust: 60,
    embarrassment: 60,
    fear: 90,
    grief: 95,
    nervousness: 90,
    remorse: 65,
    sadness: 80,

    confusion: 50,
    realization: 40,
    surprise: 35,
    curiosity: 20,

    neutral: 25,

    admiration: 5,
    amusement: 5,
    approval: 5,
    caring: 10,
    desire: 15,
    excitement: 10,
    gratitude: 5,
    joy: 5,
    love: 5,
    optimism: 5,
    pride: 5,
    relief: 5
  };

  const normalizedEmotion =
    String(emotion || '')
      .toLowerCase()
      .trim();

  const emotionStressWeight =
    stressWeights[
      normalizedEmotion
    ] ?? 30;

  const modelConfidence =
    Number(confidence) || 0;

  const stressScore =
    (
      emotionStressWeight *
      modelConfidence
    ) / 100;

  return Math.round(
    stressScore * 100
  ) / 100;
}


// ============================================================
// GET /api/posts
// ============================================================

router.get(
  '/',
  authMiddleware,
  async (req, res) => {
    try {
      const User = require(
        '../models/User'
      );

      const currentUser =
        await User.findById(
          req.user.id
        ).select('following');

      if (!currentUser) {
        return res.status(404).json({
          message: 'User not found'
        });
      }

      const authorIds = [
        ...currentUser.following,
        currentUser._id
      ];

      const posts = await Post.find({
        author: {
          $in: authorIds
        }
      })
        .populate(
          'author',
          'username name avatar'
        )
        .sort({
          createdAt: -1
        });

      res.json(posts);

    } catch (err) {
      console.error(err);

      res.status(500).json({
        message: 'Server error'
      });
    }
  }
);


// ============================================================
// POST /api/posts
// ============================================================

router.post(
  '/',
  authMiddleware,
  async (req, res) => {
    const { content } = req.body;

    if (
      !content ||
      content.trim() === ''
    ) {
      return res.status(400).json({
        message:
          'Post content cannot be empty'
      });
    }

    try {
      let emotionResult = null;

      try {
        emotionResult =
          await analyzeEmotion(
            content.trim()
          );

      } catch (aiError) {
        console.error(
          'AI emotion analysis failed:',
          aiError.message
        );
      }

      // Calculate the final stress score
      const calculatedStressScore =
        emotionResult
          ? calculateStressScore(
              emotionResult.emotion,
              emotionResult.confidence
            )
          : null;

      const newPost = new Post({
        author: req.user.id,

        content:
          content.trim(),

        // Save detected emotion
        stressLabel:
          emotionResult
            ? emotionResult.emotion
            : '',

        // Save AI confidence separately
        emotionConfidence:
          emotionResult
            ? emotionResult.confidence
            : null,

        // Save calculated stress score separately
        stressScore:
          calculatedStressScore
      });

      const savedPost =
        await newPost.save();

      const populatedPost =
        await Post.findById(
          savedPost._id
        ).populate(
          'author',
          'username name avatar'
        );

      res.status(201).json({
        ...populatedPost.toObject(),

        aiAnalysis: emotionResult
          ? {
              status: 'completed',

              emotion:
                emotionResult.emotion,

              confidence:
                emotionResult.confidence,

              stressScore:
                calculatedStressScore,

              top_predictions:
                emotionResult
                  .top_predictions
            }
          : {
              status: 'unavailable'
            }
      });

    } catch (err) {
      console.error(err);

      res.status(500).json({
        message: 'Server error'
      });
    }
  }
);


// ============================================================
// POST /api/posts/:id/like
// ============================================================

router.post(
  '/:id/like',
  authMiddleware,
  async (req, res) => {
    try {
      const post =
        await Post.findById(
          req.params.id
        );

      if (!post) {
        return res.status(404).json({
          message:
            'Post not found'
        });
      }

      const likeIndex =
        post.likes.indexOf(
          req.user.id
        );

      if (likeIndex > -1) {
        post.likes.splice(
          likeIndex,
          1
        );

      } else {
        post.likes.push(
          req.user.id
        );
      }

      await post.save();

      res.json(post);

    } catch (err) {
      console.error(err);

      res.status(500).json({
        message:
          'Server error'
      });
    }
  }
);


// ============================================================
// DELETE /api/posts/:id
// ============================================================

router.delete(
  '/:id',
  authMiddleware,
  async (req, res) => {
    try {
      const post =
        await Post.findById(
          req.params.id
        );

      if (!post) {
        return res.status(404).json({
          message:
            'Post not found'
        });
      }

      if (
        post.author.toString() !==
        req.user.id
      ) {
        return res.status(401).json({
          message:
            'User not authorized ' +
            'to delete this post'
        });
      }

      await Comment.deleteMany({
        post: post._id
      });

      await Post.findByIdAndDelete(
        req.params.id
      );

      res.json({
        message:
          'Post removed'
      });

    } catch (err) {
      console.error(err);

      res.status(500).json({
        message:
          'Server error'
      });
    }
  }
);


module.exports = router;