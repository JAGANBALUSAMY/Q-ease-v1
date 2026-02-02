import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../services/api';
import '../styles/AdminDashboardPage.css';

const AdminDashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalQueues: 0,
    totalTokens: 0,
    activeUsers: 0,
    avgWaitTime: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [queues, setQueues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, activityRes, queuesRes] = await Promise.all([
        api.get('/analytics/admin-stats'),
        api.get('/analytics/recent-activity'),
        api.get('/queues') // Super Admin gets all, Org Admin gets theirs
      ]);

      // Use real stats from API
      const apiStats = statsRes.data.data || {};
      setStats({
        totalQueues: apiStats.totalQueues || 0,
        totalTokens: apiStats.activeTokens || 0, // Show active tokens as "Tokens Issued/Active"
        activeUsers: apiStats.totalUsers || 0,   // Show total users as "Active Users" (or rename to Total Users)
        avgWaitTime: apiStats.avgWaitTime || 0,
        staffCount: apiStats.staffCount || 0,
        customerCount: apiStats.customerCount || 0,
        adminCount: apiStats.adminCount || 0
      });
      setRecentActivity(activityRes.data.activity || []);
      setQueues(queuesRes.data.data.queues || []);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
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

  const handleCallNext = async (queueId) => {
    try {
      await api.post(`/queues/${queueId}/call-next`);
      // Refresh queues to update counts
      const response = await api.get('/queues');
      setQueues(response.data.data.queues || []);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to call next token');
    }
  };

  const quickActions = [
    ...(user?.role === 'SUPER_ADMIN' ? [{
      title: 'Create Queue',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      ),
      color: 'primary',
      onClick: () => navigate('/admin/queues/new')
    }] : []),
    {
      title: 'Manage Staff',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      color: 'success',
      onClick: () => navigate('/admin/users')
    },
    {
      title: 'Manage Customers',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      color: 'info',
      onClick: () => navigate('/admin/customers')
    },
    {
      title: 'View Analytics',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      color: 'warning',
      onClick: () => navigate('/admin/analytics')
    },
    {
      title: 'Settings',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      color: 'secondary',
      onClick: () => navigate('/admin/settings')
    }
  ];

  // Add "Manage Admins" if Super Admin
  if (user?.role === 'SUPER_ADMIN') {
    quickActions.unshift({
      title: 'Manage Admins',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      color: 'primary',
      onClick: () => navigate('/admin/admins')
    });
  }

  return (
    <div className="admin-dashboard-page">
      <div className="container">
        <div className="dashboard-header">
          <div>
            <h1>{user?.role === 'SUPER_ADMIN' ? 'Super Admin Dashboard' : 'Admin Dashboard'}</h1>
            <p>Welcome back, {user?.name || user?.firstName || user?.email}!</p>
          </div>
        </div>

        {/* Stats Grid - Only show for Super Admin */}
        {user?.role === 'SUPER_ADMIN' && (
          <div className="admin-stats-grid">
            <div className="admin-stat-card">
              <div className="stat-icon-wrapper stat-primary">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="stat-details">
                <div className="stat-value">{stats.totalQueues}</div>
                <div className="stat-label">Total Queues</div>
              </div>
            </div>

            <div className="admin-stat-card">
              <div className="stat-icon-wrapper stat-success">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
              </div>
              <div className="stat-details">
                <div className="stat-value">{stats.totalTokens}</div>
                <div className="stat-label">Tokens Issued</div>
              </div>
            </div>

            <div className="admin-stat-card">
              <div className="stat-icon-wrapper stat-warning">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div className="stat-details">
                <div className="stat-value">{stats.activeUsers}</div>
                <div className="stat-label">Active Users</div>
              </div>
            </div>

            <div className="admin-stat-card">
              <div className="stat-icon-wrapper stat-info">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="stat-details">
                <div className="stat-value">~{stats.avgWaitTime}m</div>
                <div className="stat-label">Avg Wait Time</div>
              </div>
            </div>
          </div>
        )}

        {/* Queues Section */}
        <div className="queues-section">
          <h2>Queues</h2>
          {queues.length > 0 ? (
            <div className="admin-queues-grid">
              {queues.map(queue => (
                <div key={queue.id} className="admin-queue-card">
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

                  {user?.role === 'SUPER_ADMIN' && (
                    <div className="queue-stats-row">
                      <div className="queue-stat">
                        <span className="stat-number">{queue._count?.tokens || 0}</span>
                        <span className="stat-text">Waiting</span>
                      </div>
                      <div className="queue-stat">
                        <span className="stat-number">{queue.averageTime || '~'}m</span>
                        <span className="stat-text">Avg Wait</span>
                      </div>
                    </div>
                  )}

                  <div className="queue-actions">
                    {user?.role !== 'SUPER_ADMIN' && (
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
                    )}
                    <button
                      className={`btn btn-secondary ${user?.role === 'SUPER_ADMIN' ? 'btn-block' : ''}`}
                      onClick={() => navigate(`/admin/queues/${queue.id}`)}
                    >
                      Manage
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-activity">
              <p>No queues found. Create one to get started.</p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="quick-actions-section">
          <h2>Quick Actions</h2>
          <div className="quick-actions-grid">
            {quickActions.map((action, index) => (
              <button
                key={index}
                className={`quick-action-card action-${action.color}`}
                onClick={action.onClick}
              >
                <div className="action-icon">{action.icon}</div>
                <div className="action-title">{action.title}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="recent-activity-section">
          <h2>Recent Activity</h2>
          {recentActivity.length > 0 ? (
            <div className="activity-list">
              {recentActivity.slice(0, 10).map((activity, index) => (
                <div key={index} className="activity-item">
                  <div className="activity-icon">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="activity-content">
                    <p className="activity-text">{activity.description}</p>
                    <span className="activity-time">{activity.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-activity">
              <p>No recent activity</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;