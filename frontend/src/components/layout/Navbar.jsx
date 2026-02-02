import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getDashboardPath } from '../../utils/roleUtils';
import './Navbar.css';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const homeLink = getDashboardPath(user);

    return (
        <nav className="navbar">
            <div className="container">
                <div className="navbar-content">
                    {/* Logo */}
                    <Link to={homeLink} className="navbar-logo">
                        <div className="logo-icon">
                            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                                <rect width="32" height="32" rx="8" fill="url(#gradient)" />
                                <path d="M16 8L22 14L16 20L10 14L16 8Z" fill="white" />
                                <defs>
                                    <linearGradient id="gradient" x1="0" y1="0" x2="32" y2="32">
                                        <stop offset="0%" stopColor="#3B82F6" />
                                        <stop offset="100%" stopColor="#1D4ED8" />
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>
                        <span className="logo-text">Q-Ease</span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="navbar-links desktop-only">
                        {user ? (
                            <>
                                <Link to="/" className="nav-link">Home</Link>
                                <Link to="/about" className="nav-link">About</Link>
                                
                                {/* Customer Links */}
                                {(!user.role || user.role === 'customer' || user.role === 'USER') && (
                                    <>
                                        <Link to="/browse" className="nav-link">
                                            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                            Browse
                                        </Link>
                                        <Link to="/my-tokens" className="nav-link">
                                            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                                            </svg>
                                            My Tokens
                                        </Link>
                                        <Link to="/scan" className="nav-link">
                                            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                                            </svg>
                                            Scan QR
                                        </Link>
                                    </>
                                )}

                                {/* Staff Links */}
                                {['STAFF', 'ADMIN', 'SUPER_ADMIN'].includes(user.role) && (
                                    <Link to="/staff/dashboard" className="nav-link">
                                        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Staff Dashboard
                                    </Link>
                                )}

                                {/* Admin Links */}
                                {['ADMIN', 'SUPER_ADMIN'].includes(user.role) && (
                                    <>
                                        <Link to="/admin/dashboard" className="nav-link">
                                            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            Dashboard
                                        </Link>
                                        <Link to="/admin/queues" className="nav-link">
                                            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                            </svg>
                                            Queues
                                        </Link>
                                    </>
                                )}
                            </>
                        ) : null}
                    </div>

                    {/* User Menu */}
                    <div className="navbar-actions">
                        {user ? (
                            <div className="user-menu">
                                <button className="user-button" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                                    <div className="user-avatar-icon">
                                        <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </div>
                                    <span className="user-name desktop-only">{user.name}</span>
                                    <svg className="chevron" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {isMenuOpen && (
                                    <div className="dropdown-menu">
                                        <Link to="/profile" className="dropdown-item" onClick={() => setIsMenuOpen(false)}>
                                            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                            Profile
                                        </Link>
                                        <Link to="/notifications" className="dropdown-item" onClick={() => setIsMenuOpen(false)}>
                                            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                            </svg>
                                            Notifications
                                        </Link>
                                        <div className="dropdown-divider"></div>
                                        <button className="dropdown-item" onClick={handleLogout}>
                                            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                            </svg>
                                            Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="auth-buttons">
                                <Link to="/login" className="btn btn-secondary btn-sm">Login</Link>
                                <Link to="/register" className="btn btn-primary btn-sm">Sign Up</Link>
                            </div>
                        )}

                        {/* Mobile Menu Toggle */}
                        <button
                            className="mobile-menu-toggle mobile-only"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                        >
                            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {isMenuOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="mobile-menu mobile-only">
                        {user ? (
                            <>
                                {/* Customer Links */}
                                {(!user.role || user.role === 'customer' || user.role === 'USER') && (
                                    <>
                                        <Link to="/" className="mobile-link" onClick={() => setIsMenuOpen(false)}>
                                            Browse Organizations
                                        </Link>
                                        <Link to="/my-tokens" className="mobile-link" onClick={() => setIsMenuOpen(false)}>
                                            My Tokens
                                        </Link>
                                        <Link to="/scan" className="mobile-link" onClick={() => setIsMenuOpen(false)}>
                                            Scan QR Code
                                        </Link>
                                    </>
                                )}

                                {/* Staff Links */}
                                {['STAFF', 'ADMIN', 'SUPER_ADMIN'].includes(user.role) && (
                                    <Link to="/staff/dashboard" className="mobile-link" onClick={() => setIsMenuOpen(false)}>
                                        Staff Dashboard
                                    </Link>
                                )}

                                {/* Admin Links */}
                                {['ADMIN', 'SUPER_ADMIN'].includes(user.role) && (
                                    <Link to="/admin/dashboard" className="mobile-link" onClick={() => setIsMenuOpen(false)}>
                                        Admin Dashboard
                                    </Link>
                                )}

                                <div className="mobile-divider"></div>
                                <Link to="/profile" className="mobile-link" onClick={() => setIsMenuOpen(false)}>
                                    Profile
                                </Link>
                                <button className="mobile-link" onClick={handleLogout}>
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/" className="mobile-link" onClick={() => setIsMenuOpen(false)}>
                                    Home
                                </Link>
                                <Link to="/about" className="mobile-link" onClick={() => setIsMenuOpen(false)}>
                                    About
                                </Link>
                                <Link to="/login" className="mobile-link" onClick={() => setIsMenuOpen(false)}>
                                    Login
                                </Link>
                                <Link to="/register" className="mobile-link" onClick={() => setIsMenuOpen(false)}>
                                    Sign Up
                                </Link>
                            </>
                        )}
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
