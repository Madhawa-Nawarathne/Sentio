const express = require('express');

const router = express.Router();

const Post = require('../models/Post');
const Comment = require('../models/Comment');
const authMiddleware = require('./authMiddleware');

const {
  analyzeEmotion,
  analyzeStress
} = require('../services/aiService');


// ============================================================
// COMMENT SENTIMENT → STRESS IMPACT
// ============================================================
//
// Probability-based methodology:
//
// Negative:
//   Stress impact = P(negative)
//
// Neutral:
//   Stress impact = 50
//
// Positive:
//   Stress impact = 100 - P(positive)
//
// ============================================================

function getSentimentStressImpact(sentiment, confidence) {

  const normalizedSentiment =
    String(sentiment || '')
      .trim()
      .toLowerCase();

  const confidenceScore =
    Number(confidence);

  if (
    !Number.isFinite(confidenceScore) ||
    confidenceScore < 0 ||
    confidenceScore > 100
  ) {
    return null;
  }

  switch (normalizedSentiment) {

    case 'negative':
      return confidenceScore;

    case 'neutral':
      return 50;

    case 'positive':
      return 100 - confidenceScore;

    default:
      return null;
  }
}


// ============================================================
// CALCULATE COMMENT SENTIMENT IMPACT
// ============================================================

async function calculateCommentSentimentImpact(postId) {

  try {

    const comments =
      await Comment.find({
        post: postId
      }).select(
        '_id sentimentLabel confidenceScore content createdAt'
      );


    console.log('');
    console.log(
      '============================================================'
    );
    console.log(
      'COMMENT STRESS ANALYSIS'
    );
    console.log(
      '============================================================'
    );

    console.log(
      'Post ID:',
      String(postId)
    );

    console.log(
      'Total comments found:',
      comments.length
    );


    // --------------------------------------------------------
    // No comments
    // --------------------------------------------------------

    if (comments.length === 0) {

      console.log(
        'No comments found.'
      );

      console.log(
        'Comment Impact: null'
      );

      console.log(
        '============================================================'
      );

      return null;
    }


    // --------------------------------------------------------
    // Calculate impact for every comment
    // --------------------------------------------------------

    const impacts = [];


    comments.forEach(
      (comment, index) => {

        const rawSentiment =
          comment.sentimentLabel;

        const normalizedSentiment =
          String(rawSentiment || '')
            .trim()
            .toLowerCase();

        const confidence =
          Number(comment.confidenceScore);

        const impact =
          getSentimentStressImpact(
            normalizedSentiment,
            confidence
          );


        console.log(
          `Comment #${index + 1}`
        );

        console.log(
          'Comment ID:',
          String(comment._id)
        );

        console.log(
          'Raw sentiment:',
          rawSentiment
        );

        console.log(
          'Normalized sentiment:',
          normalizedSentiment
        );

        console.log(
          'Confidence:',
          comment.confidenceScore
        );

        console.log(
          'Stress impact:',
          impact
        );

        console.log(
          '------------------------------------------------------------'
        );


        if (impact !== null) {

          impacts.push(
            impact
          );
        }

      }
    );


    console.log(
      'Valid comment impacts:',
      impacts
    );


    // --------------------------------------------------------
    // No valid sentiment data
    // --------------------------------------------------------

    if (impacts.length === 0) {

      console.log(
        'Comments exist, but no valid sentiment data was found.'
      );

      console.log(
        'Comment Impact: null'
      );

      console.log(
        '============================================================'
      );

      return null;
    }


    // --------------------------------------------------------
    // Calculate average comment impact
    // --------------------------------------------------------

    const totalImpact =
      impacts.reduce(
        (sum, impact) =>
          sum + impact,
        0
      );

    const averageImpact =
      totalImpact / impacts.length;

    const roundedImpact =
      Number(
        averageImpact.toFixed(2)
      );


    console.log(
      'Total impact:',
      Number(totalImpact.toFixed(2))
    );

    console.log(
      'Number of analyzed comments:',
      impacts.length
    );

    console.log(
      'FINAL COMMENT SENTIMENT IMPACT:',
      roundedImpact
    );

    console.log(
      '============================================================'
    );


    return roundedImpact;

  } catch (error) {

    console.error(
      'Error calculating comment sentiment impact:',
      error
    );

    return null;
  }
}


