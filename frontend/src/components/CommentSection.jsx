import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './CommentSection.css';

const CommentSection = ({
  post,
  onClose,
  onCommentAdded
}) => {

  const { token } = useAuth();
  const navigate = useNavigate();

  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // ============================================================
  // LOAD COMMENTS
  // ============================================================

  useEffect(() => {

    const fetchComments = async () => {

      try {

        setLoading(true);

        const response = await fetch(
          `/api/comments/post/${post._id}`
        );

        if (response.ok) {

          const data =
            await response.json();

          setComments(data);

        } else {

          console.error(
            'Failed to load comments:',
            response.status
          );

        }

      } catch (err) {

        console.error(
          'Error fetching comments:',
          err
        );

      } finally {

        setLoading(false);

      }

    };

    if (post?._id) {
      fetchComments();
    }

  }, [post?._id]);


  // ============================================================
  // SUBMIT COMMENT
  // ============================================================

  const handleSubmit = async (e) => {

    e.preventDefault();

    if (
      !newComment.trim() ||
      submitting ||
      !token ||
      !post?._id
    ) {
      return;
    }

    setSubmitting(true);

    const commentText =
      newComment.trim();

    try {

      const response = await fetch(
        '/api/comments',
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',

            Authorization:
              `Bearer ${token}`
          },

          body: JSON.stringify({
            postId: post._id,
            content: commentText
          })
        }
      );


      // ========================================================
      // COMMENT SUCCESSFULLY CREATED
      // ========================================================

      if (response.ok) {

        const commentData =
          await response.json();


        // ------------------------------------------------------
        // Add comment immediately to modal
        // ------------------------------------------------------

        setComments(
          (currentComments) => [
            ...currentComments,
            commentData
          ]
        );


        // ------------------------------------------------------
        // Clear input
        // ------------------------------------------------------

        setNewComment('');


        // ------------------------------------------------------
        // IMPORTANT
        //
        // Tell Feed.jsx to refresh:
        //
        // 1. comment count
        // 2. post stress score
        // 3. comment sentiment impact
        // 4. final stress score
        // 5. right sidebar analytics
        //
        // Await it so the refresh finishes properly.
        // ------------------------------------------------------

        if (onCommentAdded) {

          await onCommentAdded(
            post._id
          );

        }

      } else {

        const errData =
          await response.json()
            .catch(() => ({}));

        alert(
          errData.message ||
          'Failed to submit comment'
        );

      }

    } catch (err) {

      console.error(
        'Error posting comment:',
        err
      );

      alert(
        'Failed to submit comment. Please try again.'
      );

    } finally {

      setSubmitting(false);

    }

  };


  // ============================================================
  // INITIALS
  // ============================================================

  const getInitials = (name) => {

    if (!name) {
      return 'U';
    }

    return name
      .split(' ')
      .map(
        (word) => word[0]
      )
      .join('')
      .toUpperCase()
      .slice(0, 2);

  };


  // ============================================================
  // DATE FORMAT
  // ============================================================

  const formatDate = (dateString) => {

    return new Date(
      dateString
    ).toLocaleDateString(
      'en-US',
      {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }
    );

  };


  // ============================================================
  // AUTHOR CLICK
  // ============================================================

  const handleAuthorClick = (
    username
  ) => {

    if (username) {

      onClose();

      navigate(
        `/profile/${username}`
      );

    }

  };


  // ============================================================
  // SENTIMENT FORMAT
  // ============================================================

  const formatSentiment = (
    sentiment
  ) => {

    if (!sentiment) {
      return '';
    }

    const normalized = String(sentiment)
      .trim()
      .toLowerCase()
      .replace(/[\s-]+/g, '_');

    if (normalized === 'label_0' || normalized === '0' || normalized === 'negative') {
      return 'Negative';
    }
    if (normalized === 'label_1' || normalized === '1' || normalized === 'neutral') {
      return 'Neutral';
    }
    if (normalized === 'label_2' || normalized === 'label_3' || normalized === '2' || normalized === '3' || normalized === 'positive') {
      return 'Positive';
    }

    return (
      sentiment.charAt(0).toUpperCase() +
      sentiment.slice(1).toLowerCase()
    );

  };


  // ============================================================
  // UI
  // ============================================================

  return (

    <div
      className="comments-modal-overlay"
      onClick={onClose}
    >

      {/* ====================================================== */}
      {/* MODAL */}
      {/* ====================================================== */}

      <div
        className="comments-container"
        onClick={(e) =>
          e.stopPropagation()
        }
      >

        {/* ================================================== */}
        {/* HEADER */}
        {/* ================================================== */}

        <div className="comments-header">

          <h2>
            Comments
          </h2>

          <button
            className="close-btn"
            onClick={onClose}
          >
            <X size={20} />
          </button>

        </div>


        {/* ================================================== */}
        {/* ORIGINAL POST */}
        {/* ================================================== */}

        <div className="original-post-context">

          <div className="original-post-author">

            @{post.author?.username ||
              'user'} wrote:

          </div>

          <p>
            {post.content}
          </p>

        </div>


        {/* ================================================== */}
        {/* COMMENTS */}
        {/* ================================================== */}

        <div className="comments-list">

          {loading ? (

            <div className="no-comments-message">
              Loading comments...
            </div>

          ) : comments.length === 0 ? (

            <div className="no-comments-message">

              No comments yet.
              Be the first to say something!

            </div>

          ) : (

            comments.map(
              (comment) => (

                <div
                  className="comment-item"
                  key={comment._id}
                >

                  {/* ====================================== */}
                  {/* AVATAR */}
                  {/* ====================================== */}

                  <div
                    className="avatar-placeholder"
                    style={{
                      width: '32px',
                      height: '32px',
                      fontSize: '12px'
                    }}
                  >

                    {comment.author?.avatar ? (

                      <img
                        src={
                          comment.author.avatar
                        }
                        alt={
                          comment.author.name
                        }
                        style={{
                          width: '100%',
                          height: '100%',
                          borderRadius: '50%',
                          objectFit: 'cover'
                        }}
                      />

                    ) : (

                      getInitials(
                        comment.author?.name ||
                        'User'
                      )

                    )}

                  </div>


                  {/* ====================================== */}
                  {/* COMMENT CONTENT */}
                  {/* ====================================== */}

                  <div className="comment-content">

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: '8px'
                      }}
                    >

                      <span
                        className={
                          'comment-author-name ' +
                          'comment-author-link'
                        }
                        onClick={() =>
                          handleAuthorClick(
                            comment.author?.username
                          )
                        }
                      >

                        {comment.author?.name ||
                          'User'}

                      </span>


                      <span
                        className="comment-author-link"
                        style={{
                          fontSize: '11px',
                          color:
                            'var(--text-muted)'
                        }}
                        onClick={() =>
                          handleAuthorClick(
                            comment.author?.username
                          )
                        }
                      >

                        @
                        {comment.author?.username ||
                          'user'}

                      </span>


                      <span className="comment-date">

                        {formatDate(
                          comment.createdAt
                        )}

                      </span>

                    </div>


                    {/* COMMENT TEXT */}

                    <p className="comment-text">

                      {comment.content}

                    </p>


                    {/* ================================== */}
                    {/* SENTIMENT */}
                    {/* ================================== */}

                    {comment.sentimentLabel ? (

                      <span className="comment-sentiment-badge">

                        Sentiment:{' '}

                        {formatSentiment(
                          comment.sentimentLabel
                        )}

                      </span>

                    ) : (

                      <span className="comment-sentiment-badge">

                        Sentiment analysis unavailable

                      </span>

                    )}

                  </div>

                </div>

              )
            )

          )}

        </div>


        {/* ================================================== */}
        {/* COMMENT INPUT */}
        {/* ================================================== */}

        <form
          className="comment-form"
          onSubmit={handleSubmit}
        >

          <input
            className="comment-input-area"
            placeholder="Write a comment..."
            value={newComment}
            onChange={(e) =>
              setNewComment(
                e.target.value
              )
            }
            required
            disabled={submitting}
          />


          <button
            className="comment-submit-btn"
            type="submit"
            disabled={
              !newComment.trim() ||
              submitting
            }
          >

            <Send size={16} />

          </button>

        </form>

      </div>

    </div>

  );

};

export default CommentSection;