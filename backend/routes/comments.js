const express = require('express');

const router = express.Router();

const Comment =
  require('../models/Comment');

const Post =
  require('../models/Post');

const authMiddleware =
  require('./authMiddleware');

const {
  analyzeSentiment
} = require('../services/aiService');

// ============================================================
// GET /api/comments/post/:postId
// ============================================================

router.get(
  '/post/:postId',
  async (req, res) => {
    try {
      const comments =
        await Comment.find({
          post: req.params.postId
        })
          .populate(
            'author',
            'username name avatar'
          )
          .sort({
            createdAt: 1
          });

      res.json(comments);

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
// POST /api/comments
// Create comment and analyze sentiment
// ============================================================

router.post(
  '/',
  authMiddleware,
  async (req, res) => {
    const {
      postId,
      content
    } = req.body;

    if (
      !content ||
      typeof content !== 'string' ||
      content.trim() === ''
    ) {
      return res.status(400).json({
        message:
          'Comment content cannot be empty'
      });
    }

    try {
      const postExists =
        await Post.findById(
          postId
        );

      if (!postExists) {
        return res.status(404).json({
          message:
            'Post not found'
        });
      }

      const cleanedContent =
        content.trim();

      // Send comment to Flask AI service
      const sentimentResult =
        await analyzeSentiment(
          cleanedContent
        );

      const newComment =
        new Comment({
          post:
            postId,

          author:
            req.user.id,

          content:
            cleanedContent,

          sentimentLabel:
            sentimentResult.sentiment,

          confidenceScore:
            sentimentResult.confidence
        });

      const savedComment =
        await newComment.save();

      const populatedComment =
        await Comment.findById(
          savedComment._id
        ).populate(
          'author',
          'username name avatar'
        );

      res.status(201).json(
        populatedComment
      );

    } catch (err) {
      console.error(err);

      res.status(500).json({
        message:
          'Server error while creating comment'
      });
    }
  }
);

module.exports = router;