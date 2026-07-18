const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Post = require('../models/Post');
const authMiddleware = require('./authMiddleware');

// @route   GET /api/users
// @desc    Get all users or search users (used for search and suggestion sidebar)
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  const { search } = req.query;
  try {
    let query = { _id: { $ne: req.user.id } }; // Exclude logged in user
    
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query).select('username name bio avatar followers following followRequests sentFollowRequests');
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/me/follow-requests
// @desc    Get pending follow requests for current user
// @access  Private
router.get('/me/follow-requests', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('followRequests', 'username name bio avatar');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user.followRequests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/:username
// @desc    Get user profile details & their posts
// @access  Private (so we can check follow relationship)
router.get('/:username', authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username.toLowerCase() }).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const currentUserId = req.user.id;
    const isOwnProfile = user._id.toString() === currentUserId;
    const isFollowing = user.followers.map(id => id.toString()).includes(currentUserId);
    const hasPendingRequest = user.followRequests.map(id => id.toString()).includes(currentUserId);

    // Only show posts if it's own profile or if the viewer is a follower
    let posts = [];
    if (isOwnProfile || isFollowing) {
      posts = await Post.find({ author: user._id })
        .populate('author', 'username name avatar')
        .sort({ createdAt: -1 });
    }

    res.json({ user, posts, isFollowing, hasPendingRequest, isOwnProfile });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile details
// @access  Private
router.put('/profile', authMiddleware, async (req, res) => {
  const { name, bio, avatar } = req.body;
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name !== undefined) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (avatar !== undefined) user.avatar = avatar;

    const updatedUser = await user.save();
    
    // Return updated user without password
    const userResponse = await User.findById(updatedUser._id).select('-password');
    res.json(userResponse);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/users/:id/follow
// @desc    Send a follow request to a user (or cancel pending request)
// @access  Private
router.post('/:id/follow', authMiddleware, async (req, res) => {
  if (req.params.id === req.user.id) {
    return res.status(400).json({ message: 'You cannot follow yourself' });
  }

  try {
    const targetUser = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user.id);

    if (!targetUser || !currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const currentUserId = currentUser._id;
    const targetUserId = targetUser._id;

    // Check if already following
    const alreadyFollowing = currentUser.following.map(id => id.toString()).includes(targetUserId.toString());
    if (alreadyFollowing) {
      // Unfollow
      currentUser.following = currentUser.following.filter(id => id.toString() !== targetUserId.toString());
      targetUser.followers = targetUser.followers.filter(id => id.toString() !== currentUserId.toString());
      
      await currentUser.save();
      await targetUser.save();

      return res.json({ status: 'unfollowed', currentUser: { id: currentUser._id, following: currentUser.following }, targetUser: { id: targetUser._id, followers: targetUser.followers } });
    }

    // Check if there is a pending request already
    const hasPending = currentUser.sentFollowRequests.map(id => id.toString()).includes(targetUserId.toString());
    if (hasPending) {
      // Cancel the follow request
      currentUser.sentFollowRequests = currentUser.sentFollowRequests.filter(id => id.toString() !== targetUserId.toString());
      targetUser.followRequests = targetUser.followRequests.filter(id => id.toString() !== currentUserId.toString());

      await currentUser.save();
      await targetUser.save();

      return res.json({ status: 'request_cancelled' });
    }

    // Send follow request
    currentUser.sentFollowRequests.push(targetUserId);
    targetUser.followRequests.push(currentUserId);

    await currentUser.save();
    await targetUser.save();

    return res.json({ status: 'request_sent' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/users/:id/accept-follow
// @desc    Accept a follow request from user :id
// @access  Private
router.post('/:id/accept-follow', authMiddleware, async (req, res) => {
  try {
    const requester = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user.id);

    if (!requester || !currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const requesterId = requester._id;
    const currentUserId = currentUser._id;

    // Remove from follow requests
    currentUser.followRequests = currentUser.followRequests.filter(id => id.toString() !== requesterId.toString());
    requester.sentFollowRequests = requester.sentFollowRequests.filter(id => id.toString() !== currentUserId.toString());

    // Add to followers/following
    if (!currentUser.followers.map(id => id.toString()).includes(requesterId.toString())) {
      currentUser.followers.push(requesterId);
    }
    if (!requester.following.map(id => id.toString()).includes(currentUserId.toString())) {
      requester.following.push(currentUserId);
    }

    await currentUser.save();
    await requester.save();

    res.json({ message: 'Follow request accepted', followRequests: currentUser.followRequests });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/users/:id/decline-follow
// @desc    Decline a follow request from user :id
// @access  Private
router.post('/:id/decline-follow', authMiddleware, async (req, res) => {
  try {
    const requester = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user.id);

    if (!requester || !currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const requesterId = requester._id;
    const currentUserId = currentUser._id;

    // Remove from follow requests
    currentUser.followRequests = currentUser.followRequests.filter(id => id.toString() !== requesterId.toString());
    requester.sentFollowRequests = requester.sentFollowRequests.filter(id => id.toString() !== currentUserId.toString());

    await currentUser.save();
    await requester.save();

    res.json({ message: 'Follow request declined', followRequests: currentUser.followRequests });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/:id/stats
// @desc    Get user's AI wellness stats (mocked since analysis is disabled)
// @access  Private
router.get('/:id/stats', authMiddleware, async (req, res) => {
  try {
    res.json({
      enabled: false,
      message: 'Sentiment and stress analysis features are currently empty/disabled.',
      stressScore: 0,
      stressLabel: 'N/A',
      sentimentBreakdown: {
        positive: 0,
        neutral: 0,
        negative: 0
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
