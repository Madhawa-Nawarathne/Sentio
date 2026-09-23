
import React, { useState, useEffect, useRef } from 'react';

import Sidebar from '../components/Sidebar';
import RightSidebar from '../components/RightSidebar';
import PostCard from '../components/PostCard';
import CommentSection from '../components/CommentSection';

import { useAuth } from '../context/AuthContext';


const Feed = () => {

  const { token } = useAuth();


  // ============================================================
  // STATE
  // ============================================================

  const [posts, setPosts] = useState([]);

  const [analytics, setAnalytics] = useState(null);

  const [postContent, setPostContent] = useState('');

  const [loading, setLoading] = useState(true);

  const [submitting, setSubmitting] = useState(false);

  const [activeCommentPost, setActiveCommentPost] = useState(null);

  const [commentsCounts, setCommentsCounts] = useState({});

  const postInputRef = useRef(null);


  // ============================================================
  // LOAD ANALYTICS
  // ============================================================

  const fetchAnalytics = async () => {

    if (!token) {
      return;
    }

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

        console.log(
          'Analytics updated:',
          data
        );

        setAnalytics(data);

      } else {

        console.error(
          'Analytics request failed:',
          response.status
        );

      }

    } catch (err) {

      console.error(
        'Error loading analytics:',
        err
      );

    }

  };


  // ============================================================
  // LOAD COMMENT COUNT
  // ============================================================

  const fetchCommentsCount = async (postId) => {

    try {

      const response = await fetch(
        `/api/comments/post/${postId}`
      );


      if (response.ok) {

        const comments = await response.json();


        setCommentsCounts(
          (prev) => ({
            ...prev,
            [postId]: comments.length
          })
        );

        return comments.length;

      }

    } catch (err) {

      console.error(
        'Error loading comment count:',
        err
      );

    }

    return 0;

  };


  // ============================================================
  // LOAD POSTS
  // ============================================================

  const fetchPosts = async () => {

    if (!token) {
      return;
    }

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


        console.log(
          '================================================'
        );

        console.log(
          'Posts received from backend:'
        );

        console.log(data);


        console.log(
          '================================================'
        );


        setPosts(data);


        // ------------------------------------------------------
        // Refresh comment counts
        // ------------------------------------------------------

        for (const post of data) {

          await fetchCommentsCount(
            post._id
          );

        }

      } else {

        console.error(
          'Posts request failed:',
          response.status
        );

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


  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {

    if (!token) {
      return;
    }


    fetchPosts();

    fetchAnalytics();

  }, [token]);


  // ============================================================
  // CREATE POST
  // ============================================================

  const handleCreatePost = async (e) => {

    e.preventDefault();


    if (
      !postContent.trim() ||
      submitting
    ) {
      return;
    }


    setSubmitting(true);


    try {

      const response = await fetch(
        '/api/posts',
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',

            Authorization:
              `Bearer ${token}`
          },

          body: JSON.stringify({
            content:
              postContent.trim()
          })
        }
      );


      if (response.ok) {

        const newPost =
          await response.json();


        console.log(
          'New post created:',
          newPost
        );


        // ------------------------------------------------------
        // Add new post immediately
        // ------------------------------------------------------

        setPosts(
          (currentPosts) => [
            newPost,
            ...currentPosts
          ]
        );


        // ------------------------------------------------------
        // Clear input
        // ------------------------------------------------------

        setPostContent('');


        // ------------------------------------------------------
        // New post starts with zero comments
        // ------------------------------------------------------

        setCommentsCounts(
          (prev) => ({
            ...prev,
            [newPost._id]: 0
          })
        );


        // ------------------------------------------------------
        // Refresh analytics
        // ------------------------------------------------------

        await fetchAnalytics();

      } else {

        const errData =
          await response
            .json()
            .catch(() => ({}));


        alert(
          errData.message ||
          'Failed to create post'
        );

      }

    } catch (err) {

      console.error(
        'Error creating post:',
        err
      );

    } finally {

      setSubmitting(false);

    }

  };


  // ============================================================
  // LIKE POST
  // ============================================================

  const handleLikePost = async (postId) => {

    try {

      const response = await fetch(
        `/api/posts/${postId}/like`,
        {
          method: 'POST',

          headers: {
            Authorization:
              `Bearer ${token}`
          }
        }
      );


      if (response.ok) {

        const updated =
          await response.json();


        console.log(
          'Post after like:',
          updated
        );


        // ------------------------------------------------------
        // Keep the complete enriched post returned by backend.
        //
        // This includes:
        //
        // postStressScore
        // commentSentimentImpact
        // finalStressScore
        // ------------------------------------------------------

        setPosts(
          (currentPosts) =>
            currentPosts.map(
              (p) =>
                p._id === postId
                  ? {
                      ...p,
                      ...updated
                    }
                  : p
            )
        );

      } else {

        console.error(
          'Like request failed:',
          response.status
        );

      }

    } catch (err) {

      console.error(
        'Error liking post:',
        err
      );

    }

  };


  // ============================================================
  // DELETE POST
  // ============================================================

  const handleDeletePost = async (postId) => {

    if (
      !window.confirm(
        'Delete this post?'
      )
    ) {
      return;
    }


    try {

      const response = await fetch(
        `/api/posts/${postId}`,
        {
          method: 'DELETE',

          headers: {
            Authorization:
              `Bearer ${token}`
          }
        }
      );


      if (response.ok) {

        // ------------------------------------------------------
        // Remove post
        // ------------------------------------------------------

        setPosts(
          (currentPosts) =>
            currentPosts.filter(
              (p) =>
                p._id !== postId
            )
        );


        // ------------------------------------------------------
        // Remove comment count
        // ------------------------------------------------------

        setCommentsCounts(
          (prev) => {

            const updated = {
              ...prev
            };

            delete updated[postId];

            return updated;

          }
        );


        // ------------------------------------------------------
        // Refresh analytics
        // ------------------------------------------------------

        await fetchAnalytics();

      } else {

        console.error(
          'Delete request failed:',
          response.status
        );

      }

    } catch (err) {

      console.error(
        'Error deleting post:',
        err
      );

    }

  };


  // ============================================================
  // COMMENT ADDED
  // ============================================================

  const handleCommentAdded = async (postId) => {

    console.log(
      '================================================'
    );

    console.log(
      'COMMENT ADDED'
    );

    console.log(
      'Post ID:',
      postId
    );

    console.log(
      'Refreshing comment count...'
    );

    console.log(
      '================================================'
    );


    try {

      // --------------------------------------------------------
      // STEP 1
      //
      // Refresh comment count.
      // --------------------------------------------------------

      await fetchCommentsCount(
        postId
      );


      // --------------------------------------------------------
      // STEP 2
      //
      // Refresh posts from backend.
      //
      // Backend:
      //
      // GET /api/posts
      //
      //        ↓
      //
      // enrichPost()
      //
      //        ↓
      //
      // calculateCommentSentimentImpact()
      //
      //        ↓
      //
      // calculateFinalStressScore()
      //
      //        ↓
      //
      // PostCard receives:
      //
      // postStressScore
      // commentSentimentImpact
      // finalStressScore
      //
      // --------------------------------------------------------

      console.log(
        'Refreshing posts and comment impact...'
      );


      await fetchPosts();


      // --------------------------------------------------------
      // STEP 3
      //
      // Refresh analytics.
      //
      // This updates:
      //
      // Overall stress
      // Positive %
      // Neutral %
      // Negative %
      // Comment counts
      // Post analytics
      //
      // --------------------------------------------------------

      console.log(
        'Refreshing right-sidebar analytics...'
      );


      await fetchAnalytics();


      // --------------------------------------------------------
      // STEP 4
      //
      // Log the refreshed post so we can verify
      // the backend calculation.
      // --------------------------------------------------------

      setPosts(
        (currentPosts) => {

          const refreshedPost =
            currentPosts.find(
              (post) =>
                post._id === postId
            );


          if (refreshedPost) {

            console.log(
              '================================================'
            );

            console.log(
              'REFRESHED POST ANALYTICS'
            );

            console.log(
              'Post ID:',
              refreshedPost._id
            );

            console.log(
              'Post Stress:',
              refreshedPost.postStressScore
            );

            console.log(
              'Comment Sentiment Impact:',
              refreshedPost.commentSentimentImpact
            );

            console.log(
              'Final Stress:',
              refreshedPost.finalStressScore
            );

            console.log(
              '================================================'
            );

          }

          return currentPosts;

        }
      );


      console.log(
        'Comment analytics refresh completed.'
      );


    } catch (err) {

      console.error(
        'Error refreshing comment analytics:',
        err
      );

    }

  };


  // ============================================================
  // FOCUS POST INPUT
  // ============================================================

  const focusPostInput = () => {

    postInputRef.current?.focus();

  };


  // ============================================================
  // RENDER
  // ============================================================

  return (

    <div className="app-layout">


      {/* ====================================================== */}
      {/* LEFT SIDEBAR */}
      {/* ====================================================== */}

      <Sidebar
        onNewPostClick={
          focusPostInput
        }
      />


      {/* ====================================================== */}
      {/* MAIN CONTENT */}
      {/* ====================================================== */}

      <main className="main-content">

        <div className="page-header">

          <h2>
            Home
          </h2>

        </div>


        <div className="feed-container">


          {/* ================================================== */}
          {/* CREATE POST */}
          {/* ================================================== */}

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

              disabled={submitting}
            />


            <div className="create-post-actions">

              <button
                type="submit"

                className="create-post-btn"

                disabled={
                  !postContent.trim() ||
                  submitting
                }
              >

                {
                  submitting
                    ? 'Posting...'
                    : 'POST'
                }

              </button>

            </div>

          </form>


          {/* ================================================== */}
          {/* POSTS */}
          {/* ================================================== */}

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >

            {
              loading ? (

                <div>
                  Loading...
                </div>

              ) : posts.length === 0 ? (

                <div>
                  No posts yet.
                </div>

              ) : (

                posts.map(
                  (post) => (

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

                  )
                )

              )
            }

          </div>

        </div>

      </main>


      {/* ====================================================== */}
      {/* RIGHT SIDEBAR */}
      {/* ====================================================== */}

      <RightSidebar
        analytics={
          analytics
        }
      />


      {/* ====================================================== */}
      {/* COMMENTS MODAL */}
      {/* ====================================================== */}

      {
        activeCommentPost && (

          <CommentSection

            post={
              activeCommentPost
            }

            onClose={() =>
              setActiveCommentPost(
                null
              )
            }

            onCommentAdded={
              handleCommentAdded
            }

          />

        )
      }


    </div>

  );

};


export default Feed;
