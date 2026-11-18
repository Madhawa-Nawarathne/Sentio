import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Heart,
  MessageCircle,
  Trash2,
  AlertTriangle,
  X
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';

import './PostCard.css';

const PostCard = ({
  post,
  onLike,
  onDelete,
  onCommentClick,
  commentsCount = 0
}) => {

  const navigate = useNavigate();
  const { user } = useAuth();
  const [showHighStressModal, setShowHighStressModal] = useState(false);

  // ============================================================
  // CURRENT USER
  // ============================================================

  const currentUserId =
    user?.id ||
    user?._id;


  // ============================================================
  // LIKE STATUS
  // ============================================================

  const isLiked =
    Array.isArray(post?.likes) &&
    currentUserId &&
    post.likes.some(
      (like) =>
        String(like) === String(currentUserId)
    );


  // ============================================================
  // AUTHOR CHECK
  // ============================================================

  const postAuthorId =
    post?.author?._id ||
    post?.author;

  const isAuthor =
    postAuthorId &&
    currentUserId &&
    String(postAuthorId) ===
    String(currentUserId);


  // ============================================================
  // GET INITIALS
  // ============================================================

  const getInitials = (name) => {

    if (!name) {
      return 'U';
    }

    return name
      .split(' ')
      .map(
        (n) => n[0]
      )
      .join('')
      .toUpperCase()
      .slice(0, 2);

  };


  // ============================================================
  // FORMAT DATE
  // ============================================================

  const formatDate = (dateString) => {

    if (!dateString) {
      return '';
    }

    const date =
      new Date(dateString);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return '';
    }

    return date.toLocaleDateString(
      'en-US',
      {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }
    );

  };


  // ============================================================
  // AUTHOR INFORMATION
  // ============================================================

  const authorName =
    post?.author?.name ||
    'User';

  const authorUsername =
    post?.author?.username ||
    'user';

  const authorAvatar =
    post?.author?.avatar;


  // ============================================================
  // SAFE NUMBER FORMATTER
  // ============================================================

  const formatScore = (value) => {

    if (
      value === null ||
      value === undefined ||
      value === ''
    ) {
      return null;
    }

    const number =
      Number(value);

    if (
      !Number.isFinite(number)
    ) {
      return null;
    }

    return number.toFixed(2);

  };


  // ============================================================
  // AI ANALYTICS VALUES & COLOR CODING
  // ============================================================

  const postStress =
    formatScore(
      post?.postStressScore ?? post?.stressScore
    );

  const numericStress =
    postStress !== null ? Math.min(Math.max(Number(postStress), 0), 100) : null;

  const hasAIAnalysis =
    numericStress !== null;

  const getStressBarColor = (score) => {
    if (score === null) return '#cbd5e1';
    if (score < 35) return '#22c55e'; // Green
    if (score < 65) return '#eab308'; // Yellow
    return '#f97316'; // Orange
  };

  const isHighStressPost =
    numericStress !== null && numericStress >= 65;

  const stressBarColor = getStressBarColor(numericStress);


  // ============================================================
  // AUTHOR PROFILE CLICK
  // ============================================================

  const handleAuthorClick = (e) => {

    e.stopPropagation();

    if (!authorUsername) {
      return;
    }

    navigate(
      `/profile/${authorUsername}`
    );

  };


  // ============================================================
  // RENDER
  // ============================================================

  return (

    <article className="post-card">

      {/* ====================================================== */}
      {/* AVATAR */}
      {/* ====================================================== */}

      <div
        className="post-avatar-col"
        onClick={
          handleAuthorClick
        }
      >

        <div
          className="avatar-placeholder"
          style={{
            width: '42px',
            height: '42px',
            fontSize: '15px'
          }}
        >

          {authorAvatar ? (

            <img
              src={authorAvatar}
              alt={authorName}
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                objectFit: 'cover'
              }}
            />

          ) : (

            getInitials(
              authorName
            )

          )}

        </div>

      </div>


      {/* ====================================================== */}
      {/* POST CONTENT */}
      {/* ====================================================== */}

      <div className="post-content-col">


        {/* ==================================================== */}
        {/* POST HEADER */}
        {/* ==================================================== */}

        <div className="post-header">

          <div
            className="post-author-info"
            onClick={
              handleAuthorClick
            }
          >

            <span className="post-author-name">
              {authorName}
            </span>

            <span className="post-author-handle">
              @{authorUsername}
            </span>

            <span
              style={{
                color:
                  'var(--text-light)'
              }}
            >
              •
            </span>

            <span className="post-date">
              {formatDate(
                post?.createdAt
              )}
            </span>

          </div>


          {/* ================================================== */}
          {/* DELETE POST */}
          {/* ================================================== */}

          {isAuthor &&
            onDelete && (

              <button
                onClick={() =>
                  onDelete(
                    post._id
                  )
                }
                className="post-action-btn delete-btn"
                title="Delete post"
              >

                <Trash2 size={16} />

              </button>

            )}

        </div>


        {/* ==================================================== */}
        {/* POST CONTENT */}
        {/* ==================================================== */}

        <p className="post-text">
          {post?.content}
        </p>


        {/* ==================================================== */}
        {/* AI POST ANALYSIS (ONLY VISIBLE TO POST AUTHOR) */}
        {/* ==================================================== */}

        {isAuthor && (
          hasAIAnalysis ? (

            <div
              className={`post-stress-bar-container ${isHighStressPost ? 'high-stress-clickable' : ''}`}
              onClick={() => {
                if (isHighStressPost) {
                  setShowHighStressModal(true);
                }
              }}
              title={isHighStressPost ? 'High stress detected — click for wellness info' : undefined}
            >

              <div className="post-stress-bar-header">
                <span className="post-stress-bar-title">
                  Stress level of the post
                </span>
                <span
                  className="post-stress-bar-value"
                  style={{ color: stressBarColor, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  {isHighStressPost && <AlertTriangle size={12} />}
                  {postStress}%
                </span>
              </div>

              <div className="post-stress-bar-track">
                <div
                  className="post-stress-bar-fill"
                  style={{
                    width: `${numericStress}%`,
                    backgroundColor: stressBarColor
                  }}
                />
              </div>

            </div>

          ) : (

            <span className="stress-badge">
              AI analysis unavailable
            </span>

          )
        )}


        {/* ==================================================== */}
        {/* POST ACTIONS */}
        {/* ==================================================== */}

        <div className="post-actions">


          {/* ================================================== */}
          {/* LIKE BUTTON */}
          {/* ================================================== */}

          <button
            onClick={() =>
              onLike(
                post._id
              )
            }
            className={`post-action-btn like-btn ${isLiked
                ? 'liked'
                : ''
              }`}
          >

            <Heart
              size={18}
              fill={
                isLiked
                  ? '#e53e3e'
                  : 'none'
              }
            />

            <span>
              {Array.isArray(
                post?.likes
              )
                ? post.likes.length
                : 0}
            </span>

          </button>


          {/* ================================================== */}
          {/* COMMENT BUTTON */}
          {/* ================================================== */}

          <button
            onClick={() =>
              onCommentClick(
                post
              )
            }
            className="post-action-btn"
          >

            <MessageCircle
              size={18}
            />

            <span>
              {commentsCount}
            </span>

          </button>

        </div>

      </div>

      {showHighStressModal && (
        <div
          className="stress-alert-overlay"
          onClick={() => setShowHighStressModal(false)}
        >
          <div
            className="stress-alert-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="stress-alert-close"
              onClick={() => setShowHighStressModal(false)}
              aria-label="Close warning"
            >
              <X size={18} />
            </button>

            <div
              className="stress-alert-icon-wrap"
              style={{
                backgroundColor: '#fff7ed',
                color: '#f97316'
              }}
            >
              <AlertTriangle size={28} />
            </div>

            <h3 className="stress-alert-title">
              High Stress Post Detected
            </h3>

            <div
              className="stress-alert-score-pill"
              style={{
                backgroundColor: '#ffedd5',
                color: '#c2410c'
              }}
            >
              Post Stress Level: {postStress}%
            </div>

            <p className="stress-alert-message">
              This post indicates a high level of stress. Please consider stopping using the platform for a while to take a break and focus on your well-being.
            </p>

            <div className="stress-alert-help-box">
              <span>Need support or helpful resources? </span>
              <Link
                to="/help"
                className="stress-alert-help-link"
                onClick={() => setShowHighStressModal(false)}
              >
                Visit our Help Center →
              </Link>
            </div>

            <div className="stress-alert-actions">
              <Link
                to="/help"
                className="stress-alert-btn stress-alert-btn-primary"
                onClick={() => setShowHighStressModal(false)}
              >
                Go to Help Center
              </Link>
              <button
                type="button"
                className="stress-alert-btn stress-alert-btn-secondary"
                onClick={() => setShowHighStressModal(false)}
              >
                I'll Take a Break
              </button>
            </div>
          </div>
        </div>
      )}

    </article>

  );

};

export default PostCard;