import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Home, Search, User, Settings, LogOut, PlusCircle, Brain } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

const Sidebar = ({ onNewPostClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

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
          <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Settings size={22} />
            <span>Settings</span>
          </NavLink>
          <button onClick={handleLogout} className="nav-item" style={{ width: '100%', textAlign: 'left' }}>
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
  );
};

export default Sidebar;
