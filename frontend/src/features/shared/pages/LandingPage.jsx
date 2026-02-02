import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { getDashboardPath } from '../../../utils/roleUtils';
import api from '../../../utils/api';
import '../styles/LandingPage.css';

const LandingPage = () => {
    const { user, loading } = useAuth();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [publicQueues, setPublicQueues] = useState([]);
    const [loadingQueues, setLoadingQueues] = useState(true);

    // Redirect if user is logged in
    useEffect(() => {
        if (!loading && user) {
            navigate(getDashboardPath(user), { replace: true });
        }
    }, [user, loading, navigate]);

    // Fetch public queues only when not logged in
    useEffect(() => {
        if (loading || user) return;
        fetchPublicQueues();
    }, [loading, user]);

    const fetchPublicQueues = async () => {
        try {
            const response = await api.get('/queues/public');
            if (response.data.success) {
                setPublicQueues(response.data.data.queues);
            }
        } catch (error) {
            console.error('Failed to fetch public queues:', error);
        } finally {
            setLoadingQueues(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
        }
    };

    const handleJoinQueue = (queueId) => {
        if (user) {
            navigate(`/queue/${queueId}`);
        } else {
            navigate('/login', { state: { from: `/queue/${queueId}` } });
        }
    };

    // While loading auth or redirecting, show loading screen
    if (loading || user) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                background: 'var(--gray-50)'
            }}>
                <div className="spinner spinner-primary"></div>
            </div>
        );
    }

    const features = [
        {
            icon: (
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            ),
            title: 'Find Organizations',
            description: 'Search and browse organizations near you with active queues'
        },
        {
            icon: (
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
            ),
            title: 'Join Queue',
            description: 'Get your digital token instantly and skip the physical line'
        },
        {
            icon: (
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            ),
            title: 'Track in Real-time',
            description: 'Monitor your position and get notified when it\'s your turn'
        }
    ];


    return (
        <div className="landing-page">

            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-background">
                    <div className="hero-gradient"></div>
                    <div className="hero-pattern"></div>
                </div>

                <div className="container">
                    <div className="hero-content">


                        <h1 className="hero-title">
                            Skip the Wait,
                            <br />
                            <span className="gradient-text">Track Your Turn</span>
                        </h1>

                        <p className="hero-subtitle">
                            Join queues digitally, track your position in real-time, and get notified when it's your turn.
                            No more standing in long lines.
                        </p>

                        {/* Search Bar */}
                        <form className="hero-search" onSubmit={handleSearch}>
                            <div className="search-input-wrapper">
                                <svg className="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    type="text"
                                    className="search-input"
                                    placeholder="Search for hospitals, clinics, government offices..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <button type="submit" className="btn btn-primary btn-lg search-button">
                                Search
                                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </button>
                        </form>

                        {/* Quick Actions */}
                        <div className="quick-actions">
                            <button className="quick-action-btn" onClick={() => navigate('/scan')}>
                                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                                </svg>
                                Scan QR Code
                            </button>
                            {user && (
                                <button className="quick-action-btn" onClick={() => navigate('/my-tokens')}>
                                    <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                                    </svg>
                                    My Tokens
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Hero Image/Illustration */}
                    <div className="hero-visual">
                        <div className="visual-card card-1">
                            <div className="card-icon">📱</div>
                            <div className="card-text">
                                <div className="card-title">Token #A042</div>
                                <div className="card-subtitle">Position: 3rd in line</div>
                            </div>
                            <div className="status-indicator status-active"></div>
                        </div>
                        <div className="visual-card card-2">
                            <div className="card-icon">✅</div>
                            <div className="card-text">
                                <div className="card-title">Your turn!</div>
                                <div className="card-subtitle">Please proceed to counter</div>
                            </div>
                        </div>
                        <div className="visual-card card-3">
                            <div className="card-icon">⏱️</div>
                            <div className="card-text">
                                <div className="card-title">~15 min wait</div>
                                <div className="card-subtitle">5 people ahead</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Available Queues Section (New) */}
            <section className="queues-section">
                <div className="container">
                    <div className="section-header">
                        <h2 className="section-title">Available Queues</h2>
                        <p className="section-subtitle">Join an active queue immediately</p>
                    </div>
                    {loading ? (
                        <div className="loading-spinner">Loading queues...</div>
                    ) : publicQueues.length > 0 ? (
                        <div className="queues-grid">
                            {publicQueues.map(queue => (
                                <div key={queue.id} className="queue-card">
                                    <div className="queue-header">
                                        <h3 className="queue-name">{queue.name}</h3>
                                        <span className="queue-badge">{queue.waitingCount} Waiting</span>
                                    </div>
                                    <p className="queue-org">{queue.organisationName}</p>
                                    <p className="queue-desc">{queue.description}</p>
                                    <div className="queue-footer">
                                        <span className="wait-time">~{queue.averageTime || 10} min wait</span>
                                        <button
                                            className="btn btn-sm btn-primary"
                                            onClick={() => handleJoinQueue(queue.id)}
                                        >
                                            Join Queue
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="no-queues">
                            <p>No active queues found. Try searching above.</p>
                        </div>
                    )}
                </div>
            </section>



            {/* Features Section */}
            <section className="features-section">
                <div className="container">
                    <div className="section-header">
                        <h2 className="section-title">How It Works</h2>
                        <p className="section-subtitle">
                            Get started in three simple steps
                        </p>
                    </div>

                    <div className="features-grid">
                        {features.map((feature, index) => (
                            <div key={index} className="feature-card">
                                <div className="feature-number">{index + 1}</div>
                                <div className="feature-icon">
                                    {feature.icon}
                                </div>
                                <h3 className="feature-title">{feature.title}</h3>
                                <p className="feature-description">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section">
                <div className="container">
                    <div className="cta-card">
                        <h2 className="cta-title">Ready to skip the wait?</h2>
                        <p className="cta-subtitle">
                            Join thousands of users who are saving time every day
                        </p>
                        <div className="cta-buttons">
                            {user ? (
                                <button className="btn btn-primary btn-lg" onClick={() => navigate('/search')}>
                                    Browse Organizations
                                </button>
                            ) : (
                                <>
                                    <button className="btn btn-primary btn-lg" onClick={() => navigate('/register')}>
                                        Get Started Free
                                    </button>
                                    <button className="btn btn-secondary btn-lg" onClick={() => navigate('/login')}>
                                        Sign In
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="footer">
                <div className="container">
                    <div className="footer-content">
                        <div className="footer-brand">
                            <div className="footer-logo">Q-Ease</div>
                            <p className="footer-tagline">
                                Making queues easier, one token at a time.
                            </p>
                        </div>
                        <div className="footer-links">
                            <div className="footer-column">
                                <h4>Product</h4>
                                <a href="/features">Features</a>
                                <a href="/pricing">Pricing</a>
                                <a href="/faq">FAQ</a>
                            </div>
                            <div className="footer-column">
                                <h4>Company</h4>
                                <a href="/about">About</a>
                                <a href="/contact">Contact</a>
                                <a href="/careers">Careers</a>
                            </div>
                            <div className="footer-column">
                                <h4>Legal</h4>
                                <a href="/privacy">Privacy</a>
                                <a href="/terms">Terms</a>
                                <a href="/cookies">Cookies</a>
                            </div>
                        </div>
                    </div>
                    <div className="footer-bottom">
                        <p>&copy; 2026 Q-Ease. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
