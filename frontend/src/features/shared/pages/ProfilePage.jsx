import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../utils/api';
import '../styles/ProfilePage.css';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    notificationPreferences: {
      email: true,
      sms: false,
      push: true
    },
    securitySettings: {
      twoFactorEnabled: false,
      passwordLastChanged: null
    }
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await api.get('/users/profile');
      setProfile(response.data.data.user);
    } catch (err) {
      setError('Failed to load profile');
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setProfile(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setProfile(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.put('/users/profile', profile);
      updateUser(response.data.data.user);
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
      console.error('Error updating profile:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setChangingPassword(true);
    setError('');
    setSuccess('');

    // Password change form would be here
    setChangingPassword(false);
  };

  const handleAccountDeletion = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete('/users/account');
      // Logout user after account deletion
      navigate('/login');
    } catch (err) {
      setError('Failed to delete account');
      console.error('Error deleting account:', err);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="page-header">
        <button onClick={() => navigate(-1)} className="back-button">
          ← Back
        </button>
        <h1>Profile Settings</h1>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {success && (
        <div className="success-message">
          {success}
        </div>
      )}

      <div className="profile-content">
        {/* Personal Information */}
        <div className="profile-section">
          <h2>Personal Information</h2>
          <form onSubmit={handleSaveProfile} className="profile-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">First Name</label>
                <input
                  type="text"
                  id="firstName"
                  value={profile.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  placeholder="Enter first name"
                  disabled={saving}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="lastName">Last Name</label>
                <input
                  type="text"
                  id="lastName"
                  value={profile.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  placeholder="Enter last name"
                  disabled={saving}
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                value={profile.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter email address"
                disabled={saving}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input
                type="tel"
                id="phone"
                value={profile.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="Enter phone number"
                disabled={saving}
              />
            </div>
            
            <button type="submit" className="save-button" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Notification Preferences */}
        <div className="profile-section">
          <h2>Notification Preferences</h2>
          <div className="preferences-grid">
            <div className="preference-item">
              <label className="switch">
                <input
                  type="checkbox"
                  checked={profile.notificationPreferences.email}
                  onChange={(e) => handleInputChange('notificationPreferences.email', e.target.checked)}
                />
                <span className="slider"></span>
              </label>
              <div className="preference-info">
                <h3>Email Notifications</h3>
                <p>Receive updates via email</p>
              </div>
            </div>
            
            <div className="preference-item">
              <label className="switch">
                <input
                  type="checkbox"
                  checked={profile.notificationPreferences.sms}
                  onChange={(e) => handleInputChange('notificationPreferences.sms', e.target.checked)}
                />
                <span className="slider"></span>
              </label>
              <div className="preference-info">
                <h3>SMS Notifications</h3>
                <p>Receive text messages</p>
              </div>
            </div>
            
            <div className="preference-item">
              <label className="switch">
                <input
                  type="checkbox"
                  checked={profile.notificationPreferences.push}
                  onChange={(e) => handleInputChange('notificationPreferences.push', e.target.checked)}
                />
                <span className="slider"></span>
              </label>
              <div className="preference-info">
                <h3>Push Notifications</h3>
                <p>Receive in-app notifications</p>
              </div>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="profile-section">
          <h2>Security Settings</h2>
          <div className="security-info">
            <div className="security-item">
              <h3>Two-Factor Authentication</h3>
              <p>Extra security layer for your account</p>
              <button className="security-toggle">
                {profile.securitySettings.twoFactorEnabled ? 'Disable' : 'Enable'}
              </button>
            </div>
            
            <div className="security-item">
              <h3>Password</h3>
              <p>Last changed: {profile.securitySettings.passwordLastChanged || 'Never'}</p>
              <button 
                onClick={() => document.getElementById('password-modal').showModal()}
                className="change-password-button"
              >
                Change Password
              </button>
            </div>
          </div>
        </div>

        {/* Account Management */}
        <div className="profile-section">
          <h2>Account Management</h2>
          <div className="account-actions">
            <button 
              onClick={handleAccountDeletion}
              className="delete-account-button"
            >
              Delete Account
            </button>
            <p className="warning-text">
              Warning: This will permanently delete your account and all associated data.
            </p>
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      <dialog id="password-modal" className="modal">
        <div className="modal-content">
          <div className="modal-header">
            <h3>Change Password</h3>
            <button 
              onClick={() => document.getElementById('password-modal').close()}
              className="close-button"
            >
              ×
            </button>
          </div>
          <form onSubmit={handleChangePassword} className="password-form">
            <div className="form-group">
              <label>Current Password</label>
              <input type="password" placeholder="Enter current password" required />
            </div>
            <div className="form-group">
              <label>New Password</label>
              <input type="password" placeholder="Enter new password" required />
            </div>
            <div className="form-group">
              <label>Confirm New Password</label>
              <input type="password" placeholder="Confirm new password" required />
            </div>
            <div className="form-actions">
              <button type="button" onClick={() => document.getElementById('password-modal').close()}>
                Cancel
              </button>
              <button type="submit" disabled={changingPassword}>
                {changingPassword ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </form>
        </div>
      </dialog>
    </div>
  );
};

export default ProfilePage;