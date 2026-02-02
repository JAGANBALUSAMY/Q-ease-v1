import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useSocket } from '../../../contexts/SocketContext';
import api from '../../../services/api';
import '../styles/StaffDashboardPage.css';

const StaffDashboardPage = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const [queues, setQueues] = useState([]);
  const [stats, setStats] = useState({
    totalServed: 0,
    totalWaiting: 0,
    avgWaitTime: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStaffQueues();
    fetchStats();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleQueueUpdate = (data) => {
      setQueues(prevQueues =>
        prevQueues.map(q => q.id === data.queueId ? { ...q, ...data } : q)
      );
    };

    const handleTokenUpdate = (data) => {
      // Refresh queues and stats when any token is updated
      if (data.type === 'token-called' || data.type === 'position-update') {
        fetchStaffQueues();
        fetchStats();
      }
    };

    socket.on('queue-update', handleQueueUpdate);
    socket.on('token-update', handleTokenUpdate);

    return () => {
      socket.off('queue-update', handleQueueUpdate);
      socket.off('token-update', handleTokenUpdate);
    };
  }, [socket]);

  const fetchStaffQueues = async () => {
    try {
      setLoading(true);
      const response = await api.get('/queues');
      setQueues(response.data.data.queues || []);
    } catch (err) {
      console.error('Error fetching queues:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/analytics/staff-stats');
      setStats(response.data.stats || stats);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleCallNext = async (queueId) => {
    try {
      await api.post(`/queues/${queueId}/call-next`);
      // Refresh both queues and stats to reflect the change
      fetchStaffQueues();
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to call next token');
    }
  };

  const handleToggleQueue = async (queueId, isActive) => {
    try {
      await api.patch(`/queues/${queueId}`, { isActive: !isActive });
      setQueues(prevQueues =>
        prevQueues.map(q => q.id === queueId ? { ...q, isActive: !isActive } : q)
      );
    } catch (err) {
      alert('Failed to toggle queue status');
    }
  };

  return (
    <div className="staff-dashboard-page">


      <div className="container">
        <div className="dashboard-header">
          <div>
            <h1>Staff Dashboard</h1>
            <p>Welcome back, {user?.name}!</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon stat-success">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.totalServed}</div>
              <div className="stat-label">Served Today</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon stat-warning">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.totalWaiting}</div>
              <div className="stat-label">Currently Waiting</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon stat-info">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-value">~{stats.avgWaitTime}m</div>
              <div className="stat-label">Avg Wait Time</div>
            </div>
          </div>
        </div>

        {/* Queues */}
        <div className="queues-section">
          <h2>My Queues</h2>

          {loading ? (
            <div className="loading-state">
              <div className="spinner spinner-primary"></div>
              <p>Loading queues...</p>
            </div>
          ) : queues.length > 0 ? (
            <div className="staff-queues-grid">
              {queues.map(queue => (
                <div key={queue.id} className="staff-queue-card">
                  <div className="queue-card-header">
                    <div>
                      <h3>{queue.name}</h3>
                      <p className="queue-org">{queue.organisation?.name}</p>
                    </div>
                    <button
                      className={`toggle-btn ${queue.isActive ? 'active' : 'paused'}`}
                      onClick={() => handleToggleQueue(queue.id, queue.isActive)}
                    >
                      {queue.isActive ? 'Active' : 'Paused'}
                    </button>
                  </div>

                  <div className="queue-stats-row">
                    <div className="queue-stat">
                      <span className="stat-number">{queue._count?.tokens || 0}</span>
                      <span className="stat-text">Waiting</span>
                    </div>
                    <div className="queue-stat">
                      <span className="stat-number">{queue.currentToken || '-'}</span>
                      <span className="stat-text">Current</span>
                    </div>
                  </div>

                  <div className="queue-actions">
                    <button
                      className="btn btn-primary btn-block"
                      onClick={() => handleCallNext(queue.id)}
                      disabled={!queue.isActive || queue._count?.tokens === 0}
                    >
                      <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                      Call Next
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={() => navigate(`/staff/queue/${queue.id}`)}
                    >
                      Manage
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <svg width="64" height="64" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3>No Queues Assigned</h3>
              <p>Contact your administrator to get assigned to queues</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffDashboardPage;