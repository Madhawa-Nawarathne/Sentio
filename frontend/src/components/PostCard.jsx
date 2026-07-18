import React from 'react';
import { Heart, MessageCircle, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './PostCard.css';

const PostCard = ({ post, onLike, onDelete, onCommentClick, commentsCount = 0 }) => {
  const { user } = useAuth();
  const isLiked = post.likes && post.likes.includes(user?.id || user?._id);
  const isAuthor = post.author && (post.author._id === user?.id || post.author._id === user?._id || post.author === user?.id || post.author === user?._id);

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatDate = (dateString) => {
    const options = { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const authorName = post.author?.name || 'User';
  const authorUsername = post.author?.username || 'user';
  const authorAvatar = post.author?.avatar;

  return (
    <article className="post-card">
      <div className="post-avatar-col">
        <div className="avatar-placeholder" style={{ width: '42px', height: '42px', fontSize: '15px' }}>
          {authorAvatar ? <img src={authorAvatar} alt={authorName} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : getInitials(authorName)}
        </div>
      </div>

      <div className="post-content-col">
        <div className="post-header">
          <div className="post-author-info">
            <span className="post-author-name">{authorName}</span>
            <span className="post-author-handle">@{authorUsername}</span>
            <span style={{ color: 'var(--text-light)' }}>•</span>
            <span className="post-date">{formatDate(post.createdAt)}</span>
          </div>

          {isAuthor && onDelete && (
            <button onClick={() => onDelete(post._id)} className="post-action-btn delete-btn" title="Delete post">
              <Trash2 size={16} />
            </button>
          )}
        </div>

        <p className="post-text">{post.content}</p>

        <span className="stress-badge">
          Stress Level: Empty/Disabled
        </span>

        <div className="post-actions">
          <button onClick={() => onLike(post._id)} className={`post-action-btn like-btn ${isLiked ? 'liked' : ''}`}>
            <Heart size={18} fill={isLiked ? '#e53e3e' : 'none'} />
            <span>{post.likes ? post.likes.length : 0}</span>
          </button>
          
          <button onClick={() => onCommentClick(post)} className="post-action-btn">
            <MessageCircle size={18} />
            <span>{commentsCount}</span>
          </button>
        </div>
      </div>
    </article>
  );
};

export default PostCard;