// ============================================================
// CALCULATE FINAL STRESS SCORE
// ============================================================
//
// Current fusion:
//
//   70% = post stress model
//   30% = average comment sentiment impact
//
// ============================================================

function calculateFinalStressScore(
  postStress,
  commentImpact
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


  const numericPostStress =
    Number(postStress);


  if (
    commentImpact === null ||
    commentImpact === undefined ||
    !Number.isFinite(
      Number(commentImpact)
    )
  ) {

    return Number(
      numericPostStress.toFixed(2)
    );
  }


  const numericCommentImpact =
    Number(commentImpact);


  const finalScore =
    (
      numericPostStress * 0.70
    ) +
    (
      numericCommentImpact * 0.30
    );


  return Number(
    finalScore.toFixed(2)
  );
}


// ============================================================
// ENRICH ONE POST
// ============================================================

async function enrichPost(post) {

  const postObject =
    post.toObject
      ? post.toObject()
      : post;


  const commentImpact =
    await calculateCommentSentimentImpact(
      postObject._id
    );


  const finalStress =
    calculateFinalStressScore(
      postObject.stressScore,
      commentImpact
    );


  console.log('');

  console.log(
    '============================================================'
  );

  console.log(
    'POST ANALYTICS RESULT'
  );

  console.log(
    'Post ID:',
    String(postObject._id)
  );

  console.log(
    'Stress Label:',
    postObject.stressLabel
  );

  console.log(
    'Post Stress:',
    postObject.stressScore
  );

  console.log(
    'Comment Sentiment Impact:',
    commentImpact
  );

  console.log(
    'Final Stress:',
    finalStress
  );

  console.log(
    '============================================================'
  );


  return {

    ...postObject,

    postStressScore:
      postObject.stressScore,

    commentSentimentImpact:
      commentImpact,

    finalStressScore:
      finalStress

  };
}


// ============================================================
// GET /api/posts
// ============================================================

