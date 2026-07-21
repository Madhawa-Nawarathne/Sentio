import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import RightSidebar from '../components/RightSidebar';
import PostCard from '../components/PostCard';
import CommentSection from '../components/CommentSection';
import { useAuth } from '../context/AuthContext';
import { X, Lock, Upload, Image } from 'lucide-react';
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
  const [followLoading, setFollowLoading] = useState(false);
  const [activeListModal, setActiveListModal] = useState(null); // { title: 'Followers' | 'Following', users: [] }
  
  // Edit Form Fields
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [editHeader, setEditHeader] = useState('');
  const [avatarPreview, setAvatarPreview] = useState('');
  const [headerPreview, setHeaderPreview] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const avatarInputRef = useRef(null);
  const headerInputRef = useRef(null);

  const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB

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
        setEditHeader(data.user.header || '');
        setAvatarPreview(data.user.avatar || '');
        setHeaderPreview(data.user.header || '');

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

  const handleFileSelect = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadError('');

    if (file.size > MAX_FILE_SIZE) {
      setUploadError(`${type === 'avatar' ? 'Profile picture' : 'Header image'} must be less than 2 MB`);
      return;
    }

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (type === 'avatar') {
        setEditAvatar(reader.result);
        setAvatarPreview(reader.result);
      } else {
        setEditHeader(reader.result);
        setHeaderPreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setEditAvatar('');
    setAvatarPreview('');
    if (avatarInputRef.current) avatarInputRef.current.value = '';
  };

  const handleRemoveHeader = () => {
    setEditHeader('');
    setHeaderPreview('');
    if (headerInputRef.current) headerInputRef.current.value = '';
  };

  const handleEditProfileSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updatedUser = await updateProfile({
        name: editName,
        bio: editBio,
        avatar: editAvatar,
        header: editHeader
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
          <div
            className="profile-banner"
            style={profileUser.header ? {
              backgroundImage: `url(${profileUser.header})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            } : {}}
          ></div>
          
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
              <span
                className={`profile-stat-item ${isOwnProfile ? 'clickable-stat' : ''}`}
                onClick={() => isOwnProfile && setActiveListModal({ title: 'Following', users: profileUser.following || [] })}
              >
                <span className="profile-stat-number">{profileUser.following ? profileUser.following.length : 0}</span> Following
              </span>
              <span
                className={`profile-stat-item ${isOwnProfile ? 'clickable-stat' : ''}`}
                onClick={() => isOwnProfile && setActiveListModal({ title: 'Followers', users: profileUser.followers || [] })}
              >
                <span className="profile-stat-number">{profileUser.followers ? profileUser.followers.length : 0}</span> Followers
              </span>
            </div>
          </div>
        </div>

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

      {/* Followers / Following List Modal (Only for own profile) */}
      {activeListModal && (
        <div className="modal-overlay" onClick={() => setActiveListModal(null)}>
          <div className="modal-content user-list-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{activeListModal.title}</h3>
              <button onClick={() => setActiveListModal(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body user-list-body">
              {activeListModal.users.length === 0 ? (
                <div className="user-list-empty">
                  No {activeListModal.title.toLowerCase()} found.
                </div>
              ) : (
                activeListModal.users.map((u) => (
                  <div
                    key={u._id || u.id || u.username}
                    className="user-list-item"
                    onClick={() => {
                      setActiveListModal(null);
                      navigate(`/profile/${u.username}`);
                    }}
                  >
                    <div className="avatar-placeholder" style={{ width: '40px', height: '40px', fontSize: '13px', flexShrink: 0 }}>
                      {u.avatar ? (
                        <img src={u.avatar} alt={u.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        getInitials(u.name || u.username)
                      )}
                    </div>
                    <div className="user-list-item-info">
                      <div className="user-list-item-name">{u.name || u.username}</div>
                      <div className="user-list-item-handle">@{u.username}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="modal-overlay" onClick={() => setIsEditModalOpen(false)}>
          <div className="modal-content edit-profile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Profile</h3>
              <button onClick={() => setIsEditModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleEditProfileSave}>
              <div className="modal-body">
                {uploadError && (
                  <div className="upload-error">{uploadError}</div>
                )}

                {/* Header Image Upload */}
                <div className="form-group">
                  <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)' }}>Header Image</label>
                  <div
                    className="header-upload-area"
                    onClick={() => headerInputRef.current?.click()}
                    style={headerPreview ? { backgroundImage: `url(${headerPreview})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
                  >
                    {!headerPreview && (
                      <div className="upload-placeholder">
                        <Image size={24} />
                        <span>Click to upload header image</span>
                        <span className="upload-hint">Max 2 MB</span>
                      </div>
                    )}
                    {headerPreview && (
                      <div className="upload-overlay">
                        <Image size={20} />
                        <span>Change</span>
                      </div>
                    )}
                  </div>
                  <input
                    ref={headerInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => handleFileSelect(e, 'header')}
                  />
                  {headerPreview && (
                    <button type="button" className="remove-upload-btn" onClick={handleRemoveHeader}>
                      Remove header
                    </button>
                  )}
                </div>

                {/* Avatar Upload */}
                <div className="form-group">
                  <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)' }}>Profile Picture</label>
                  <div className="avatar-upload-row">
                    <div
                      className="avatar-upload-preview"
                      onClick={() => avatarInputRef.current?.click()}
                    >
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="Avatar preview" />
                      ) : (
                        <div className="avatar-upload-placeholder">
                          <Upload size={20} />
                        </div>
                      )}
                      <div className="avatar-upload-overlay">
                        <Upload size={16} />
                      </div>
                    </div>
                    <div className="avatar-upload-info">
                      <button type="button" className="upload-btn" onClick={() => avatarInputRef.current?.click()}>
                        Choose Photo
                      </button>
                      <span className="upload-hint">JPG, PNG or GIF. Max 2 MB.</span>
                      {avatarPreview && (
                        <button type="button" className="remove-upload-btn" onClick={handleRemoveAvatar}>
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => handleFileSelect(e, 'avatar')}
                  />
                </div>

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
