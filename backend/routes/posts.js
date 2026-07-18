const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const authMiddleware = require('./authMiddleware');

// @route   GET /api/posts
// @desc    Get posts from followed users + own posts (private feed)
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    const User = require('../models/User');
    const currentUser = await User.findById(req.user.id).select('following');
    if (!currentUser) return res.status(404).json({ message: 'User not found' });

    // Include own posts and posts from people the user follows
    const authorIds = [...currentUser.following, currentUser._id];

    const posts = await Post.find({ author: { $in: authorIds } })
      .populate('author', 'username name avatar')
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/posts
// @desc    Create a post
// @access  Private
router.post('/', authMiddleware, async (req, res) => {
  const { content } = req.body;

  if (!content || content.trim() === '') {
    return res.status(400).json({ message: 'Post content cannot be empty' });
  }

  try {
    const newPost = new Post({
      author: req.user.id,
      content,
      // Since sentiment and stress analysis is disabled/mocked, we store defaults
      stressScore: null,
      stressLabel: ''
    });

    const savedPost = await newPost.save();
    const populatedPost = await Post.findById(savedPost._id).populate('author', 'username name avatar');

    res.status(201).json(populatedPost);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/posts/:id/like
// @desc    Like / unlike a post
// @access  Private
router.post('/:id/like', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if the user has already liked the post
    const likeIndex = post.likes.indexOf(req.user.id);
    if (likeIndex > -1) {
      // Already liked, so unlike it
      post.likes.splice(likeIndex, 1);
    } else {
      // Not liked yet, so like it
      post.likes.push(req.user.id);
    }

    await post.save();
    res.json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/posts/:id
// @desc    Delete a post
// @access  Private
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check user ownership
    if (post.author.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized to delete this post' });
    }

    // Delete post comments
    await Comment.deleteMany({ post: post._id });
    
    // Delete the post
    await Post.findByIdAndDelete(req.params.id);

    res.json({ message: 'Post removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
