import React, { useState, useEffect } from 'react';
import { X, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './CommentSection.css';

const CommentSection = ({ post, onClose, onCommentAdded }) => {
  const { token } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const response = await fetch(`/api/comments/post/${post._id}`);
        if (response.ok) {
          const data = await response.json();
          setComments(data);
        }
      } catch (err) {
        console.error('Error fetching comments:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, [post._id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;

    setSubmitting(true);
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          postId: post._id,
          content: newComment
        })
      });

      if (response.ok) {
        const commentData = await response.json();
        setComments([...comments, commentData]);
        setNewComment('');
        if (onCommentAdded) {
          onCommentAdded(post._id);
        }
      } else {
        const errData = await response.json();
        alert(errData.message || 'Failed to submit comment');
      }
    } catch (err) {
      console.error('Error posting comment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="comments-modal-overlay" onClick={onClose}>
      <div className="comments-container" onClick={(e) => e.stopPropagation()}>
        <div className="comments-header">
          <h3>Comments</h3>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="original-post-context">
          <div className="original-post-author">
            @{post.author?.username || 'user'} wrote:
          </div>
          <p>{post.content}</p>
        </div>

        <div className="comments-list">
          {loading ? (
            <div className="no-comments-message">Loading comments...</div>
          ) : comments.length === 0 ? (
            <div className="no-comments-message">No comments yet. Be the first to say something!</div>
          ) : (
            comments.map((comment) => (
              <div className="comment-item" key={comment._id}>
                <div className="avatar-placeholder" style={{ width: '32px', height: '32px', fontSize: '12px' }}>
                  {comment.author?.avatar ? (
                    <img src={comment.author.avatar} alt={comment.author.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    getInitials(comment.author?.name || 'User')
                  )}
                </div>
                <div className="comment-content">
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                    <span className="comment-author-name">{comment.author?.name || 'User'}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>@{comment.author?.username || 'user'}</span>
                    <span className="comment-date">{formatDate(comment.createdAt)}</span>
                  </div>
                  <p className="comment-text">{comment.content}</p>
                  
                  <span className="comment-sentiment-badge">
                    Sentiment: Disabled
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        <form className="comment-form" onSubmit={handleSubmit}>
          <input
            className="comment-input-area"
            placeholder="Write a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            required
            disabled={submitting}
          />
          <button className="comment-submit-btn" type="submit" disabled={!newComment.trim() || submitting}>
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default CommentSection;
