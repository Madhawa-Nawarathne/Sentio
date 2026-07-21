import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import RightSidebar from '../components/RightSidebar';
import { useAuth } from '../context/AuthContext';
import { Check, X, UserCheck, Users } from 'lucide-react';
import './FollowRequests.css';

const FollowRequests = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [followRequests, setFollowRequests] = useState([]);
  const [loading, setLoading] = useState(true);

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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchFollowRequests();
    }
  }, [token]);

  const handleAcceptRequest = async (requesterId) => {
    try {
      const response = await fetch(`/api/users/${requesterId}/accept-follow`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setFollowRequests(prev => prev.filter(r => r._id !== requesterId));
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

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        <div className="page-header">
          <h2>Follow Requests</h2>
        </div>

        <div className="feed-container follow-requests-container">
          {loading ? (
            <div className="fr-empty-state">Loading follow requests...</div>
          ) : followRequests.length === 0 ? (
            <div className="fr-empty-state">
              <div className="fr-empty-icon">
                <Users size={40} />
              </div>
              <p className="fr-empty-title">No pending requests</p>
              <p className="fr-empty-subtitle">When someone requests to follow you, it will appear here.</p>
            </div>
          ) : (
            <div className="fr-list">
              <div className="fr-count-header">
                <UserCheck size={18} />
                <span>{followRequests.length} pending request{followRequests.length !== 1 ? 's' : ''}</span>
              </div>
              {followRequests.map(requester => (
                <div key={requester._id} className="fr-card">
                  <div
                    className="fr-user-info"
                    onClick={() => navigate(`/profile/${requester.username}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="avatar-placeholder" style={{ width: '44px', height: '44px', fontSize: '14px', flexShrink: 0 }}>
                      {requester.avatar ? (
                        <img src={requester.avatar} alt={requester.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        getInitials(requester.name)
                      )}
                    </div>
                    <div className="fr-user-text">
                      <div className="fr-user-name">{requester.name || requester.username}</div>
                      <div className="fr-user-handle">@{requester.username}</div>
                    </div>
                  </div>
                  <div className="fr-actions">
                    <button className="fr-accept-btn" onClick={() => handleAcceptRequest(requester._id)}>
                      <Check size={15} /> Accept
                    </button>
                    <button className="fr-decline-btn" onClick={() => handleDeclineRequest(requester._id)}>
                      <X size={15} /> Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <RightSidebar />
    </div>
  );
};

export default FollowRequests;
