import React, { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getDashboardPath } from '../../utils/roleUtils';
import './Layout.css';

const Layout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const isActive = (path) => {
    return location.pathname === path;
  };

  const isStaffPath = () => {
    return location.pathname.startsWith('/staff');
  };

  const isAdminPath = () => {
    return location.pathname.startsWith('/admin');
  };

  const getUserNavItems = () => [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/search', label: 'Browse', icon: '🔍' },
  ];

  const getStaffNavItems = () => [
    { path: '/staff/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/search', label: 'Browse Orgs', icon: '🏢' },
  ];

  const getAdminNavItems = () => [
    { path: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/admin/organisations', label: 'Organisations', icon: '🏢' },
    { path: '/admin/users', label: 'Users', icon: '👥' },
  ];

  const getNavItems = () => {
    if (isAdminPath()) return getAdminNavItems();
    if (isStaffPath()) return getStaffNavItems();
    return getUserNavItems();
  };

  const getBottomNavItems = () => {
    if (isStaffPath()) {
      return [
        { path: '/staff/dashboard', label: 'Dashboard', icon: '📊' },
        { path: '/staff/queues', label: 'Queues', icon: '📋' },
        { path: '/notifications', label: 'Notifications', icon: '🔔' },
        { path: '/staff/profile', label: 'Profile', icon: '👤' }
      ];
    } else if (isAdminPath()) {
      return [
        { path: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
        { path: '/admin/queues', label: 'Queues', icon: '📋' },
        { path: '/admin/analytics', label: 'Analytics', icon: '📈' },
        { path: '/admin/settings', label: 'Settings', icon: '⚙️' }
      ];
    } else {
      return [
        { path: '/', label: 'Home', icon: '🏠' },
        { path: '/track', label: 'My Queue', icon: '📋' },
        { path: '/notifications', label: 'Notifications', icon: '🔔' },
        { path: '/profile', label: 'Profile', icon: '👤' }
      ];
    }
  };

  const getWelcomeMessage = () => {
    if (!user) return '';

    if (isStaffPath()) {
      return `Staff Portal - ${user.firstName} ${user.lastName}`;
    }

    if (isAdminPath()) {
      return `Admin Portal - ${user.firstName} ${user.lastName}`;
    }

    return `Welcome, ${user.firstName}`;
  };

  const shouldShowNavigation = () => {
    const hideNavPaths = ['/login'];
    const isOrgDetail = location.pathname.includes('/organisation/') &&
      !location.pathname.includes('/organisation/search');

    return !hideNavPaths.includes(location.pathname) && !isOrgDetail;
  };

  const shouldShowBottomNav = () => {
    return window.innerWidth <= 768 && shouldShowNavigation() && user;
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="layout">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <Link to={getDashboardPath(user)}>Q-Ease</Link>
          </div>

          {user && (
            <div className="user-info">
              <span className="welcome-text">{getWelcomeMessage()}</span>
              <button onClick={handleLogout} className="logout-button">
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Desktop Navigation */}
      {shouldShowNavigation() && user && !shouldShowBottomNav() && (
        <nav className="navigation">
          <div className="nav-content">
            {getNavItems().map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-text">{item.label}</span>
              </Link>
            ))}
          </div>
        </nav>
      )}

      {/* Main Content */}
      <main className="main-content">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation */}
      {shouldShowBottomNav() && (
        <nav className="bottom-navigation">
          {getBottomNavItems().map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </Link>
          ))}
        </nav>
      )}

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <p>&copy; 2026 Q-Ease Digital Queue Management System</p>
          <div className="footer-links">
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms of Service</Link>
            <Link to="/support">Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;