import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getDashboardPath, normalizeRole } from '../../utils/roleUtils';

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
  const userRole = normalizeRole(user.role);
  if (roles.length > 0 && !roles.includes(userRole)) {
    return <Navigate to={getDashboardPath(user)} replace />;
  }

  return children;
};

export default PrivateRoute;