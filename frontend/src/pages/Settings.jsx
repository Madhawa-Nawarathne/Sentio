import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import RightSidebar from '../components/RightSidebar';
import { useAuth } from '../context/AuthContext';
import { ChevronRight, ChevronDown, User, Lock, HelpCircle, LogOut, X } from 'lucide-react';
import './Settings.css';

const Settings = () => {
  const { user, token, logout, updateProfile } = useAuth();
  const navigate = useNavigate();

  // Expandable sections
  const [expandedSection, setExpandedSection] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Personal info state
  const [editName, setEditName] = useState(user?.name || '');
  const [savingInfo, setSavingInfo] = useState(false);
  const [infoMessage, setInfoMessage] = useState('');

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const confirmLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleSection = (section) => {
    setExpandedSection(prev => prev === section ? null : section);
    setInfoMessage('');
    setPasswordMessage('');
    setPasswordError('');
  };

  const handleSavePersonalInfo = async (e) => {
    e.preventDefault();
    setSavingInfo(true);
    setInfoMessage('');
    try {
      await updateProfile({ name: editName });
      setInfoMessage('Personal information updated successfully!');
    } catch (err) {
      setInfoMessage(err.message || 'Failed to update');
    } finally {
      setSavingInfo(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMessage('');
    setPasswordError('');

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    setSavingPassword(true);
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await response.json();
      if (response.ok) {
        setPasswordMessage(data.message || 'Password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordError(data.message || 'Failed to change password');
      }
    } catch (err) {
      setPasswordError('An error occurred. Please try again.');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        <div className="page-header">
          <h2>Settings</h2>
        </div>

        <div className="feed-container settings-container">
          <div className="settings-intro">
            Manage your account preferences, profile details, and security.
          </div>

          {/* Account Section */}
          <div className="settings-card">
            <div className="settings-section-header">Account</div>
            <div className="settings-list">
              {/* Personal Information */}
              <div className="settings-group-item">
                <div
                  className={`settings-item settings-item-clickable ${expandedSection === 'personal' ? 'active-header' : ''}`}
                  onClick={() => toggleSection('personal')}
                >
                  <div className="settings-item-left">
                    <div className="settings-item-title-row">
                      <User size={18} className="settings-icon" />
                      <span className="settings-item-title">Personal Information</span>
                    </div>
                    <span className="settings-item-sub">View and update your display name and details</span>
                  </div>
                  {expandedSection === 'personal' ? (
                    <ChevronDown size={20} className="chevron-icon" />
                  ) : (
                    <ChevronRight size={20} className="chevron-icon" />
                  )}
                </div>
                {expandedSection === 'personal' && (
                  <div className="settings-expanded-panel">
                    <form onSubmit={handleSavePersonalInfo} className="settings-form">
                      <div className="settings-field-grid">
                        <div className="settings-form-group">
                          <label className="settings-label">Display Name</label>
                          <input
                            type="text"
                            className="settings-input"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            required
                          />
                        </div>
                        <div className="settings-form-group">
                          <label className="settings-label">Email Address</label>
                          <input
                            type="email"
                            className="settings-input settings-input-readonly"
                            value={user?.email || ''}
                            readOnly
                          />
                          <span className="settings-field-hint">Email cannot be changed</span>
                        </div>
                        <div className="settings-form-group full-width">
                          <label className="settings-label">Username</label>
                          <input
                            type="text"
                            className="settings-input settings-input-readonly"
                            value={`@${user?.username || ''}`}
                            readOnly
                          />
                          <span className="settings-field-hint">Username is set permanently</span>
                        </div>
                      </div>

                      {infoMessage && (
                        <div className="settings-alert success">{infoMessage}</div>
                      )}

                      <div className="settings-form-actions">
                        <button
                          type="submit"
                          className="settings-save-btn"
                          disabled={savingInfo}
                        >
                          {savingInfo ? 'Saving...' : 'Save Changes'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>

              {/* Password & Security */}
              <div className="settings-group-item">
                <div
                  className={`settings-item settings-item-clickable ${expandedSection === 'password' ? 'active-header' : ''}`}
                  onClick={() => toggleSection('password')}
                >
                  <div className="settings-item-left">
                    <div className="settings-item-title-row">
                      <Lock size={18} className="settings-icon" />
                      <span className="settings-item-title">Password & Security</span>
                    </div>
                    <span className="settings-item-sub">Update your password to keep your account secure</span>
                  </div>
                  {expandedSection === 'password' ? (
                    <ChevronDown size={20} className="chevron-icon" />
                  ) : (
                    <ChevronRight size={20} className="chevron-icon" />
                  )}
                </div>
                {expandedSection === 'password' && (
                  <div className="settings-expanded-panel">
                    <form onSubmit={handleChangePassword} className="settings-form">
                      <div className="settings-form-group">
                        <label className="settings-label">Current Password</label>
                        <input
                          type="password"
                          className="settings-input"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Enter your current password"
                          required
                        />
                      </div>
                      <div className="settings-field-grid">
                        <div className="settings-form-group">
                          <label className="settings-label">New Password</label>
                          <input
                            type="password"
                            className="settings-input"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Min 6 characters"
                            required
                          />
                        </div>
                        <div className="settings-form-group">
                          <label className="settings-label">Confirm New Password</label>
                          <input
                            type="password"
                            className="settings-input"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Re-enter new password"
                            required
                          />
                        </div>
                      </div>

                      {passwordError && (
                        <div className="settings-alert error">{passwordError}</div>
                      )}
                      {passwordMessage && (
                        <div className="settings-alert success">{passwordMessage}</div>
                      )}

                      <div className="settings-form-actions">
                        <button
                          type="submit"
                          className="settings-save-btn"
                          disabled={savingPassword}
                        >
                          {savingPassword ? 'Updating...' : 'Update Password'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Support & About Section */}
          <div className="settings-card">
            <div className="settings-section-header">Support & About</div>
            <div className="settings-list">
              {/* Help Center item -> navigates to /help */}
              <div
                className="settings-item settings-item-clickable"
                onClick={() => navigate('/help')}
              >
                <div className="settings-item-left">
                  <div className="settings-item-title-row">
                    <HelpCircle size={18} className="settings-icon" />
                    <span className="settings-item-title">Help Center</span>
                  </div>
                  <span className="settings-item-sub">Contact Support, Helplines & Resources</span>
                </div>
                <ChevronRight size={20} className="chevron-icon" />
              </div>

              <div className="settings-item">
                <div className="settings-item-left">
                  <div className="settings-item-title-row">
                    <span className="settings-item-title">App Version</span>
                  </div>
                  <span className="settings-item-sub">1.0.0 (Production)</span>
                </div>
              </div>
            </div>
          </div>

          <button onClick={() => setShowLogoutModal(true)} className="settings-logout-btn">
            <LogOut size={18} />
            <span>Log Out</span>
          </button>
        </div>
      </main>

      <RightSidebar />

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="modal-overlay" onClick={() => setShowLogoutModal(false)}>
          <div className="modal-content logout-confirm-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <div className="modal-title-row" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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

            <div className="modal-footer" style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
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
                style={{ backgroundColor: '#e53e3e', color: '#ffffff', border: 'none', padding: '10px 18px', borderRadius: 'var(--radius-sm)', fontWeight: '600', cursor: 'pointer' }}
                onClick={confirmLogout}
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
