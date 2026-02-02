import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import '../styles/SystemDashboard.css';

const SystemDashboard = () => {
    const [activeTab, setActiveTab] = useState('logs');
    const [requestLogs, setRequestLogs] = useState([]);
    const [systemHealth, setSystemHealth] = useState(null);
    const [retryStats, setRetryStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000); // Refresh every 5 seconds
        return () => clearInterval(interval);
    }, []);

    const fetchData = async () => {
        try {
            const [logsRes, healthRes, retryRes, usersRes] = await Promise.all([
                api.get('/system/request-logs?limit=50'),
                api.get('/system/health'),
                api.get('/system/retry-stats'),
                api.get('/users')
            ]);

            setRequestLogs(logsRes.data.data.logs || []);
            setSystemHealth(healthRes.data.data);
            setRetryStats(retryRes.data.data);
            setUsers(usersRes.data.data || []);
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch system data:', error);
            setLoading(false);
        }
    };

    const handleToggleUserStatus = async (userId, currentStatus) => {
        try {
            await api.patch(`/user-management/${userId}/status`, {
                isActive: !currentStatus
            });
            fetchData();
        } catch (error) {
            console.error('Failed to toggle user status:', error);
        }
    };

    if (loading) {
        return <div className="system-dashboard loading">Loading system data...</div>;
    }

    return (
        <div className="system-dashboard">
            <div className="dashboard-header">
                <h1>🔧 System Dashboard</h1>
                <p>Monitor requests, manage users, and view system health</p>
            </div>

            {/* System Health Overview */}
            {systemHealth && (
                <div className="health-overview">
                    <div className="stat-card">
                        <div className="stat-icon">📊</div>
                        <div className="stat-content">
                            <div className="stat-value">{systemHealth.totalRequests}</div>
                            <div className="stat-label">Total Requests</div>
                        </div>
                    </div>
                    <div className="stat-card success">
                        <div className="stat-icon">✅</div>
                        <div className="stat-content">
                            <div className="stat-value">{systemHealth.successRate}%</div>
                            <div className="stat-label">Success Rate</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">⚡</div>
                        <div className="stat-content">
                            <div className="stat-value">{systemHealth.avgResponseTime}ms</div>
                            <div className="stat-label">Avg Response Time</div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">🔄</div>
                        <div className="stat-content">
                            <div className="stat-value">{retryStats?.totalRetries || 0}</div>
                            <div className="stat-label">Total Retries</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="dashboard-tabs">
                <button
                    className={`tab ${activeTab === 'logs' ? 'active' : ''}`}
                    onClick={() => setActiveTab('logs')}
                >
                    📝 Request Logs
                </button>
                <button
                    className={`tab ${activeTab === 'users' ? 'active' : ''}`}
                    onClick={() => setActiveTab('users')}
                >
                    👥 User Management
                </button>
                <button
                    className={`tab ${activeTab === 'retry' ? 'active' : ''}`}
                    onClick={() => setActiveTab('retry')}
                >
                    🔄 Retry Statistics
                </button>
            </div>

            {/* Tab Content */}
            <div className="tab-content">
                {/* Request Logs Tab */}
                {activeTab === 'logs' && (
                    <div className="logs-section">
                        <h2>Recent Requests</h2>
                        <div className="logs-table-container">
                            <table className="logs-table">
                                <thead>
                                    <tr>
                                        <th>Request ID</th>
                                        <th>Method</th>
                                        <th>URL</th>
                                        <th>Status</th>
                                        <th>Duration</th>
                                        <th>Time</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {requestLogs.map((log) => (
                                        <tr key={log.requestId} className={log.statusCode >= 400 ? 'error' : 'success'}>
                                            <td className="request-id">{log.requestId}</td>
                                            <td><span className={`method ${log.method.toLowerCase()}`}>{log.method}</span></td>
                                            <td className="url">{log.url}</td>
                                            <td><span className={`status status-${Math.floor(log.statusCode / 100)}`}>{log.statusCode}</span></td>
                                            <td>{log.duration}ms</td>
                                            <td>{new Date(log.timestamp).toLocaleTimeString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* User Management Tab */}
                {activeTab === 'users' && (
                    <div className="users-section">
                        <h2>User Management</h2>
                        <div className="users-table-container">
                            <table className="users-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Role</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((user) => (
                                        <tr key={user.id}>
                                            <td>{user.firstName} {user.lastName}</td>
                                            <td>{user.email}</td>
                                            <td><span className="role-badge">{user.roleModel?.name || 'N/A'}</span></td>
                                            <td>
                                                <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                                                    {user.isActive ? '✅ Active' : '❌ Inactive'}
                                                </span>
                                            </td>
                                            <td>
                                                <button
                                                    className={`btn-sm ${user.isActive ? 'btn-danger' : 'btn-success'}`}
                                                    onClick={() => handleToggleUserStatus(user.id, user.isActive)}
                                                >
                                                    {user.isActive ? 'Deactivate' : 'Activate'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Retry Statistics Tab */}
                {activeTab === 'retry' && retryStats && (
                    <div className="retry-section">
                        <h2>Retry Statistics</h2>
                        <div className="retry-stats">
                            <div className="retry-overview">
                                <div className="retry-card">
                                    <h3>Total Retries</h3>
                                    <div className="retry-value">{retryStats.totalRetries}</div>
                                </div>
                                <div className="retry-card success">
                                    <h3>Successful</h3>
                                    <div className="retry-value">{retryStats.successfulRetries}</div>
                                </div>
                                <div className="retry-card failed">
                                    <h3>Failed</h3>
                                    <div className="retry-value">{retryStats.failedRetries}</div>
                                </div>
                                <div className="retry-card">
                                    <h3>Success Rate</h3>
                                    <div className="retry-value">{retryStats.successRate}%</div>
                                </div>
                            </div>

                            <h3>By Operation Type</h3>
                            <div className="operation-types">
                                {Object.entries(retryStats.byOperationType).map(([type, stats]) => (
                                    <div key={type} className="operation-card">
                                        <h4>{type.toUpperCase()}</h4>
                                        <div className="operation-stats">
                                            <div>Attempts: <strong>{stats.attempts}</strong></div>
                                            <div>Successes: <strong className="success-text">{stats.successes}</strong></div>
                                            <div>Failures: <strong className="error-text">{stats.failures}</strong></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SystemDashboard;
