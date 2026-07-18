import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import RightSidebar from '../components/RightSidebar';
import PostCard from '../components/PostCard';
import CommentSection from '../components/CommentSection';
import { useAuth } from '../context/AuthContext';
import { X, Lock, Check, UserCheck } from 'lucide-react';
import './Profile.css';

const Profile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, token, updateProfile } = useAuth();
  
  const [profileUser, setProfileUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeCommentPost, setActiveCommentPost] = useState(null);
  const [commentsCounts, setCommentsCounts] = useState({});
  const [isFollowing, setIsFollowing] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [followRequests, setFollowRequests] = useState([]);
  const [followLoading, setFollowLoading] = useState(false);
  
  // Edit Form Fields
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/users/${username}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setProfileUser(data.user);
        setPosts(data.posts || []);
        setIsFollowing(data.isFollowing || false);
        setHasPendingRequest(data.hasPendingRequest || false);

        // Prepopulate form fields
        setEditName(data.user.name || '');
        setEditBio(data.user.bio || '');
        setEditAvatar(data.user.avatar || '');

        // Fetch comments count for each post
        (data.posts || []).forEach(post => {
          fetchCommentsCount(post._id);
        });
      } else {
        navigate('/');
      }
    } catch (err) {
      console.error('Error fetching profile data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowRequests = async () => {
    try {
      const response = await fetch('/api/users/me/follow-requests', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setFollowRequests(data);
      }
    } catch (err) {
      console.error('Error fetching follow requests:', err);
    }
  };

  const fetchCommentsCount = async (postId) => {
    try {
      const response = await fetch(`/api/comments/post/${postId}`);
      if (response.ok) {
        const comments = await response.json();
        setCommentsCounts(prev => ({
          ...prev,
          [postId]: comments.length
        }));
      }
    } catch (err) {
      console.error(`Error fetching comments count for ${postId}:`, err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProfileData();
    }
  }, [username, token]);

  useEffect(() => {
    const isOwn = currentUser?.username === username;
    if (isOwn && token) {
      fetchFollowRequests();
    }
  }, [username, token, currentUser]);

  const handleFollowToggle = async () => {
    if (!profileUser) return;
    setFollowLoading(true);
    try {
      const response = await fetch(`/api/users/${profileUser._id}/follow`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'unfollowed') {
          setIsFollowing(false);
          setHasPendingRequest(false);
          setProfileUser(prev => ({
            ...prev,
            followers: (prev.followers || []).filter(id => id.toString() !== (currentUser?.id || currentUser?._id).toString())
          }));
          // Remove posts from view since no longer following
          setPosts([]);
        } else if (data.status === 'request_sent') {
          setHasPendingRequest(true);
        } else if (data.status === 'request_cancelled') {
          setHasPendingRequest(false);
        }
      }
    } catch (err) {
      console.error('Error toggling follow:', err);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleAcceptRequest = async (requesterId) => {
    try {
      const response = await fetch(`/api/users/${requesterId}/accept-follow`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setFollowRequests(prev => prev.filter(r => r._id !== requesterId));
        // Update follower count
        setProfileUser(prev => ({
          ...prev,
          followers: [...(prev.followers || []), requesterId]
        }));
      }
    } catch (err) {
      console.error('Error accepting follow request:', err);
    }
  };

  const handleDeclineRequest = async (requesterId) => {
    try {
      const response = await fetch(`/api/users/${requesterId}/decline-follow`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setFollowRequests(prev => prev.filter(r => r._id !== requesterId));
      }
    } catch (err) {
      console.error('Error declining follow request:', err);
    }
  };

  const handleEditProfileSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updatedUser = await updateProfile({
        name: editName,
        bio: editBio,
        avatar: editAvatar
      });
      setProfileUser(updatedUser);
      setIsEditModalOpen(false);
    } catch (err) {
      alert(err.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLikePost = async (postId) => {
    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const updatedPost = await response.json();
        setPosts(posts.map(p => p._id === postId ? { ...p, likes: updatedPost.likes } : p));
      }
    } catch (err) {
      console.error('Error liking post:', err);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setPosts(posts.filter(p => p._id !== postId));
      }
    } catch (err) {
      console.error('Error deleting post:', err);
    }
  };

  const handleCommentAdded = (postId) => {
    setCommentsCounts(prev => ({
      ...prev,
      [postId]: (prev[postId] || 0) + 1
    }));
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const isOwnProfile = currentUser?.username === username;

  if (loading && !profileUser) {
    return (
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <div style={{ textAlign: 'center', color: 'var(--text-light)', padding: '100px' }}>Loading profile...</div>
        </main>
        <RightSidebar />
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        <div className="page-header">
          <h2>Profile</h2>
        </div>

        <div className="profile-header-container">
          <div className="profile-banner"></div>
          
          <div className="profile-info-section">
            <div className="profile-avatar-row">
              <div className="profile-avatar">
                {profileUser.avatar ? (
                  <img src={profileUser.avatar} alt={profileUser.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  getInitials(profileUser.name)
                )}
              </div>
              
              {isOwnProfile ? (
                <button className="edit-profile-btn" onClick={() => setIsEditModalOpen(true)}>
                  Edit Profile
                </button>
              ) : (
                <button
                  className={`edit-profile-btn ${isFollowing ? 'following-btn' : hasPendingRequest ? 'pending-btn' : ''}`}
                  onClick={handleFollowToggle}
                  disabled={followLoading}
                >
                  {followLoading ? '...' : isFollowing ? 'Following' : hasPendingRequest ? 'Requested' : 'Follow'}
                </button>
              )}
            </div>

            <div className="profile-user-names">
              <span className="profile-display-name">{profileUser.name}</span>
              <span className="profile-handle">@{profileUser.username}</span>
            </div>

            {profileUser.bio ? (
              <p className="profile-bio">{profileUser.bio}</p>
            ) : (
              <p className="profile-bio" style={{ color: 'var(--text-light)', fontStyle: 'italic' }}>No bio written yet.</p>
            )}

            <div className="profile-stats-row">
              <span className="profile-stat-item">
                <span className="profile-stat-number">{profileUser.following ? profileUser.following.length : 0}</span> Following
              </span>
              <span className="profile-stat-item">
                <span className="profile-stat-number">{profileUser.followers ? profileUser.followers.length : 0}</span> Followers
              </span>
            </div>
          </div>
        </div>

        {/* Follow Requests (only visible on own profile) */}
        {isOwnProfile && followRequests.length > 0 && (
          <div className="feed-container" style={{ paddingTop: '8px', marginBottom: '0' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: '700', margin: '8px 0 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserCheck size={18} /> Follow Requests
              <span style={{ fontSize: '12px', fontWeight: '600', background: 'var(--accent)', color: '#fff', borderRadius: '999px', padding: '2px 8px' }}>
                {followRequests.length}
              </span>
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {followRequests.map(requester => (
                <div key={requester._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div className="avatar-placeholder" style={{ width: '38px', height: '38px', fontSize: '13px', flexShrink: 0 }}>
                      {requester.avatar ? (
                        <img src={requester.avatar} alt={requester.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        getInitials(requester.name)
                      )}
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '14px' }}>{requester.name || requester.username}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>@{requester.username}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleAcceptRequest(requester._id)}
                      style={{ padding: '6px 14px', borderRadius: '8px', background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Check size={14} /> Accept
                    </button>
                    <button
                      onClick={() => handleDeclineRequest(requester._id)}
                      style={{ padding: '6px 14px', borderRadius: '8px', background: 'var(--surface-alt)', color: 'var(--text-muted)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <X size={14} /> Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Posts section */}
        <div className="feed-container" style={{ paddingTop: '8px' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: '700', margin: '8px 0' }}>Posts</h3>
          
          {!isOwnProfile && !isFollowing ? (
            <div style={{ textAlign: 'center', color: 'var(--text-light)', padding: '50px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <Lock size={40} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
              <p style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-muted)' }}>This profile is private</p>
              <p style={{ fontSize: '13px', color: 'var(--text-light)' }}>
                {hasPendingRequest ? 'Your follow request is pending approval.' : 'Follow this person to see their posts.'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {posts.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-light)', padding: '40px' }}>No posts published by this user.</div>
              ) : (
                posts.map((post) => (
                  <PostCard
                    key={post._id}
                    post={post}
                    onLike={handleLikePost}
                    onDelete={handleDeletePost}
                    onCommentClick={setActiveCommentPost}
                    commentsCount={commentsCounts[post._id] || 0}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </main>

      <RightSidebar />

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="modal-overlay" onClick={() => setIsEditModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Profile</h3>
              <button onClick={() => setIsEditModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleEditProfileSave}>
              <div className="modal-body">
                <div className="form-group">
                  <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)' }}>Display Name</label>
                  <input
                    type="text"
                    className="auth-input"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)' }}>Profile Picture URL</label>
                  <input
                    type="url"
                    className="auth-input"
                    placeholder="https://example.com/avatar.jpg"
                    value={editAvatar}
                    onChange={(e) => setEditAvatar(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)' }}>Bio</label>
                  <textarea
                    className="auth-input"
                    style={{ minHeight: '80px', resize: 'vertical' }}
                    placeholder="Tell us about yourself..."
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ marginTop: '20px' }}>
                <button
                  type="button"
                  className="modal-btn modal-btn-cancel"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="modal-btn modal-btn-save"
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeCommentPost && (
        <CommentSection
          post={activeCommentPost}
          onClose={() => setActiveCommentPost(null)}
          onCommentAdded={handleCommentAdded}
        />
      )}
    </div>
  );
};

export default Profile;
