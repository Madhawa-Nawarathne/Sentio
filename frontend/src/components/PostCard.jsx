import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heart,
  MessageCircle,
  Trash2
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
  // AI ANALYSIS CHECK
  // ============================================================

  const hasAIAnalysis =
    Boolean(post?.stressLabel);


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
  // AI ANALYTICS VALUES
  // ============================================================


  const postStress =
    formatScore(
      post?.postStressScore ?? post?.stressScore
    );


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

            <div className="stress-badge">


              {/* ================================================ */}
              {/* AI STRESS DETECTION */}
              {/* ================================================ */}
              <div>

                <strong>
                  AI Stress Detection:
                </strong>{' '}

                {String(post.stressLabel)
                  .charAt(0)
                  .toUpperCase() +
                  String(post.stressLabel).slice(1)}

              </div>


              {/* ================================================ */}
              {/* POST STRESS SCORE */}
              {/* ================================================ */}

              <div>

                <strong>
                  Post Stress Score:
                </strong>{' '}

                {postStress !== null
                  ? `${postStress}%`
                  : 'N/A'}

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

    </article>

  );

};

export default PostCard;