router.get(
  '/',
  authMiddleware,
  async (req, res) => {

    try {

      const User =
        require('../models/User');


      const currentUser =
        await User.findById(
          req.user.id
        ).select(
          'following'
        );


      if (!currentUser) {

        return res.status(404).json({
          message: 'User not found'
        });
      }


      const authorIds = [

        ...(currentUser.following || []),

        currentUser._id

      ];


      const posts =
        await Post.find({

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


      console.log('');

      console.log(
        '============================================================'
      );

      console.log(
        'GET /api/posts'
      );

      console.log(
        'Posts received:',
        posts.length
      );

      console.log(
        '============================================================'
      );


      const enrichedPosts =
        await Promise.all(

          posts.map(
            async (post) => {

              return await enrichPost(
                post
              );

            }
          )

        );


      res.json(
        enrichedPosts
      );


    } catch (err) {

      console.error(
        'GET /api/posts error:',
        err
      );

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

    const {
      content
    } = req.body;


    if (
      !content ||
      typeof content !== 'string' ||
      content.trim() === ''
    ) {

      return res.status(400).json({
        message: 'Post content cannot be empty'
      });
    }


    try {

      const cleanedContent =
        content.trim();


      let emotionResult =
        null;

      let stressResult =
        null;


      // ======================================================
      // AI EMOTION ANALYSIS
      // ======================================================

      try {

        emotionResult =
          await analyzeEmotion(
            cleanedContent
          );


        console.log('');

        console.log(
          '============================================================'
        );

        console.log(
          'POST AI EMOTION RESULT'
        );

        console.log(
          emotionResult
        );

        console.log(
          'Emotion:',
          emotionResult?.emotion
        );

        console.log(
          'Confidence:',
          emotionResult?.confidence
        );

        console.log(
          '============================================================'
        );


      } catch (aiError) {

        console.error(
          'AI emotion analysis failed:',
          aiError.message
        );
      }


      // ======================================================
      // AI STRESS ANALYSIS
      // ======================================================

      try {

        stressResult =
          await analyzeStress(
            cleanedContent
          );


        console.log('');

        console.log(
          '============================================================'
        );

        console.log(
          'POST AI STRESS RESULT'
        );

        console.log(
          stressResult
        );

        console.log(
          'Stress:',
          stressResult?.stress
        );

        console.log(
          'Confidence:',
          stressResult?.confidence
        );

        // ----------------------------------------------------
        // FULL STRESS RESULT DIAGNOSTIC
        // ----------------------------------------------------

        console.log(
          'FULL STRESS RESULT FROM PYTHON:',
          JSON.stringify(
            stressResult,
            null,
            2
          )
        );

        console.log(
          '============================================================'
        );


      } catch (aiError) {

        console.error(
          'AI stress analysis failed:',
          aiError.message
        );
      }


      // ======================================================
      // CONVERT STRESS MODEL OUTPUT TO STRESS SCORE
      // ======================================================

      const postStressScore =
        stressResult
          ? (
              stressResult.stress === 'STRESS'
                ? Number(stressResult.confidence)
                : 100 - Number(stressResult.confidence)
            )
          : null;


      // ======================================================
      // CREATE POST
      // ======================================================

      const newPost =
        new Post({

          author:
            req.user.id,

          content:
            cleanedContent,

          stressLabel:
            stressResult
              ? stressResult.stress
              : '',

          emotionConfidence:
            emotionResult
              ? emotionResult.confidence
              : null,

          stressScore:
            postStressScore

        });


      const savedPost =
        await newPost.save();


      const populatedPost =
        await Post.findById(
          savedPost._id
        )
        .populate(
          'author',
          'username name avatar'
        );


      const enrichedPost =
        await enrichPost(
          populatedPost
        );


      // ======================================================
      // RESPONSE
      // ======================================================

      res.status(201).json({

        ...enrichedPost,

        aiAnalysis: {

          status:
            stressResult || emotionResult
              ? 'completed'
              : 'unavailable',

          emotion:
            emotionResult
              ? emotionResult.emotion
              : null,

          emotionConfidence:
            emotionResult
              ? emotionResult.confidence
              : null,

          stress:
            stressResult
              ? stressResult.stress
              : null,

          stressConfidence:
            stressResult
              ? stressResult.confidence
              : null,

          postStressScore:
            postStressScore,

          commentSentimentImpact:
            null,

          finalStressScore:
            postStressScore,

          top_predictions:
            emotionResult
              ? emotionResult.top_predictions
              : []

        }

      });


    } catch (err) {

      console.error(
        'POST /api/posts error:',
        err
      );

      res.status(500).json({
        message: 'Server error'
      });
    }

  }
);


// ============================================================
// LIKE POST
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
          message: 'Post not found'
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


      const enrichedPost =
        await enrichPost(
          post
        );


      res.json(
        enrichedPost
      );


    } catch (err) {

      console.error(
        'Like post error:',
        err
      );

      res.status(500).json({
        message: 'Server error'
      });
    }

  }
);


// ============================================================
// DELETE POST
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
          message: 'Post not found'
        });
      }


      if (
        post.author.toString() !==
        req.user.id
      ) {

        return res.status(401).json({
          message:
            'User not authorized to delete this post'
        });
      }


      await Comment.deleteMany({
        post: post._id
      });


      await Post.findByIdAndDelete(
        req.params.id
      );


      res.json({
        message: 'Post removed'
      });


    } catch (err) {

      console.error(
        'Delete post error:',
        err
      );

      res.status(500).json({
        message: 'Server error'
      });
    }

  }
);


// ============================================================
// EXPORT ROUTER
// ============================================================

module.exports = router;