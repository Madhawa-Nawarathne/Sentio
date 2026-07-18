import React from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import RightSidebar from '../components/RightSidebar';
import { useAuth } from '../context/AuthContext';
import { ChevronRight } from 'lucide-react';
import './Settings.css';

const Settings = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        <div className="page-header">
          <h2>Settings</h2>
        </div>

        <div className="feed-container settings-container">
          <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '8px' }}>
            Manage your account preference
          </div>

          <div className="settings-card">
            <div className="settings-section-header">Account</div>
            <div className="settings-list">
              <div className="settings-item settings-item-clickable">
                <div className="settings-item-left">
                  <span className="settings-item-title">Personal Information</span>
                  <span className="settings-item-sub">Name, Email, Phone</span>
                </div>
                <ChevronRight size={18} className="text-light" />
              </div>
              <div className="settings-item settings-item-clickable">
                <div className="settings-item-left">
                  <span className="settings-item-title">Password & Security</span>
                  <span className="settings-item-sub">Change password, Two-factor authentication</span>
                </div>
                <ChevronRight size={18} className="text-light" />
              </div>
              <div className="settings-item settings-item-clickable">
                <div className="settings-item-left">
                  <span className="settings-item-title">Linked Accounts</span>
                  <span className="settings-item-sub">Google, Apple, or Medical Portals</span>
                </div>
                <ChevronRight size={18} className="text-light" />
              </div>
            </div>
          </div>

          <div className="settings-card">
            <div className="settings-section-header">Privacy & Data</div>
            <div className="settings-list">
              <div className="settings-item settings-item-clickable">
                <div className="settings-item-left">
                  <span className="settings-item-title">Privacy Center</span>
                  <span className="settings-item-sub">Who can see your profile/activity</span>
                </div>
                <ChevronRight size={18} className="text-light" />
              </div>
              <div className="settings-item settings-item-clickable">
                <div className="settings-item-left">
                  <span className="settings-item-title">Data Usage</span>
                  <span className="settings-item-sub">Storage, Clear Cache</span>
                </div>
                <ChevronRight size={18} className="text-light" />
              </div>
              <div className="settings-item settings-item-clickable">
                <div className="settings-item-left">
                  <span className="settings-item-title">Permissions</span>
                  <span className="settings-item-sub">Camera, Location, Microphone access</span>
                </div>
                <ChevronRight size={18} className="text-light" />
              </div>
            </div>
          </div>

          <div className="settings-card">
            <div className="settings-section-header">Support & About</div>
            <div className="settings-list">
              <div className="settings-item settings-item-clickable">
                <div className="settings-item-left">
                  <span className="settings-item-title">Help Center</span>
                  <span className="settings-item-sub">FAQs, Contact Support</span>
                </div>
                <ChevronRight size={18} className="text-light" />
              </div>
              <div className="settings-item">
                <div className="settings-item-left">
                  <span className="settings-item-title">App Version</span>
                  <span className="settings-item-sub">1.0.0 (Production)</span>
                </div>
              </div>
            </div>
          </div>

          <button onClick={handleLogout} className="settings-logout-btn">
            Log Out
          </button>
        </div>
      </main>

      <RightSidebar />
    </div>
  );
};

export default Settings;
