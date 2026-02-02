import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../utils/api';
import '../styles/StaffWalkInPage.css';

const StaffWalkInPage = () => {
  const { queueId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [queue, setQueue] = useState(null);
  const [customerName, setCustomerName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [priority, setPriority] = useState('NORMAL');
  const [creating, setCreating] = useState(false);
  const [createdToken, setCreatedToken] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadQueueDetails();
  }, [queueId]);

  const loadQueueDetails = async () => {
    try {
      const response = await api.get(`/queues/${queueId}`);
      setQueue(response.data.data.queue);
    } catch (err) {
      setError('Failed to load queue details');
      console.error('Error loading queue:', err);
    }
  };

  const handleCreateToken = async (e) => {
    e.preventDefault();
    
    if (!customerName.trim()) {
      setError('Customer name is required');
      return;
    }

    setCreating(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.post(`/queues/${queueId}/tokens/walk-in`, {
        customerName: customerName.trim(),
        contactInfo: contactInfo.trim(),
        priority
      });
      
      const { token } = response.data.data;
      setCreatedToken(token);
      setSuccess(`Token ${token.displayToken} created successfully!`);
      
      // Reset form
      setCustomerName('');
      setContactInfo('');
      setPriority('NORMAL');
      
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to create walk-in token';
      setError(errorMessage);
      console.error('Error creating walk-in token:', err);
    } finally {
      setCreating(false);
    }
  };

  const handlePrintToken = () => {
    // TODO: Implement actual printing functionality
    window.print();
  };

  const handleNewToken = () => {
    setCreatedToken(null);
    setSuccess('');
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

  if (!queue) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading queue details...</p>
      </div>
    );
  }

  return (
    <div className="walk-in-page">
      <div className="page-header">
        <button onClick={() => navigate(-1)} className="back-button">
          ← Back to Queue
        </button>
        <h1>Walk-in Customer Registration</h1>
        <div className="queue-info">
          <h2>{queue.name}</h2>
          <p>{queue.description}</p>
          <div className="queue-status">
            <span className={`status-indicator ${queue.isActive ? 'active' : 'paused'}`}>
              {queue.isActive ? '🟢 Active' : '🔴 Paused'}
            </span>
            <span>👥 Waiting: {queue.waitingCount || 0}</span>
          </div>
        </div>
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

      {!queue.isActive ? (
        <div className="queue-paused">
          <h3>Queue Paused</h3>
          <p>This queue is currently paused. Please resume the queue to create walk-in tokens.</p>
        </div>
      ) : createdToken ? (
        <div className="token-created">
          <div className="token-display-card">
            <h3>Token Created Successfully</h3>
            <div className="token-number">
              <span className="display-token">{createdToken.displayToken}</span>
            </div>
            <div className="token-details">
              <p><strong>Customer:</strong> {customerName || 'N/A'}</p>
              <p><strong>Priority:</strong> {getPriorityLabel(priority)}</p>
              <p><strong>Position:</strong> #{createdToken.position}</p>
              <p><strong>Estimated Wait:</strong> ~{createdToken.estimatedTime ? 
                Math.floor((new Date(createdToken.estimatedTime) - new Date()) / 60000) : 
                (createdToken.position - 1) * (queue.averageTime || 5)} minutes</p>
            </div>
            <div className="token-actions">
              <button onClick={handlePrintToken} className="print-button">
                Print Token
              </button>
              <button onClick={handleNewToken} className="new-token-button">
                Create Another
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="walk-in-form-section">
          <div className="form-container">
            <h3>Create Walk-in Token</h3>
            <form onSubmit={handleCreateToken} className="walk-in-form">
              
              <div className="form-group">
                <label htmlFor="customerName">Customer Name *</label>
                <input
                  type="text"
                  id="customerName"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter customer full name"
                  required
                  disabled={creating}
                />
              </div>

              <div className="form-group">
                <label htmlFor="contactInfo">Contact Information</label>
                <input
                  type="text"
                  id="contactInfo"
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                  placeholder="Phone number or email (optional)"
                  disabled={creating}
                />
              </div>

              <div className="form-group">
                <label>Priority Level</label>
                <div className="priority-options">
                  {['NORMAL', 'PRIORITY', 'EMERGENCY'].map((level) => (
                    <div 
                      key={level}
                      className={`priority-option ${priority === level ? 'selected' : ''}`}
                      onClick={() => setPriority(level)}
                    >
                      <div className="priority-header">
                        <span className={`priority-badge ${level.toLowerCase()}`}>
                          {getPriorityLabel(level)}
                        </span>
                      </div>
                      <p className="priority-description">
                        {getPriorityDescription(level)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <button 
                type="submit" 
                disabled={creating}
                className="create-token-button"
              >
                {creating ? 'Creating Token...' : 'Create Walk-in Token'}
              </button>
            </form>
          </div>

          <div className="queue-info-sidebar">
            <div className="info-card">
              <h4>Queue Information</h4>
              <p><strong>Average Service Time:</strong> {queue.averageTime || 5} minutes</p>
              <p><strong>Current Waiting:</strong> {queue.waitingCount || 0} customers</p>
              <p><strong>Queue Capacity:</strong> {queue.maxTokens || 'Unlimited'}</p>
            </div>

            <div className="instructions">
              <h4>Instructions</h4>
              <ul>
                <li>Enter the customer's full name</li>
                <li>Add contact information for notifications</li>
                <li>Select appropriate priority level</li>
                <li>Click "Create Walk-in Token" to generate token</li>
                <li>Provide printed token to customer</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffWalkInPage;