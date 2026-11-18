const express = require('express');

const router = express.Router();

const Post = require('../models/Post');
const Comment = require('../models/Comment');

const authMiddleware =
  require('./authMiddleware');

// ============================================================
// COMMENT SENTIMENT → STRESS IMPACT
// ============================================================

function normalizeSentimentLabel(sentiment) {
  const raw = String(sentiment || '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');

  if (raw === 'label_0' || raw === '0' || raw === 'negative') {
    return 'negative';
  }
  if (raw === 'label_1' || raw === '1' || raw === 'neutral') {
    return 'neutral';
  }
  if (raw === 'label_2' || raw === 'label_3' || raw === '2' || raw === '3' || raw === 'positive') {
    return 'positive';
  }
  return raw;
}

function getSentimentStressImpact(
  sentiment,
  confidence
) {

  const normalized =
    normalizeSentimentLabel(sentiment);

  const confidenceScore =
    Number(confidence);

  if (
    !Number.isFinite(confidenceScore) ||
    confidenceScore < 0 ||
    confidenceScore > 100
  ) {
    return null;
  }

  if (normalized === 'negative') {
    return 50 + (confidenceScore / 2);
  }

  if (normalized === 'neutral') {
    return 50;
  }

  if (normalized === 'positive') {
    return 50 - (confidenceScore / 2);
  }

  return null;
}

// ============================================================
// CALCULATE COMMENT IMPACT
// ============================================================

function calculateCommentImpact(comments) {

  const impacts = [];

  comments.forEach((comment) => {

    const impact =
      getSentimentStressImpact(
        comment.sentimentLabel,
        comment.confidenceScore
      );

    if (impact !== null) {
      impacts.push(impact);
    }

  });

  if (impacts.length === 0) {
    return null;
  }

  const total =
    impacts.reduce(
      (sum, value) =>
        sum + value,
      0
    );

  return Number(
    (
      total / impacts.length
    ).toFixed(2)
  );
}

// ============================================================
// POST STRESS ONLY (NO COMMENT SENTIMENT FUSION)
// ============================================================

function calculateFinalStress(
  postStress
) {

  if (
    postStress === null ||
    postStress === undefined ||
    !Number.isFinite(
      Number(postStress)
    )
  ) {
    return null;
  }

  return Number(
    Number(postStress).toFixed(2)
  );
}

// ============================================================
// GET /api/analytics/summary
// ============================================================

router.get(
  '/summary',
  authMiddleware,
  async (req, res) => {

    try {

      // ======================================================
      // USER POSTS (SORTED NEWEST FIRST)
      // ======================================================

      const userPosts =
        await Post.find({
          author: req.user.id
        })
          .select(
            '_id stressScore stressLabel createdAt'
          )
          .sort({
            createdAt: -1
          });

      const postIds =
        userPosts.map(
          post => post._id
        );

      // ======================================================
      // GET COMMENTS FOR ALL POSTS
      // ======================================================

      let comments = [];

      if (postIds.length > 0) {

        const rawComments =
          await Comment.find({
            post: {
              $in: postIds
            }
          }).select(
            'post sentimentLabel confidenceScore'
          );

        comments = rawComments.filter(c => {
          const label = normalizeSentimentLabel(c.sentimentLabel);
          return label === 'positive' || label === 'neutral' || label === 'negative';
        });

      }

      // ======================================================
      // GROUP COMMENTS BY POST
      // ======================================================

      const commentsByPost = {};

      comments.forEach(
        comment => {

          const postId =
            String(comment.post);

          if (
            !commentsByPost[postId]
          ) {

            commentsByPost[postId] =
              [];

          }

          commentsByPost[postId]
            .push(comment);

        }
      );

      // ======================================================
      // FINAL STRESS FOR EACH POST
      // ======================================================

      const finalStressScores = [];

      const postAnalytics = [];

      userPosts.forEach(
        post => {

          const postId =
            String(post._id);

          const postComments =
            commentsByPost[postId] ||
            [];

          const postSentimentCounts = {
            positive: 0,
            neutral: 0,
            negative: 0
          };

          postComments.forEach(c => {
            const s = normalizeSentimentLabel(c.sentimentLabel);
            if (s === 'positive') postSentimentCounts.positive++;
            else if (s === 'neutral') postSentimentCounts.neutral++;
            else if (s === 'negative') postSentimentCounts.negative++;
          });

          const finalStress =
            calculateFinalStress(
              post.stressScore
            );

          if (
            finalStress !== null
          ) {

            finalStressScores.push(
              finalStress
            );

          }

          postAnalytics.push({

            postId:
              post._id,

            createdAt:
              post.createdAt,

            stressLabel:
              post.stressLabel || '',

            postStressScore:
              finalStress,

            finalStressScore:
              finalStress,

            analyzedComments:
              postComments.length,

            sentimentCounts:
              postSentimentCounts

          });

        }
      );

      // ======================================================
      // OVERALL FINAL STRESS
      // ======================================================

      let overallStressScore =
        null;

      if (
        finalStressScores.length > 0
      ) {

        const total =
          finalStressScores.reduce(
            (sum, score) =>
              sum + score,
            0
          );

        overallStressScore =
          Number(
            (
              total /
              finalStressScores.length
            ).toFixed(2)
          );

      }

      // ======================================================
      // OVERALL COMMENT SENTIMENT
      // ======================================================

      const sentimentCounts = {

        positive: 0,
        neutral: 0,
        negative: 0

      };

      comments.forEach(
        comment => {

          const sentiment =
            normalizeSentimentLabel(
              comment.sentimentLabel
            );

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
      // RESPONSE
      // ======================================================

      res.json({

        stress: {

          score:
            overallStressScore,

          totalPosts:
            userPosts.length,

          analyzedPosts:
            finalStressScores.length

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

        },

        posts:
          postAnalytics

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