import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../services/api';
import notificationService from '../../../services/notificationService';
import '../styles/CustomerQueuePage.css';

const CustomerQueuePage = () => {
    const { queueId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const [queue, setQueue] = useState(null);
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState(false);
    const [error, setError] = useState(null);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        fetchQueueDetails();
    }, [queueId]);

    const fetchQueueDetails = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/queues/public/${queueId}`);
            setQueue(response.data.data.queue);
        } catch (err) {
            console.error('Error fetching queue:', err);
            setError('Queue not found or unavailable');
        } finally {
            setLoading(false);
        }
    };

    const handleJoinQueue = async () => {
        if (!user) {
            navigate('/login', { state: { from: location.pathname } });
            return;
        }

        try {
            setJoining(true);
            const resp = await api.post('/tokens', { queueId });
            // create a notification and persist it
            const bodyText = queue && queue.name ? `You joined ${queue.name}.` : 'Your token was generated.';
            notificationService.addNotification({
                title: 'Token Generated',
                body: bodyText,
                data: resp?.data || null,
            });

            // show a small toast message
            setToast({ type: 'success', message: 'Token generated successfully' });
            setTimeout(() => setToast(null), 4000);

            // navigate to my tokens
            navigate('/my-tokens');
        } catch (err) {
            console.error('Error joining queue:', err);
            const msg = err.response?.data?.message || 'Failed to join queue';
            setToast({ type: 'error', message: msg });
            setTimeout(() => setToast(null), 4000);
        } finally {
            setJoining(false);
        }
    };

    if (loading) {
        return (
            <div className="customer-queue-page">
                <div className="loading-state">
                    <div className="spinner spinner-primary"></div>
                    <p>Loading queue details...</p>
                </div>
            </div>
        );
    }

    if (error || !queue) {
        return (
            <div className="customer-queue-page">
                <div className="error-state">
                    <h2>Oops!</h2>
                    <p>{error}</p>
                    <button className="btn btn-primary" onClick={() => navigate('/')}>
                        Go Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="customer-queue-page">
            {toast && (
                <div className={`qe-toast qe-toast-${toast.type}`} style={{position: 'fixed', right: 20, top: 80, zIndex:9999}}>
                    {toast.message}
                </div>
            )}
            <div className="container">
                <div className="queue-detail-card">
                    <div className="queue-header">
                        <div className="org-info">
                            <h2 className="org-name">{queue.organisationName}</h2>
                            <p className="org-location">
                                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {queue.organisationAddress}, {queue.organisationCity}
                            </p>
                        </div>
                        <div className={`status-badge ${queue.isActive ? 'active' : 'inactive'}`}>
                            {queue.isActive ? 'Active' : 'Closed'}
                        </div>
                    </div>

                    <div className="queue-main-info">
                        <h1 className="queue-name">{queue.name}</h1>
                        <p className="queue-desc">{queue.description}</p>
                    </div>

                    <div className="queue-stats-grid">
                        <div className="stat-box">
                            <span className="stat-label">Waiting</span>
                            <span className="stat-value">{queue.waitingCount}</span>
                        </div>
                        <div className="stat-box">
                            <span className="stat-label">Currently Serving</span>
                            <span className="stat-value highlight">{queue.currentServing}</span>
                        </div>
                        <div className="stat-box">
                            <span className="stat-label">Avg Wait</span>
                            <span className="stat-value">~{queue.averageTime}m</span>
                        </div>
                    </div>

                    <div className="action-area">
                        <button
                            className="btn btn-primary btn-xl join-btn"
                            onClick={handleJoinQueue}
                            disabled={joining}
                        >
                            {joining ? 'Joining...' : 'Join Queue Now'}
                        </button>
                        {!user && (
                            <p className="auth-note">You'll need to sign in to join</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomerQueuePage;
