const express = require('express');

const router = express.Router();

const Post = require('../models/Post');
const Comment = require('../models/Comment');

const authMiddleware =
  require('./authMiddleware');


// ============================================================
// GET /api/analytics/summary
// ============================================================

router.get(
  '/summary',
  authMiddleware,
  async (req, res) => {
    try {

      // Find all posts created by
      // the currently logged-in user.
      const userPosts =
        await Post.find({
          author: req.user.id
        }).select('_id stressScore');

      const postIds =
        userPosts.map(
          (post) => post._id
        );


      // ======================================================
      // OVERALL STRESS SCORE
      // ======================================================

      const validStressScores =
        userPosts
          .map(
            (post) =>
              Number(
                post.stressScore
              )
          )
          .filter(
            (score) =>
              Number.isFinite(score)
          );

      const totalPosts =
        userPosts.length;

      const analyzedPosts =
        validStressScores.length;

      let overallStressScore =
        null;

      if (
        analyzedPosts > 0
      ) {

        const stressTotal =
          validStressScores.reduce(
            (total, score) =>
              total + score,
            0
          );

        overallStressScore =
          Number(
            (
              stressTotal /
              analyzedPosts
            ).toFixed(2)
          );
      }


      // ======================================================
      // SENTIMENT BREAKDOWN
      // Comments received on the user's posts
      // ======================================================

      let comments = [];

      if (
        postIds.length > 0
      ) {

        comments =
          await Comment.find({
            post: {
              $in: postIds
            },

            sentimentLabel: {
              $ne: ''
            },

            confidenceScore: {
              $ne: null
            }
          }).select(
            'sentimentLabel confidenceScore'
          );
      }


      const sentimentCounts = {
        positive: 0,
        neutral: 0,
        negative: 0
      };


      comments.forEach(
        (comment) => {

          const sentiment =
            String(
              comment.sentimentLabel ||
              ''
            )
              .trim()
              .toLowerCase();

          if (
            sentiment === 'positive'
          ) {

            sentimentCounts.positive++;

          } else if (
            sentiment === 'neutral'
          ) {

            sentimentCounts.neutral++;

          } else if (
            sentiment === 'negative'
          ) {

            sentimentCounts.negative++;

          }

        }
      );


      const totalAnalyzedComments =
        sentimentCounts.positive +
        sentimentCounts.neutral +
        sentimentCounts.negative;


      let positivePercentage = 0;
      let neutralPercentage = 0;
      let negativePercentage = 0;


      if (
        totalAnalyzedComments > 0
      ) {

        positivePercentage =
          Number(
            (
              sentimentCounts.positive /
              totalAnalyzedComments *
              100
            ).toFixed(2)
          );

        neutralPercentage =
          Number(
            (
              sentimentCounts.neutral /
              totalAnalyzedComments *
              100
            ).toFixed(2)
          );

        negativePercentage =
          Number(
            (
              sentimentCounts.negative /
              totalAnalyzedComments *
              100
            ).toFixed(2)
          );

      }


      // ======================================================
      // RETURN DASHBOARD DATA
      // ======================================================

      res.json({

        stress: {
          score:
            overallStressScore,

          totalPosts:
            totalPosts,

          analyzedPosts:
            analyzedPosts
        },

        sentiment: {

          positive:
            positivePercentage,

          neutral:
            neutralPercentage,

          negative:
            negativePercentage,

          totalComments:
            totalAnalyzedComments,

          counts:
            sentimentCounts
        }

      });

    } catch (err) {

      console.error(
        'Analytics error:',
        err
      );

      res.status(500).json({
        message:
          'Failed to load analytics summary'
      });

    }
  }
);


module.exports = router;