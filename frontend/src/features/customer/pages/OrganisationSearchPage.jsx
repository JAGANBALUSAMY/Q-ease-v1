import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../utils/api';
import '../styles/OrganisationSearchPage.css';

const OrganisationSearchPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [organisations, setOrganisations] = useState([]);
  const [recentOrganisations, setRecentOrganisations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Load featured organisations on mount
    loadFeaturedOrganisations();
    // Load recent organisations from localStorage
    loadRecentOrganisations();
  }, []);

  const loadFeaturedOrganisations = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await api.get('/organisations/search?limit=10');
      setOrganisations(response.data.data.organisations || []);
    } catch (err) {
      setError('Failed to load organisations');
      console.error('Error loading organisations:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadRecentOrganisations = () => {
    const recent = JSON.parse(localStorage.getItem('recentOrganisations') || '[]');
    setRecentOrganisations(recent.slice(0, 5)); // Show last 5 visited
  };

  const saveToRecent = (org) => {
    const recent = JSON.parse(localStorage.getItem('recentOrganisations') || '[]');
    // Remove if already exists
    const filtered = recent.filter(item => item.id !== org.id);
    // Add to beginning
    const updated = [org, ...filtered];
    // Keep only last 10
    const trimmed = updated.slice(0, 10);
    localStorage.setItem('recentOrganisations', JSON.stringify(trimmed));
    loadRecentOrganisations();
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setLoading(true);
    setError('');
    
    try {
      const response = await api.get(`/organisations/search?q=${encodeURIComponent(searchTerm)}`);
      setOrganisations(response.data.data.organisations || []);
    } catch (err) {
      setError('Search failed. Please try again.');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOrganisationClick = (org) => {
    saveToRecent(org);
    navigate(`/organisation/${org.id}`);
  };

  const handleRecentOrgClick = (org) => {
    saveToRecent(org);
    navigate(`/organisation/${org.id}`);
  };

  const handleScanQR = () => {
    // TODO: Implement QR code scanning
    alert('QR code scanning feature coming soon!');
  };

  const handleEnterCode = () => {
    const code = prompt('Enter 6-digit organisation code:');
    if (code && code.length === 6) {
      // Search by code
      setSearchTerm(code);
      handleSearch({ preventDefault: () => {} });
    }
  };

  return (
    <div className="search-page">
      <div className="search-header">
        <h1>Welcome to Q-Ease</h1>
        <p>Join digital queues instantly. No more waiting in lines.</p>
      </div>

      {/* Recent Organisations Section */}
      {recentOrganisations.length > 0 && (
        <div className="recent-section">
          <h2>Recently Visited</h2>
          <div className="recent-grid">
            {recentOrganisations.map((org) => (
              <div 
                key={org.id} 
                className="recent-card"
                onClick={() => handleRecentOrgClick(org)}
              >
                <h3>{org.name}</h3>
                <p className="org-location">{org.city}, {org.country}</p>
                <p className="org-code">Code: {org.code}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="search-section">
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-input-container">
            <input
              type="text"
              placeholder="Search by name, location, or organisation code"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="search-button" disabled={loading}>
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>
        
        <div className="quick-actions">
          <button onClick={handleScanQR} className="action-button scan-button">
            📷 Scan QR Code
          </button>
          <button onClick={handleEnterCode} className="action-button code-button">
            #️⃣ Enter Code
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="results-section">
        {loading ? (
          <div className="loading-results">
            <div className="spinner"></div>
            <p>Searching organisations...</p>
          </div>
        ) : organisations.length > 0 ? (
          <div className="organisations-grid">
            {organisations.map((org) => (
              <div 
                key={org.id} 
                className="organisation-card"
                onClick={() => handleOrganisationClick(org)}
              >
                <div className="org-header">
                  <h3>{org.name}</h3>
                  {org.isVerified && (
                    <span className="verified-badge">✓ Verified</span>
                  )}
                </div>
                <div className="org-details">
                  <p className="org-location">{org.city}, {org.country}</p>
                  <p className="org-code">Code: {org.code}</p>
                  {org.averageWaitTime && (
                    <p className="wait-time">Avg. Wait: {org.averageWaitTime} mins</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : searchTerm ? (
          <div className="empty-state">
            <h3>No organisations found</h3>
            <p>Try different search terms or scan a QR code</p>
            <button onClick={handleScanQR} className="retry-button">
              Scan QR Code
            </button>
          </div>
        ) : (
          <div className="empty-state">
            <h3>No organisations available</h3>
            <p>Try searching for organisations or scan a QR code</p>
            <div className="empty-actions">
              <button onClick={handleScanQR} className="action-button">
                Scan QR Code
              </button>
              <button onClick={handleEnterCode} className="action-button">
                Enter Organisation Code
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrganisationSearchPage;