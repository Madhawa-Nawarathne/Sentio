import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Home, Search, User, Settings, LogOut, PlusCircle, Brain, UserCheck, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

const Sidebar = ({ onNewPostClick }) => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [followRequestCount, setFollowRequestCount] = useState(0);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const confirmLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    const fetchFollowRequestCount = async () => {
      if (!token) return;
      try {
        const response = await fetch('/api/users/me/follow-requests', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setFollowRequestCount(data.length);
        }
      } catch (err) {
        console.error('Error fetching follow request count:', err);
      }
    };

    fetchFollowRequestCount();
    // Re-check every 30 seconds
    const interval = setInterval(fetchFollowRequestCount, 30000);
    return () => clearInterval(interval);
  }, [token]);

  const getInitials = (name) => {
    if (!name) return 'S';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const triggerNewPost = () => {
    if (location.pathname !== '/') {
      navigate('/');
      // Wait a short moment for navigation to complete before focussing
      setTimeout(() => {
        if (onNewPostClick) onNewPostClick();
      }, 100);
    } else if (onNewPostClick) {
      onNewPostClick();
    }
  };

  if (!user) return null;

  return (
    <>
      <aside className="sidebar">
        <div>
          <div className="logo-section">
            <div className="logo-icon">
              <Brain size={24} />
            </div>
            <h1>SENTIO</h1>
          </div>

          <nav className="nav-links">
            <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} end>
              <Home size={22} />
              <span>Home</span>
            </NavLink>
            <NavLink to="/search" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Search size={22} />
              <span>Search</span>
            </NavLink>
            <NavLink to={`/profile/${user.username}`} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <User size={22} />
              <span>Profile</span>
            </NavLink>
            <NavLink to="/follow-requests" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <UserCheck size={22} />
              <span>Follow Requests</span>
              {followRequestCount > 0 && (
                <span className="nav-badge">{followRequestCount}</span>
              )}
            </NavLink>
            <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Settings size={22} />
              <span>Settings</span>
            </NavLink>
            <button onClick={() => setShowLogoutModal(true)} className="nav-item" style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}>
              <LogOut size={22} />
              <span>Logout</span>
            </button>
          </nav>

          <button onClick={triggerNewPost} className="btn-new-post">
            <PlusCircle size={20} />
            <span>NEW POST</span>
          </button>
        </div>

        <div className="user-summary" onClick={() => navigate(`/profile/${user.username}`)} style={{ cursor: 'pointer' }}>
          <div className="avatar-placeholder">
            {user.avatar ? <img src={user.avatar} alt={user.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : getInitials(user.name)}
          </div>
          <div className="user-info">
            <div className="user-info-name">{user.name}</div>
            <div className="user-info-handle">@{user.username}</div>
          </div>
        </div>
      </aside>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="modal-overlay" onClick={() => setShowLogoutModal(false)}>
          <div className="modal-content logout-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-row">
                <LogOut size={20} style={{ color: '#c53030' }} />
                <h3>Log Out</h3>
              </div>
              <button onClick={() => setShowLogoutModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <p style={{ fontSize: '14px', color: 'var(--text-main)', lineHeight: '1.5' }}>
                Are you sure you want to log out of your SENTIO account?
              </p>
            </div>

            <div className="modal-footer" style={{ marginTop: '16px' }}>
              <button
                type="button"
                className="modal-btn modal-btn-cancel"
                onClick={() => setShowLogoutModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="modal-btn"
                style={{ backgroundColor: '#e53e3e', color: '#ffffff' }}
                onClick={confirmLogout}
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
