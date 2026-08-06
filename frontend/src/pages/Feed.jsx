import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import RightSidebar from '../components/RightSidebar';
import PostCard from '../components/PostCard';
import CommentSection from '../components/CommentSection';
import { useAuth } from '../context/AuthContext';

const Feed = () => {
  const { token } = useAuth();

  const [posts, setPosts] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  const [postContent, setPostContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [activeCommentPost, setActiveCommentPost] = useState(null);

  const [commentsCounts, setCommentsCounts] = useState({});

  const postInputRef = useRef(null);

  //--------------------------------------------------
  // Load analytics
  //--------------------------------------------------

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(
        '/api/analytics/summary',
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (err) {
      console.error(
        'Error loading analytics:',
        err
      );
    }
  };

  //--------------------------------------------------
  // Load posts
  //--------------------------------------------------

  const fetchPosts = async () => {
    try {
      const response = await fetch(
        '/api/posts',
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();

        setPosts(data);

        data.forEach((post) => {
          fetchCommentsCount(post._id);
        });
      }

    } catch (err) {
      console.error(
        'Error fetching posts:',
        err
      );

    } finally {
      setLoading(false);
    }
  };

  //--------------------------------------------------
  // Load comments count
  //--------------------------------------------------

  const fetchCommentsCount = async (
    postId
  ) => {
    try {
      const response = await fetch(
        `/api/comments/post/${postId}`
      );

      if (response.ok) {
        const comments =
          await response.json();

        setCommentsCounts((prev) => ({
          ...prev,
          [postId]:
            comments.length
        }));
      }

    } catch (err) {
      console.error(err);
    }
  };

  //--------------------------------------------------
  // Initial load
  //--------------------------------------------------

  useEffect(() => {
    fetchPosts();
    fetchAnalytics();
  }, []);

  //--------------------------------------------------
  // Create post
  //--------------------------------------------------

  const handleCreatePost = async (
    e
  ) => {
    e.preventDefault();

    if (
      !postContent.trim() ||
      submitting
    )
      return;

    setSubmitting(true);

    try {
      const response = await fetch(
        '/api/posts',
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',
            Authorization: `Bearer ${token}`
          },

          body: JSON.stringify({
            content: postContent
          })
        }
      );

      if (response.ok) {
        const newPost =
          await response.json();

        setPosts([
          newPost,
          ...posts
        ]);

        setPostContent('');

        setCommentsCounts((prev) => ({
          ...prev,
          [newPost._id]: 0
        }));

        // Refresh analytics
        fetchAnalytics();

      } else {
        const errData =
          await response.json();

        alert(
          errData.message ||
            'Failed to create post'
        );
      }

    } catch (err) {
      console.error(err);

    } finally {
      setSubmitting(false);
    }
  };

  //--------------------------------------------------
  // Like post
  //--------------------------------------------------

  const handleLikePost = async (
    postId
  ) => {
    try {
      const response = await fetch(
        `/api/posts/${postId}/like`,
        {
          method: 'POST',

          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const updated =
          await response.json();

        setPosts(
          posts.map((p) =>
            p._id === postId
              ? {
                  ...p,
                  likes:
                    updated.likes
                }
              : p
          )
        );
      }

    } catch (err) {
      console.error(err);
    }
  };

  //--------------------------------------------------
  // Delete post
  //--------------------------------------------------

  const handleDeletePost =
    async (postId) => {
      if (
        !window.confirm(
          'Delete this post?'
        )
      )
        return;

      try {
        const response = await fetch(
          `/api/posts/${postId}`,
          {
            method: 'DELETE',

            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        if (response.ok) {
          setPosts(
            posts.filter(
              (p) =>
                p._id !== postId
            )
          );

          fetchAnalytics();
        }

      } catch (err) {
        console.error(err);
      }
    };

  //--------------------------------------------------
  // Comment added
  //--------------------------------------------------

  const handleCommentAdded = (
    postId
  ) => {
    setCommentsCounts((prev) => ({
      ...prev,
      [postId]:
        (prev[postId] || 0) + 1
    }));

    fetchAnalytics();
  };

  //--------------------------------------------------

  const focusPostInput = () => {
    postInputRef.current?.focus();
  };

  //--------------------------------------------------

  return (
    <div className="app-layout">

      <Sidebar
        onNewPostClick={
          focusPostInput
        }
      />

      <main className="main-content">

        <div className="page-header">
          <h2>Home</h2>
        </div>

        <div className="feed-container">

          <form
            className="create-post-card"
            onSubmit={
              handleCreatePost
            }
          >

            <div className="create-post-label">
              What's happening?
            </div>

            <textarea
              ref={postInputRef}
              className="create-post-textarea"
              placeholder="Share your thoughts..."
              value={postContent}
              onChange={(e) =>
                setPostContent(
                  e.target.value
                )
              }
            />

            <div className="create-post-actions">

              <button
                className="create-post-btn"
                disabled={
                  !postContent.trim()
                }
              >
                {submitting
                  ? 'Posting...'
                  : 'POST'}
              </button>

            </div>

          </form>

          <div
            style={{
              display: 'flex',
              flexDirection:
                'column',
              gap: '16px'
            }}
          >
            {loading ? (
              <div>
                Loading...
              </div>
            ) : (
              posts.map((post) => (
                <PostCard
                  key={post._id}
                  post={post}
                  onLike={
                    handleLikePost
                  }
                  onDelete={
                    handleDeletePost
                  }
                  onCommentClick={
                    setActiveCommentPost
                  }
                  commentsCount={
                    commentsCounts[
                      post._id
                    ] || 0
                  }
                />
              ))
            )}
          </div>

        </div>

      </main>

      <RightSidebar
        analytics={analytics}
      />

      {activeCommentPost && (
        <CommentSection
          post={activeCommentPost}
          onClose={() =>
            setActiveCommentPost(
              null
            )
          }
          onCommentAdded={
            handleCommentAdded
          }
        />
      )}

    </div>
  );
};

export default Feed;