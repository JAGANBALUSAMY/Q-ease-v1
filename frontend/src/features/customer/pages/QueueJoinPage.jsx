import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useSocket } from '../../../contexts/SocketContext';
import api from '../../../utils/api';
import '../styles/QueueJoinPage.css';

const QueueJoinPage = () => {
  const { queueId } = useParams();
  const { user } = useAuth();
  const { joinQueueRoom, leaveQueueRoom } = useSocket();
  const navigate = useNavigate();
  
  const [queue, setQueue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('NORMAL');

  useEffect(() => {
    loadQueueDetails();
    
    // Join queue room for real-time updates
    if (queueId) {
      joinQueueRoom(queueId);
    }

    return () => {
      if (queueId) {
        leaveQueueRoom(queueId);
      }
    };
  }, [queueId, joinQueueRoom, leaveQueueRoom]);

  const loadQueueDetails = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await api.get(`/queues/${queueId}`);
      setQueue(response.data.data.queue);
    } catch (err) {
      setError('Failed to load queue details');
      console.error('Error loading queue:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinQueue = async () => {
    if (!queue) return;

    setJoining(true);
    setError('');

    try {
      const response = await api.post(`/queues/${queueId}/tokens`, {
        priority: selectedPriority
      });
      
      const { token } = response.data.data;
      
      // Navigate to tracking page
      navigate(`/track/${token.id}`, { 
        state: { 
          token,
          queueName: queue.name 
        } 
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to join queue');
      console.error('Error joining queue:', err);
    } finally {
      setJoining(false);
    }
  };

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 'PRIORITY': return 'Priority';
      case 'EMERGENCY': return 'Emergency';
      default: return 'Normal';
    }
  };

  const getPriorityDescription = (priority) => {
    switch (priority) {
      case 'PRIORITY': 
        return 'For customers with appointments or special needs';
      case 'EMERGENCY': 
        return 'For urgent cases only';
      default: 
        return 'Standard queue service';
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading queue details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-page">
        <div className="error-card">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={loadQueueDetails} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!queue) {
    return (
      <div className="error-page">
        <div className="error-card">
          <h2>Queue Not Found</h2>
          <p>The requested queue could not be found.</p>
          <button onClick={() => navigate('/')} className="back-button">
            Back to Search
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="queue-join-page">
      <div className="queue-header">
        <button onClick={() => navigate(-1)} className="back-button">
          ← Back
        </button>
        <h1>{queue.name}</h1>
        <p>{queue.description}</p>
      </div>

      <div className="queue-info">
        <div className="info-card">
          <h3>Queue Status</h3>
          <div className="status-indicator">
            <span className={`status-dot ${queue.isActive ? 'active' : 'inactive'}`}></span>
            <span>{queue.isActive ? 'Active' : 'Closed'}</span>
          </div>
          {queue.waitingCount !== undefined && (
            <p>People waiting: {queue.waitingCount}</p>
          )}
          {queue.estimatedWaitTime !== undefined && (
            <p>Estimated wait: {queue.estimatedWaitTime} minutes</p>
          )}
        </div>
      </div>

      {!queue.isActive ? (
        <div className="queue-closed">
          <h3>Queue Closed</h3>
          <p>This queue is currently not accepting new tokens.</p>
          <p>Please try again later or contact the service counter.</p>
        </div>
      ) : (
        <div className="join-section">
          <h2>Join Queue</h2>
          
          <div className="priority-selection">
            <h3>Select Priority Level</h3>
            <div className="priority-options">
              {['NORMAL', 'PRIORITY', 'EMERGENCY'].map((priority) => (
                <div 
                  key={priority}
                  className={`priority-option ${selectedPriority === priority ? 'selected' : ''}`}
                  onClick={() => setSelectedPriority(priority)}
                >
                  <div className="priority-header">
                    <span className={`priority-badge ${priority.toLowerCase()}`}>
                      {getPriorityLabel(priority)}
                    </span>
                  </div>
                  <p className="priority-description">
                    {getPriorityDescription(priority)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button 
            onClick={handleJoinQueue}
            disabled={joining}
            className="join-button"
          >
            {joining ? 'Joining Queue...' : `Join Queue (${getPriorityLabel(selectedPriority)})`}
          </button>

          <div className="terms">
            <p>By joining this queue, you agree to:</p>
            <ul>
              <li>Arrive at the service counter when your token is called</li>
              <li>Keep your mobile device available for notifications</li>
              <li>Cancel your token if you can no longer wait</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default QueueJoinPage;