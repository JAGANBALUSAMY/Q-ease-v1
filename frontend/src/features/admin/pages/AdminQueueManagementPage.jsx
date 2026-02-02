import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useSocket } from '../../../contexts/SocketContext';
import api from '../../../utils/api';
import '../styles/AdminQueueManagementPage.css';

const AdminQueueManagementPage = () => {
  const { queueId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, joinOrganization, leaveOrganization } = useSocket();

  // State for list view
  const [queues, setQueues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // State for form view (existing)
  const [queue, setQueue] = useState({
    name: '',
    description: '',
    averageTime: 5,
    maxTokens: 50,
    isActive: true,
    operatingHours: {
      start: '09:00',
      end: '17:00'
    },
    prioritySettings: {
      emergencyEnabled: true,
      priorityEnabled: true,
      maxPriorityPerDay: 10
    }
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');

  // Handle Socket.IO Real-time Updates
  useEffect(() => {
    // Determine Org ID (handle nested object structure)
    const orgId = user?.organisationId || user?.organisation?.id;

    // Only listen if we have an Org ID and we are in List View (or even in Detail View, but mainly for List)
    if (orgId && !queueId) {
      joinOrganization(orgId);

      if (socket) {
        const handleOrgUpdate = (data) => {
          console.log('Received org-update:', data);
          if (data.type === 'queue-created') {
            setQueues(prev => [data.queue, ...prev]);
          } else if (data.type === 'queue-updated') {
            // Update the specific queue in the list
            setQueues(prev => prev.map(q => q.id === data.queueId ? { ...q, ...data.updates } : q));
          } else if (data.type === 'queue-deleted') {
            setQueues(prev => prev.filter(q => q.id !== data.queueId));
          }
        };

        socket.on('org-update', handleOrgUpdate);

        return () => {
          leaveOrganization(orgId);
          socket.off('org-update', handleOrgUpdate);
        };
      }
    }
  }, [user, socket, queueId]);

  // Handle initial data loading based on route
  useEffect(() => {
    if (!queueId) {
      // List View
      loadQueues();
    } else if (queueId === 'new') {
      // Create New View - No loading needed, show form immediately
      setLoading(false);
      // Reset form to default for new queue
      setQueue({
        name: '',
        description: '',
        averageTime: 5,
        maxTokens: 50,
        isActive: true,
        operatingHours: {
          start: '09:00',
          end: '17:00'
        },
        prioritySettings: {
          emergencyEnabled: true,
          priorityEnabled: true,
          maxPriorityPerDay: 10
        }
      });
    } else {
      // Edit/Detail View
      loadQueueDetails();
    }
  }, [queueId]);

  const loadQueues = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.get('/queues');
      setQueues(response.data.data.queues || []);
    } catch (err) {
      setError('Failed to load queues');
      console.error('Error loading queues:', err);
    } finally {
      setLoading(false);
    }
  };

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

  // Filter queues based on search and status
  const filteredQueues = queues.filter(q => {
    const matchesSearch = q.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'active' && q.isActive) ||
      (filterStatus === 'inactive' && !q.isActive);
    return matchesSearch && matchesStatus;
  });

  // Handle create new queue
  const handleCreateNew = () => {
    navigate('/admin/queues/new');
  };

  // Handle edit queue
  const handleEditQueue = (id) => {
    navigate(`/admin/queues/${id}/edit`);
  };

  // Handle view queue details
  const handleViewQueue = (id) => {
    navigate(`/admin/queues/${id}`);
  };

  // Handle status toggle
  const toggleQueueStatus = async (id, isActive) => {
    try {
      setLoading(true);
      setError('');

      const action = isActive ? 'pause' : 'resume';
      await api.put(`/queues/${id}/${action}`);

      // Refresh the list
      await loadQueues();
    } catch (err) {
      setError('Failed to update queue status');
      console.error('Error updating queue status:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle delete queue
  const deleteQueue = async (id) => {
    if (!window.confirm('Are you sure you want to delete this queue?')) return;

    try {
      setLoading(true);
      setError('');

      await api.delete(`/queues/${id}`);

      // Refresh the list
      await loadQueues();
    } catch (err) {
      setError('Failed to delete queue');
      console.error('Error deleting queue:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setQueue(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setQueue(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      if (queueId === 'new') {
        // Create new queue
        console.log('User object:', user);

        // Handle nested organisation object (fallback)
        const orgId = user?.organisationId || user?.organisation?.id;
        console.log('Resolved Organisation ID:', orgId);

        const payload = {
          ...queue,
          organisationId: orgId
        };

        console.log('Sending payload:', payload);

        if (!payload.organisationId) {
          setError(`Error: Organisation ID is missing. Please re-login. (Role: ${user?.role})`);
          setSaving(false);
          return;
        }

        const response = await api.post('/queues', payload);
        setSuccess('Queue created successfully!');
        setTimeout(() => navigate('/admin/queues'), 1500);
      } else {
        // Update existing queue
        const response = await api.put(`/queues/${queueId}`, queue);
        setSuccess('Queue updated successfully!');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save queue');
      console.error('Error saving queue:', err);
    } finally {
      setSaving(false);
    }
  };

  // Render list view when no queueId
  if (!queueId) {
    return (
      <div className="admin-queue-management">
        <div className="page-header">
          <h1>Queue Management</h1>
          <p>Manage and configure service queues for your organization</p>

          <div className="header-actions">
            <button
              onClick={handleCreateNew}
              className="create-button"
            >
              + Create New Queue
            </button>
          </div>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* Search and Filter */}
        <div className="search-filter-section">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search queues..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <span className="search-icon">🔍</span>
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Queues List */}
        <div className="queues-list">
          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Loading queues...</p>
            </div>
          ) : filteredQueues.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <h3>No queues found</h3>
              <p>{searchTerm ? 'Try adjusting your search criteria' : 'Get started by creating your first queue'}</p>
              {!searchTerm && (
                <button onClick={handleCreateNew} className="create-button">
                  Create Your First Queue
                </button>
              )}
            </div>
          ) : (
            <div className="queues-grid">
              {filteredQueues.map(queue => (
                <div key={queue.id} className="queue-card">
                  <div className="queue-header">
                    <h3>{queue.name}</h3>
                    <span className={`status-badge ${queue.isActive ? 'active' : 'inactive'}`}>
                      {queue.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <p className="queue-description">{queue.description}</p>

                  <div className="queue-stats">
                    <div className="stat">
                      <span className="stat-label">Waiting:</span>
                      <span className="stat-value">{queue.waitingCount}</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Avg Wait:</span>
                      <span className="stat-value">{queue.averageTime || queue.avgWaitTime} min</span>
                    </div>
                    {/* Staff count is not yet available from backend
                    <div className="stat">
                      <span className="stat-label">Staff:</span>
                      <span className="stat-value">{queue.staffCount || 0}</span>
                    </div>
                    */}
                  </div>

                  <div className="queue-actions">
                    <button
                      onClick={() => handleViewQueue(queue.id)}
                      className="view-button"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => handleEditQueue(queue.id)}
                      className="edit-button"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => toggleQueueStatus(queue.id, queue.isActive)}
                      className={`status-button ${queue.isActive ? 'pause' : 'resume'}`}
                    >
                      {queue.isActive ? 'Pause' : 'Resume'}
                    </button>
                    <button
                      onClick={() => deleteQueue(queue.id)}
                      className="delete-button"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Render form view when queueId is provided
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading queue details...</p>
      </div>
    );
  }

  return (
    <div className="queue-management-page">
      <div className="page-header">
        <button onClick={() => navigate('/admin/queues')} className="back-button">
          ← Back to Queue List
        </button>
        <h1>{queueId === 'new' ? 'Create New Queue' : 'Edit Queue'}</h1>
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

      <form onSubmit={handleSubmit} className="queue-form">
        <div className="form-section">
          <h2>Basic Information</h2>

          <div className="form-group">
            <label htmlFor="name">Queue Name *</label>
            <input
              type="text"
              id="name"
              value={queue.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              required
              placeholder="Enter queue name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={queue.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe the service this queue provides"
              rows="3"
            />
          </div>
        </div>

        <div className="form-section">
          <h2>Queue Settings</h2>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="averageTime">Average Service Time (minutes)</label>
              <input
                type="number"
                id="averageTime"
                value={queue.averageTime}
                onChange={(e) => handleInputChange('averageTime', parseInt(e.target.value))}
                min="1"
                max="120"
              />
            </div>

            <div className="form-group">
              <label htmlFor="maxTokens">Maximum Tokens Per Day</label>
              <input
                type="number"
                id="maxTokens"
                value={queue.maxTokens}
                onChange={(e) => handleInputChange('maxTokens', parseInt(e.target.value))}
                min="1"
                max="1000"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={queue.isActive}
                onChange={(e) => handleInputChange('isActive', e.target.checked)}
              />
              Queue is Active
            </label>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate('/admin/queues')}
            className="cancel-button"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="save-button"
          >
            {saving ? 'Saving...' : (queueId === 'new' ? 'Create Queue' : 'Update Queue')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminQueueManagementPage;