const express = require('express');

const router = express.Router();

const Comment = require('../models/Comment');
const Post = require('../models/Post');
const authMiddleware = require('./authMiddleware');

const {
  analyzeSentiment
} = require('../services/aiService');

function normalizeSentimentLabel(sentiment) {
  const raw = String(sentiment || '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');

  if (raw === 'label_0' || raw === 'negative') {
    return 'negative';
  }
  if (raw === 'label_1' || raw === 'neutral') {
    return 'neutral';
  }
  if (raw === 'label_2' || raw === 'label_3' || raw === 'positive') {
    return 'positive';
  }
  return raw;
}


// ============================================================
// GET COMMENTS FOR POST
// ============================================================

router.get(
  '/post/:postId',
  async (req, res) => {

    try {

      const comments = await Comment.find({
        post: req.params.postId
      })
        .populate(
          'author',
          'username name avatar'
        )
        .sort({
          createdAt: 1
        });

      const normalizedComments = comments.map((comment) => {
        const obj = comment.toObject ? comment.toObject() : comment;
        return {
          ...obj,
          sentimentLabel: normalizeSentimentLabel(obj.sentimentLabel)
        };
      });

      res.json(normalizedComments);

    } catch (err) {

      console.error(
        'Error fetching comments:',
        err
      );

      res.status(500).json({
        message: 'Server error'
      });

    }

  }
);


// ============================================================
// CREATE COMMENT
// ============================================================

router.post(
  '/',
  authMiddleware,
  async (req, res) => {

    const {
      postId,
      content
    } = req.body;


    // ========================================================
    // VALIDATE CONTENT
    // ========================================================

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


    // ========================================================
    // VALIDATE POST
    // ========================================================

    try {

      const postExists =
        await Post.findById(postId);

      if (!postExists) {

        return res.status(404).json({
          message:
            'Post not found'
        });

      }


      const cleanedContent =
        content.trim();


      // ======================================================
      // AI SENTIMENT ANALYSIS
      // ======================================================

      let sentimentResult = null;

      try {

        sentimentResult =
          await analyzeSentiment(
            cleanedContent
          );


        console.log(
          '=============================='
        );

        console.log(
          'COMMENT AI RESULT:'
        );

        console.log(
          sentimentResult
        );

        console.log(
          'Sentiment:',
          sentimentResult?.sentiment
        );

        console.log(
          'Confidence:',
          sentimentResult?.confidence
        );

        console.log(
          '=============================='
        );

      } catch (aiError) {

        console.error(
          'Comment AI analysis failed:',
          aiError.message
        );

      }


      // ======================================================
      // NORMALIZE SENTIMENT
      // ======================================================

      const sentimentLabel =
        normalizeSentimentLabel(
          sentimentResult?.sentiment
        );


      const confidenceScore =
        sentimentResult?.confidence !==
        undefined &&
        sentimentResult?.confidence !==
        null

          ? Number(
              sentimentResult.confidence
            )

          : null;


      // ======================================================
      // SAVE COMMENT
      // ======================================================

      const newComment =
        new Comment({

          post:
            postId,

          author:
            req.user.id,

          content:
            cleanedContent,

          sentimentLabel:
            sentimentLabel,

          confidenceScore:
            confidenceScore

        });


      const savedComment =
        await newComment.save();


      // ======================================================
      // DATABASE DEBUG
      // ======================================================

      console.log(
        '=============================='
      );

      console.log(
        'COMMENT SAVED TO DATABASE'
      );

      console.log(
        'Comment ID:',
        savedComment._id
      );

      console.log(
        'Post ID:',
        savedComment.post
      );

      console.log(
        'Author ID:',
        savedComment.author
      );

      console.log(
        'Content:',
        savedComment.content
      );

      console.log(
        'Sentiment Label:',
        savedComment.sentimentLabel
      );

      console.log(
        'Confidence:',
        savedComment.confidenceScore
      );

      console.log(
        '=============================='
      );


      // ======================================================
      // VERIFY COMMENT DIRECTLY FROM DATABASE
      // ======================================================

      const verifyComment =
        await Comment.findById(
          savedComment._id
        ).select(
          '_id post author content sentimentLabel confidenceScore createdAt'
        );


      console.log(
        '=============================='
      );

      console.log(
        'DATABASE VERIFICATION'
      );

      console.log(
        verifyComment
      );

      console.log(
        '=============================='
      );


      // ======================================================
      // POPULATE AUTHOR
      // ======================================================

      const populatedComment =
        await Comment.findById(
          savedComment._id
        ).populate(
          'author',
          'username name avatar'
        );


      // ======================================================
      // RETURN COMMENT
      // ======================================================

      res.status(201).json(
        populatedComment
      );


    } catch (err) {

      console.error(
        'Comment creation error:',
        err
      );

      res.status(500).json({
        message:
          'Server error while creating comment'
      });

    }

  }
);


module.exports = router;