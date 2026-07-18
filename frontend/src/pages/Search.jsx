import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import RightSidebar from '../components/RightSidebar';
import { useAuth } from '../context/AuthContext';
import './Search.css';

const Search = () => {
  const navigate = useNavigate();
  const { user: currentUser, token } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`/api/users${searchQuery ? `?search=${searchQuery}` : ''}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchUsers();
    }
  }, [searchQuery, token]);

  const handleFollowToggle = async (userId, e) => {
    e.stopPropagation(); // prevent navigating to profile
    try {
      const response = await fetch(`/api/users/${userId}/follow`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const currentId = currentUser?.id || currentUser?._id;

        setUsers(users.map(u => {
          if (u._id === userId) {
            if (data.status === 'unfollowed') {
              return {
                ...u,
                followers: (u.followers || []).filter(id => id.toString() !== currentId.toString()),
                sentFollowRequests: (u.sentFollowRequests || []).filter(id => id.toString() !== currentId.toString())
              };
            } else if (data.status === 'request_sent') {
              return { ...u, followRequests: [...(u.followRequests || []), currentId] };
            } else if (data.status === 'request_cancelled') {
              return { ...u, followRequests: (u.followRequests || []).filter(id => id.toString() !== currentId.toString()) };
            }
          }
          return u;
        }));
      }
    } catch (err) {
      console.error('Error toggling follow:', err);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getFollowStatus = (suggestedUser) => {
    const currentId = currentUser?.id || currentUser?._id;
    if (!currentId) return 'none';
    const isFollowing = (suggestedUser.followers || []).map(id => id.toString()).includes(currentId.toString());
    if (isFollowing) return 'following';
    const hasPending = (suggestedUser.followRequests || []).map(id => id.toString()).includes(currentId.toString());
    if (hasPending) return 'pending';
    return 'none';
  };

  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        <div className="page-header">
          <h2>Search</h2>
        </div>

        <div className="feed-container search-container">
          <div className="search-input-wrapper">
            <input
              type="text"
              className="search-input"
              placeholder="Search people..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="follow-section">
            <h3 className="trending-title">{searchQuery ? 'Search Results' : 'People You May Know'}</h3>
            
            {loading ? (
              <div style={{ textAlign: 'center', color: 'var(--text-light)', padding: '20px' }}>Loading...</div>
            ) : users.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-light)', padding: '20px' }}>
                {searchQuery ? 'No users found matching your search.' : 'No other users found.'}
              </div>
            ) : (
              <div className="follow-list">
                {users.map((suggestedUser) => {
                  const followStatus = getFollowStatus(suggestedUser);
                  return (
                    <div
                      key={suggestedUser._id}
                      className="follow-item"
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/profile/${suggestedUser.username}`)}
                    >
                      <div className="follow-user-details">
                        <div className="avatar-placeholder" style={{ width: '40px', height: '40px', fontSize: '14px', flexShrink: 0 }}>
                          {suggestedUser.avatar ? (
                            <img src={suggestedUser.avatar} alt={suggestedUser.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                          ) : (
                            getInitials(suggestedUser.name)
                          )}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                          <span style={{ fontWeight: '600', fontSize: '14px' }}>{suggestedUser.name || suggestedUser.username}</span>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>@{suggestedUser.username}</span>
                          {suggestedUser.bio && (
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }}>
                              {suggestedUser.bio}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={(e) => handleFollowToggle(suggestedUser._id, e)}
                        className={`follow-btn ${followStatus === 'following' ? 'following' : ''}`}
                        style={followStatus === 'pending' ? { backgroundColor: 'var(--surface-alt)', color: 'var(--text-muted)', border: '1px solid var(--border)' } : {}}
                      >
                        {followStatus === 'following' ? 'Following' : followStatus === 'pending' ? 'Requested' : 'Follow'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      <RightSidebar />
    </div>
  );
};

export default Search;
