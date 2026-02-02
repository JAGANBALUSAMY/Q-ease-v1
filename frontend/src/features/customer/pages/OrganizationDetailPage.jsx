import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useSocket } from '../../../contexts/SocketContext';
import api from '../../../services/api';
import QueueCard from '../../../components/ui/QueueCard';
import '../styles/OrganizationDetailPage.css';

const OrganizationDetailPage = () => {
    const { orgCode } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const { socket, joinOrganization, leaveOrganization } = useSocket();
    const [organization, setOrganization] = useState(null);
    const [queues, setQueues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchOrganization();
    }, [orgCode]);

    useEffect(() => {
        if (!socket || !organization) return;

        // Join organization room for real-time updates
        joinOrganization(organization.id);

        // Listen for queue updates
        const handleQueueUpdate = (data) => {
            console.log('Queue update:', data);
            setQueues(prevQueues =>
                prevQueues.map(q => q.id === data.queueId ? { ...q, ...data } : q)
            );
        };

        socket.on('queue-update', handleQueueUpdate);

        return () => {
            socket.off('queue-update', handleQueueUpdate);
            leaveOrganization(organization.id);
        };
    }, [socket, organization]);

    const fetchOrganization = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get(`/organisations/code/${orgCode}`);
            setOrganization(response.data.data.organisation);
            setQueues(response.data.data.organisation?.queues || []);
        } catch (err) {
            console.error('Error fetching organization:', err);
            setError('Organization not found');
        } finally {
            setLoading(false);
        }
    };

    const handleJoinQueue = async (queueId) => {
        console.log('handleJoinQueue called with ID:', queueId);

        if (!user) {
            // User is not logged in, redirect to login
            // We'll pass the current location to redirect back after login
            navigate('/login', { state: { from: location.pathname } });
            return;
        }

        try {
            console.log('Sending request to /tokens...');
            const response = await api.post('/tokens', {
                queueId,
                priority: 'NORMAL'
            });

            // Navigate to My Tokens page
            navigate('/my-tokens');
        } catch (err) {
            console.error('Error joining queue:', err);
            alert(err.response?.data?.message || 'Failed to join queue');
        }
    };

    if (loading) {
        return (
            <div className="org-detail-page">

                <div className="container">
                    <div className="loading-state">
                        <div className="spinner spinner-primary"></div>
                        <p>Loading organization...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !organization) {
        return (
            <div className="org-detail-page">
                <div className="container">
                    <div className="error-state">
                        <svg width="64" height="64" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h3>{error}</h3>
                        <button className="btn btn-primary" onClick={() => navigate('/')}>
                            Back to Search
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="org-detail-page">


            <div className="container">
                {/* Organization Header */}
                <div className="org-header">
                    <button className="back-button" onClick={() => navigate('/')}>
                        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back
                    </button>

                    <div className="org-header-content">
                        <div className="org-header-left">
                            <div className="org-avatar-large">
                                {organization.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="org-header-info">
                                <div className="org-title-row">
                                    <h1 className="org-title">{organization.name}</h1>
                                    {organization.isVerified && (
                                        <span className="badge badge-success">
                                            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            Verified
                                        </span>
                                    )}
                                </div>
                                {organization.code && (
                                    <p className="org-code-large">Code: {organization.code}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Organization Details */}
                    <div className="org-details-grid">
                        {organization.address && (
                            <div className="detail-card">
                                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <div>
                                    <div className="detail-label">Address</div>
                                    <div className="detail-value">{organization.address}</div>
                                </div>
                            </div>
                        )}

                        {organization.phone && (
                            <div className="detail-card">
                                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                <div>
                                    <div className="detail-label">Phone</div>
                                    <div className="detail-value">{organization.phone}</div>
                                </div>
                            </div>
                        )}

                        {organization.email && (
                            <div className="detail-card">
                                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                <div>
                                    <div className="detail-label">Email</div>
                                    <div className="detail-value">{organization.email}</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Queues Section */}
                <div className="queues-section">
                    <div className="section-header">
                        <h2>Available Queues</h2>
                        <p>{queues.length} queue{queues.length !== 1 ? 's' : ''} available</p>
                    </div>

                    {queues.length > 0 ? (
                        <div className="queues-grid">
                            {queues.map(queue => (
                                <QueueCard
                                    key={queue.id}
                                    queue={queue}
                                    onJoin={handleJoinQueue}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="empty-queues">
                            <svg width="64" height="64" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <h3>No Active Queues</h3>
                            <p>This organization doesn't have any active queues at the moment.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OrganizationDetailPage;
