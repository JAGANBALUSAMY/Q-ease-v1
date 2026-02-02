import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useSocket } from '../../../contexts/SocketContext';
import api from '../../../utils/api';
import '../styles/LiveQueueTrackingPage.css';

const LiveQueueTrackingPage = () => {
  const { tokenId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const { joinQueueRoom, leaveQueueRoom, socket } = useSocket();
  const audioRef = useRef(null);
  
  const [token, setToken] = useState(location.state?.token || null);
  const [queue, setQueue] = useState(null);
  const [loading, setLoading] = useState(!token);
  const [error, setError] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Initialize audio
  useEffect(() => {
    // Create audio context for sound alerts
    if (typeof window !== 'undefined' && window.AudioContext) {
      audioRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
  }, []);

  useEffect(() => {
    if (tokenId) {
      loadTokenDetails();
    }
  }, [tokenId]);

  useEffect(() => {
    if (token?.queueId) {
      joinQueueRoom(token.queueId);
      
      // Listen for token updates
      socket?.on('token-update', handleTokenUpdate);
      socket?.on('token-called', handleTokenCalled);
      socket?.on('queue-update', handleQueueUpdate);
    }

    return () => {
      if (token?.queueId) {
        leaveQueueRoom(token.queueId);
        socket?.off('token-update', handleTokenUpdate);
        socket?.off('token-called', handleTokenCalled);
        socket?.off('queue-update', handleQueueUpdate);
      }
    };
  }, [token?.queueId, joinQueueRoom, leaveQueueRoom, socket]);

  useEffect(() => {
    let interval;
    if (token?.estimatedTime) {
      interval = setInterval(() => {
        const now = new Date();
        const estimated = new Date(token.estimatedTime);
        const diff = Math.max(0, Math.floor((estimated - now) / 60000));
        setTimeRemaining(diff);
      }, 60000); // Update every minute
      
      // Initial calculation
      const now = new Date();
      const estimated = new Date(token.estimatedTime);
      const diff = Math.max(0, Math.floor((estimated - now) / 60000));
      setTimeRemaining(diff);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [token?.estimatedTime]);

  const playAlertSound = () => {
    try {
      if (audioRef.current) {
        const oscillator = audioRef.current.createOscillator();
        const gainNode = audioRef.current.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioRef.current.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioRef.current.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioRef.current.currentTime + 0.5);
        
        oscillator.start(audioRef.current.currentTime);
        oscillator.stop(audioRef.current.currentTime + 0.5);
      }
    } catch (err) {
      console.log('Audio alert failed:', err);
    }
  };

  const loadTokenDetails = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await api.get(`/users/me/tokens/${tokenId}`);
      const tokenData = response.data.data.token;
      setToken(tokenData);
      
      // Load queue details
      const queueResponse = await api.get(`/queues/${tokenData.queueId}`);
      setQueue(queueResponse.data.data.queue);
      
      setLastUpdated(new Date());
    } catch (err) {
      setError('Failed to load token details');
      console.error('Error loading token:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    await loadTokenDetails();
  };

  const handleTokenUpdate = (data) => {
    if (data.tokenId === tokenId) {
      setToken(prev => ({ ...prev, ...data }));
      setLastUpdated(new Date());
    }
  };

  const handleTokenCalled = (data) => {
    if (data.tokenId === tokenId) {
      setToken(prev => ({ ...prev, status: 'CALLED' }));
      setLastUpdated(new Date());
      
      // Play audio alert
      playAlertSound();
      
      // Show notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Your token has been called!', {
          body: `Please proceed to ${queue?.name || 'the service counter'}`,
          icon: '/favicon.ico'
        });
      }
    }
  };

  const handleQueueUpdate = (data) => {
    if (token?.queueId === data.queueId) {
      setQueue(prev => ({ ...prev, ...data }));
      setLastUpdated(new Date());
    }
  };

  const cancelToken = async () => {
    if (!window.confirm('Are you sure you want to cancel your token?')) return;

    try {
      await api.put(`/tokens/${tokenId}/cancel`);
      navigate('/');
    } catch (err) {
      setError('Failed to cancel token');
      console.error('Error cancelling token:', err);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'CALLED': return '#f39c12';
      case 'SERVED': return '#27ae60';
      case 'CANCELLED': return '#e74c3c';
      case 'MISSED': return '#e67e22';
      default: return '#3498db';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'PENDING': return 'Waiting in queue';
      case 'CALLED': return 'Your token has been called!';
      case 'SERVED': return 'Service completed';
      case 'CANCELLED': return 'Cancelled';
      case 'MISSED': return 'Missed turn';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading token details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-page">
        <div className="error-card">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={loadTokenDetails} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="error-page">
        <div className="error-card">
          <h2>Token Not Found</h2>
          <p>The requested token could not be found.</p>
          <button onClick={() => navigate('/')} className="back-button">
            Back to Search
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="tracking-page">
      <div className="tracking-header">
        <h1>Queue Tracking</h1>
        <p>Your token is being tracked in real-time</p>
        <div className="last-updated">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </div>
      </div>

      <div className="token-display">
        <div className="token-number">
          <span className="display-token">{token.displayToken}</span>
        </div>
        <div 
          className="token-status" 
          style={{ backgroundColor: getStatusColor(token.status) }}
        >
          {getStatusText(token.status)}
        </div>
      </div>

      <div className="tracking-info">
        <div className="info-card">
          <div className="card-header">
            <h3>Queue Information</h3>
            <button onClick={refreshData} className="refresh-button">
              ↻ Refresh
            </button>
          </div>
          <p><strong>Service:</strong> {location.state?.queueName || queue?.name || 'Loading...'}</p>
          <p><strong>Your Position:</strong> #{token.position}</p>
          {timeRemaining > 0 && (
            <p><strong>Estimated Wait:</strong> ~{timeRemaining} minutes</p>
          )}
          {queue?.currentToken && (
            <p><strong>Currently Serving:</strong> {queue.currentToken}</p>
          )}
          <p><strong>People Waiting:</strong> {queue?.waitingCount || 'Loading...'}</p>
        </div>

        {token.status === 'PENDING' && (
          <div className="progress-section">
            <h3>Your Progress</h3>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${Math.max(0, 100 - ((token.position - 1) * 10))}%` }}
              ></div>
            </div>
            <p>You are {token.position > 1 ? `${token.position - 1} people` : 'next'} away from being served</p>
          </div>
        )}

        {token.status === 'CALLED' && (
          <div className="called-section">
            <div className="called-icon">🔔</div>
            <h3>You've Been Called!</h3>
            <p>Please proceed to the service counter immediately.</p>
            <p><strong>Counter:</strong> {queue?.name || 'Main Counter'}</p>
          </div>
        )}
      </div>

      <div className="actions">
        {token.status === 'PENDING' && (
          <button onClick={cancelToken} className="cancel-button">
            Cancel Token
          </button>
        )}
        
        <button onClick={() => navigate('/')} className="new-token-button">
          Get New Token
        </button>
      </div>

      <div className="notifications-section">
        <h3>Notifications</h3>
        <p>We'll notify you when your token is called</p>
        <div className="notification-controls">
          <button 
            onClick={() => {
              if ('Notification' in window) {
                Notification.requestPermission();
              }
            }}
            className="enable-notifications"
          >
            Enable Push Notifications
          </button>
          <button 
            onClick={playAlertSound}
            className="test-audio"
          >
            Test Audio Alert
          </button>
        </div>
      </div>
    </div>
  );
};

export default LiveQueueTrackingPage;