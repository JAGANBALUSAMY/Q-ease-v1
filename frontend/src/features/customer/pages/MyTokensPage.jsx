import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useSocket } from '../../../contexts/SocketContext';
import api from '../../../utils/api';
import TokenCard from '../../../components/ui/TokenCard';
import '../styles/MyTokensPage.css';

const MyTokensPage = () => {
    const { user } = useAuth();
    const { socket } = useSocket();
    const navigate = useNavigate();
    const [tokens, setTokens] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('active'); // 'active' or 'history'
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchTokens();
    }, []);

    // Socket.IO real-time updates
    useEffect(() => {
        if (!socket) return;

        // Listen for token updates
        const handleTokenUpdate = (data) => {
            console.log('Token update received:', data);
            setTokens(prevTokens =>
                prevTokens.map(token =>
                    token.id === data.tokenId
                        ? { ...token, ...data }
                        : token
                )
            );
        };

        socket.on('token-update', handleTokenUpdate);

        // Subscribe to user's tokens
        tokens.forEach(token => {
            socket.emit('join-token', token.id);
        });

        return () => {
            socket.off('token-update', handleTokenUpdate);
            tokens.forEach(token => {
                socket.emit('leave-token', token.id);
            });
        };
    }, [socket, tokens]);

    const fetchTokens = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get('/tokens/my');
            setTokens(response?.data?.data?.tokens || []);
        } catch (err) {
            console.error('Error fetching tokens:', err);
            setError('Failed to load tokens. Please try again.');
            setTokens([]);
        } finally {
            setLoading(false);
        }
    };

    const handleCancelToken = async (tokenId) => {
        if (!window.confirm('Are you sure you want to cancel this token?')) {
            return;
        }

        try {
            await api.patch(`/tokens/${tokenId}/cancel`);
            // Update local state
            setTokens(prevTokens =>
                prevTokens.map(token =>
                    token.id === tokenId
                        ? { ...token, status: 'CANCELLED', cancelledAt: new Date() }
                        : token
                )
            );
        } catch (err) {
            console.error('Error cancelling token:', err);
            alert('Failed to cancel token. Please try again.');
        }
    };

    const activeTokens = tokens.filter(t =>
        t.status === 'PENDING' || t.status === 'CALLED'
    );

    const historyTokens = tokens.filter(t =>
        t.status === 'SERVED' || t.status === 'CANCELLED'
    );

    const displayTokens = activeTab === 'active' ? activeTokens : historyTokens;

    if (loading) {
        return (
            <div className="my-tokens-page">

                <div className="container">
                    <div className="loading-state">
                        <div className="spinner spinner-primary"></div>
                        <p>Loading your tokens...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="my-tokens-page">


            <div className="container">
                <div className="page-header">
                    <div className="header-content">
                        <h1 className="page-title">My Tokens</h1>
                        <p className="page-subtitle">
                            Track your queue positions and get real-time updates
                        </p>
                    </div>
                    <button
                        className="btn btn-primary"
                        onClick={() => navigate('/')}
                    >
                        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Join New Queue
                    </button>
                </div>

                {/* Tabs */}
                <div className="tabs">
                    <button
                        className={`tab ${activeTab === 'active' ? 'tab-active' : ''}`}
                        onClick={() => setActiveTab('active')}
                    >
                        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Active ({activeTokens.length})
                    </button>
                    <button
                        className={`tab ${activeTab === 'history' ? 'tab-active' : ''}`}
                        onClick={() => setActiveTab('history')}
                    >
                        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        History ({historyTokens.length})
                    </button>
                </div>

                {/* Error State */}
                {error && (
                    <div className="error-banner">
                        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {error}
                        <button className="btn btn-sm btn-secondary" onClick={fetchTokens}>
                            Retry
                        </button>
                    </div>
                )}

                {/* Tokens Grid */}
                {displayTokens.length > 0 ? (
                    <div className="tokens-grid">
                        {displayTokens.map(token => (
                            <TokenCard
                                key={token.id}
                                token={token}
                                onCancel={activeTab === 'active' ? handleCancelToken : null}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <div className="empty-icon">
                            {activeTab === 'active' ? (
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                                </svg>
                            ) : (
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            )}
                        </div>
                        <h3 className="empty-title">
                            {activeTab === 'active'
                                ? 'No Active Tokens'
                                : 'No Token History'}
                        </h3>
                        <p className="empty-description">
                            {activeTab === 'active'
                                ? 'You don\'t have any active tokens. Join a queue to get started!'
                                : 'Your completed and cancelled tokens will appear here.'}
                        </p>
                        {activeTab === 'active' && (
                            <button
                                className="btn btn-primary btn-lg"
                                onClick={() => navigate('/')}
                            >
                                Browse Organizations
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyTokensPage;
