import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const getDefaultDashboard = (role) => {
  switch (role) {
    case 'SUPER_ADMIN':
      return '/admin/dashboard';
    case 'ORGANISATION_ADMIN':
      return '/admin/dashboard';
    case 'STAFF':
      return '/staff/dashboard';
    case 'CUSTOMER':
      return '/browse';
    default:
      return '/';
  }
};

const PrivateRoute = ({ children, roles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) {
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

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check role-based access
  if (roles.length > 0 && !roles.includes(user.role)) {
    const defaultDashboard = getDefaultDashboard(user.role);
    return <Navigate to={defaultDashboard} replace />;
  }

  return children;
};

export default PrivateRoute;