import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useSocket } from '../../../contexts/SocketContext';
import api from '../../../utils/api';
import '../styles/StaffCallNextPage.css';

const StaffCallNextPage = () => {
  const { queueId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();
  
  const [queue, setQueue] = useState(null);
  const [pendingTokens, setPendingTokens] = useState([]);
  const [currentToken, setCurrentToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [calling, setCalling] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadQueueData();
  }, [queueId]);

  useEffect(() => {
    // Listen for real-time updates
    socket?.on('token-update', handleTokenUpdate);
    socket?.on('queue-update', handleQueueUpdate);

    return () => {
      socket?.off('token-update', handleTokenUpdate);
      socket?.off('queue-update', handleQueueUpdate);
    };
  }, [socket]);

  const loadQueueData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Load queue details
      const queueResponse = await api.get(`/queues/${queueId}`);
      setQueue(queueResponse.data.data.queue);
      
      // Load pending tokens
      const tokensResponse = await api.get(`/queues/${queueId}/pending-tokens`);
      setPendingTokens(tokensResponse.data.data.tokens || []);
      
      // Load current token
      const currentResponse = await api.get(`/queues/${queueId}/current-token`);
      setCurrentToken(currentResponse.data.data.token || null);
    } catch (err) {
      setError('Failed to load queue data');
      console.error('Error loading queue data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTokenUpdate = (data) => {
    if (data.queueId === queueId) {
      loadQueueData(); // Refresh all data
    }
  };

  const handleQueueUpdate = (data) => {
    if (data.queueId === queueId) {
      setQueue(prev => ({ ...prev, ...data }));
    }
  };

  const callNextToken = async () => {
    if (pendingTokens.length === 0) {
      setError('No tokens in queue');
      return;
    }

    setCalling(true);
    setError('');

    try {
      const response = await api.put(`/queues/${queueId}/call-next`);
      const { token } = response.data.data;
      
      // Update local state
      setCurrentToken(token);
      setPendingTokens(prev => prev.filter(t => t.id !== token.id));
      
      // Show success notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Token Called', {
          body: `Token ${token.displayToken} has been called`,
          icon: '/favicon.ico'
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to call next token');
      console.error('Error calling next token:', err);
    } finally {
      setCalling(false);
    }
  };

  const skipToken = async (tokenId) => {
    if (!window.confirm('Are you sure you want to skip this token?')) return;

    try {
      await api.put(`/tokens/${tokenId}/skip`);
      loadQueueData(); // Refresh data
    } catch (err) {
      setError('Failed to skip token');
      console.error('Error skipping token:', err);
    }
  };

  const serveToken = async (tokenId) => {
    try {
      await api.put(`/tokens/${tokenId}/serve`);
      loadQueueData(); // Refresh data
    } catch (err) {
      setError('Failed to serve token');
      console.error('Error serving token:', err);
    }
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'EMERGENCY': return 'emergency';
      case 'PRIORITY': return 'priority';
      default: return 'normal';
    }
  };

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 'EMERGENCY': return '🚨 Emergency';
      case 'PRIORITY': return '⭐ Priority';
      default: return '⚪ Normal';
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading queue data...</p>
      </div>
    );
  }

  if (error && !queue) {
    return (
      <div className="error-page">
        <div className="error-card">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={loadQueueData} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="call-next-page">
      <div className="page-header">
        <button onClick={() => navigate(-1)} className="back-button">
          ← Back to Dashboard
        </button>
        <h1>Queue Management</h1>
        {queue && (
          <div className="queue-info">
            <h2>{queue.name}</h2>
            <div className="queue-status">
              <span className={`status-indicator ${queue.isActive ? 'active' : 'paused'}`}>
                {queue.isActive ? '🟢 Active' : '🔴 Paused'}
              </span>
              <span>👥 Waiting: {pendingTokens.length}</span>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {!queue?.isActive ? (
        <div className="queue-paused">
          <h3>Queue Paused</h3>
          <p>This queue is currently paused. Please resume the queue to call customers.</p>
        </div>
      ) : (
        <div className="queue-management">
          
          {/* Current Token Section */}
          <div className="current-token-section">
            <h3>Currently Serving</h3>
            {currentToken ? (
              <div className="current-token-card">
                <div className="token-header">
                  <span className="token-display">{currentToken.displayToken}</span>
                  <span className={`priority-badge ${getPriorityClass(currentToken.priority)}`}>
                    {getPriorityLabel(currentToken.priority)}
                  </span>
                </div>
                <div className="token-details">
                  <p><strong>Position:</strong> #{currentToken.position}</p>
                  <p><strong>Called at:</strong> {new Date(currentToken.calledAt).toLocaleTimeString()}</p>
                  {currentToken.customerName && (
                    <p><strong>Customer:</strong> {currentToken.customerName}</p>
                  )}
                </div>
                <button 
                  onClick={() => serveToken(currentToken.id)}
                  className="serve-button"
                >
                  Mark as Served
                </button>
              </div>
            ) : (
              <div className="no-current-token">
                <p>No token currently being served</p>
              </div>
            )}
          </div>

          {/* Pending Tokens Section */}
          <div className="pending-tokens-section">
            <div className="section-header">
              <h3>Pending Tokens ({pendingTokens.length})</h3>
              <button 
                onClick={callNextToken}
                disabled={calling || pendingTokens.length === 0}
                className="call-next-button"
              >
                {calling ? 'Calling...' : 'CallCheck Next Customer'}
              </button>
            </div>

            {pendingTokens.length > 0 ? (
              <div className="tokens-list">
                {pendingTokens.map((token, index) => (
                  <div key={token.id} className="token-item">
                    <div className="token-main">
                      <div className="token-info">
                        <span className="token-position">#{index + 1}</span>
                        <span className="token-display">{token.displayToken}</span>
                        <span className={`priority-badge ${getPriorityClass(token.priority)}`}>
                          {getPriorityLabel(token.priority)}
                        </span>
                      </div>
                      <div className="token-time">
                        <span>Issued: {new Date(token.issuedAt).toLocaleTimeString()}</span>
                      </div>
                    </div>
                    <div className="token-actions">
                      <button 
                        onClick={() => skipToken(token.id)}
                        className="skip-button"
                      >
                        Skip
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <h4>No tokens in queue</h4>
                <p>There are currently no customers waiting in this queue.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffCallNextPage;