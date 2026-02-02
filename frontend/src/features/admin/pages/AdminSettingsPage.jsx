import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../utils/api';
import '../styles/AdminSettingsPage.css';

const AdminSettingsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [organisation, setOrganisation] = useState({
    name: '',
    code: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    operatingHours: {
      start: '09:00',
      end: '17:00',
      days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
    },
    notificationSettings: {
      emailNotifications: true,
      smsNotifications: true,
      pushNotifications: true,
      tokenReminderMinutes: 15
    },
    securitySettings: {
      requireTwoFactor: false,
      sessionTimeout: 60,
      passwordMinLength: 8,
      passwordRequireSpecialChar: true
    }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadOrganisationSettings();
  }, []);

  const loadOrganisationSettings = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await api.get('/organisations/my');
      setOrganisation(response.data.data.organisation);
    } catch (err) {
      setError('Failed to load organisation settings');
      console.error('Error loading settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setOrganisation(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else if (field.includes('operatingHours.days.')) {
      const day = field.split('.')[2];
      setOrganisation(prev => ({
        ...prev,
        operatingHours: {
          ...prev.operatingHours,
          days: prev.operatingHours.days.includes(day)
            ? prev.operatingHours.days.filter(d => d !== day)
            : [...prev.operatingHours.days, day]
        }
      }));
    } else {
      setOrganisation(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await api.put('/organisations/my', organisation);
      setSuccess('Settings saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save settings');
      console.error('Error saving settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = async () => {
    try {
      const response = await api.get('/data/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `organisation-data-${new Date().toISOString().split('T')[0]}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Failed to export data');
      console.error('Error exporting data:', err);
    }
  };

  const handleBackup = async () => {
    try {
      await api.post('/backup/create');
      setSuccess('Backup created successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to create backup');
      console.error('Error creating backup:', err);
    }
  };

  const dayNames = {
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday'
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <div className="page-header">
        <button onClick={() => navigate(-1)} className="back-button">
          ← Back to Dashboard
        </button>
        <h1>Organisation Settings</h1>
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

      <form onSubmit={handleSubmit} className="settings-form">
        {/* Organisation Profile Section */}
        <div className="form-section">
          <h3>Organisation Profile</h3>
          
          <div className="form-group">
            <label htmlFor="name">Organisation Name *</label>
            <input
              type="text"
              id="name"
              value={organisation.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter organisation name"
              required
              disabled={saving}
            />
          </div>

          <div className="form-group">
            <label htmlFor="code">Organisation Code</label>
            <input
              type="text"
              id="code"
              value={organisation.code}
              onChange={(e) => handleInputChange('code', e.target.value)}
              placeholder="Enter organisation code"
              disabled={true} // Code is typically auto-generated
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={organisation.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Enter organisation description"
              rows="3"
              disabled={saving}
            />
          </div>

          <div className="form-group">
            <label htmlFor="address">Address</label>
            <textarea
              id="address"
              value={organisation.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="Enter organisation address"
              rows="2"
              disabled={saving}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="phone">Phone</label>
              <input
                type="tel"
                id="phone"
                value={organisation.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="Enter phone number"
                disabled={saving}
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={organisation.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter email address"
                disabled={saving}
              />
            </div>
          </div>
        </div>

        {/* Operating Hours Section */}
        <div className="form-section">
          <h3>Operating Hours</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="operatingHours.start">Opening Time</label>
              <input
                type="time"
                id="operatingHours.start"
                value={organisation.operatingHours.start}
                onChange={(e) => handleInputChange('operatingHours.start', e.target.value)}
                disabled={saving}
              />
            </div>

            <div className="form-group">
              <label htmlFor="operatingHours.end">Closing Time</label>
              <input
                type="time"
                id="operatingHours.end"
                value={organisation.operatingHours.end}
                onChange={(e) => handleInputChange('operatingHours.end', e.target.value)}
                disabled={saving}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Operating Days</label>
            <div className="checkbox-grid">
              {Object.entries(dayNames).map(([key, value]) => (
                <label key={key} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={organisation.operatingHours.days.includes(key)}
                    onChange={() => handleInputChange(`operatingHours.days.${key}`, null)}
                    disabled={saving}
                  />
                  {value}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="form-section">
          <h3>Notification Settings</h3>
          
          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={organisation.notificationSettings.emailNotifications}
                onChange={(e) => handleInputChange('notificationSettings.emailNotifications', e.target.checked)}
                disabled={saving}
              />
              Enable Email Notifications
            </label>
            
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={organisation.notificationSettings.smsNotifications}
                onChange={(e) => handleInputChange('notificationSettings.smsNotifications', e.target.checked)}
                disabled={saving}
              />
              Enable SMS Notifications
            </label>
            
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={organisation.notificationSettings.pushNotifications}
                onChange={(e) => handleInputChange('notificationSettings.pushNotifications', e.target.checked)}
                disabled={saving}
              />
              Enable Push Notifications
            </label>
          </div>

          <div className="form-group">
            <label htmlFor="notificationSettings.tokenReminderMinutes">Token Reminder (minutes before)</label>
            <input
              type="number"
              id="notificationSettings.tokenReminderMinutes"
              value={organisation.notificationSettings.tokenReminderMinutes}
              onChange={(e) => handleInputChange('notificationSettings.tokenReminderMinutes', parseInt(e.target.value))}
              min="1"
              max="60"
              disabled={saving}
            />
          </div>
        </div>

        {/* Security Settings */}
        <div className="form-section">
          <h3>Security Settings</h3>
          
          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={organisation.securitySettings.requireTwoFactor}
                onChange={(e) => handleInputChange('securitySettings.requireTwoFactor', e.target.checked)}
                disabled={saving}
              />
              Require Two-Factor Authentication
            </label>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="securitySettings.sessionTimeout">Session Timeout (minutes)</label>
              <input
                type="number"
                id="securitySettings.sessionTimeout"
                value={organisation.securitySettings.sessionTimeout}
                onChange={(e) => handleInputChange('securitySettings.sessionTimeout', parseInt(e.target.value))}
                min="1"
                max="480"
                disabled={saving}
              />
            </div>

            <div className="form-group">
              <label htmlFor="securitySettings.passwordMinLength">Minimum Password Length</label>
              <input
                type="number"
                id="securitySettings.passwordMinLength"
                value={organisation.securitySettings.passwordMinLength}
                onChange={(e) => handleInputChange('securitySettings.passwordMinLength', parseInt(e.target.value))}
                min="6"
                max="20"
                disabled={saving}
              />
            </div>
          </div>

          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={organisation.securitySettings.passwordRequireSpecialChar}
                onChange={(e) => handleInputChange('securitySettings.passwordRequireSpecialChar', e.target.checked)}
                disabled={saving}
              />
              Require Special Characters in Passwords
            </label>
          </div>
        </div>

        {/* Backup & Export */}
        <div className="form-section">
          <h3>Backup & Export</h3>
          
          <div className="backup-actions">
            <button 
              type="button" 
              onClick={handleBackup}
              className="backup-button"
              disabled={saving}
            >
              Create Backup
            </button>
            
            <button 
              type="button" 
              onClick={handleExportData}
              className="export-button"
              disabled={saving}
            >
              Export Data
            </button>
          </div>
        </div>

        <div className="form-actions">
          <button 
            type="submit" 
            className="save-button"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminSettingsPage;