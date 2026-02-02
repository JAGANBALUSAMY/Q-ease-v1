import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';

// Pages
// Shared Pages
import LandingPage from './features/shared/pages/LandingPage';
import NotFoundPage from './features/shared/pages/NotFoundPage';

// Auth Pages
import LoginPage from './features/auth/pages/LoginPage';
import RegisterPage from './features/auth/pages/RegisterPage';

// Customer Pages
import OrganizationSearchPage from './features/customer/pages/OrganizationSearchPage';
import CustomerQueuePage from './features/customer/pages/CustomerQueuePage';
import OrganizationDetailPage from './features/customer/pages/OrganizationDetailPage';
import MyTokensPage from './features/customer/pages/MyTokensPage';

// Staff Pages
import StaffDashboardPage from './features/staff/pages/StaffDashboardPage';
import StaffCallNextPage from './features/staff/pages/StaffCallNextPage';

// Admin Pages
import AdminDashboardPage from './features/admin/pages/AdminDashboardPage';
import AdminUserManagementPage from './features/admin/pages/AdminUserManagementPage';
import AdminCustomerManagementPage from './features/admin/pages/AdminCustomerManagementPage';
import AdminAnalyticsPage from './features/admin/pages/AdminAnalyticsPage';
import AdminQueueManagementPage from './features/admin/pages/AdminQueueManagementPage';
import AdminSettingsPage from './features/admin/pages/AdminSettingsPage';
import SystemDashboardPage from './features/admin/pages/SystemDashboard';

// Other Pages (need to categorize)
import QRScanPage from './features/customer/pages/QRScanPage';
import QueueJoinPage from './features/customer/pages/QueueJoinPage';
import OrganisationSearchPage from './features/customer/pages/OrganisationSearchPage';

// Super Admin Pages
import SuperAdminManageAdminsPage from './features/super-admin/pages/SuperAdminManageAdminsPage';

// Shared Pages (Profile, Notifications)
import ProfilePage from './features/shared/pages/ProfilePage';
import NotificationsPage from './features/shared/pages/NotificationsPage';

// Components
import PrivateRoute from './components/routing/PrivateRoute';
import Navbar from './components/layout/Navbar';

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <Navbar />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/search" element={<OrganizationSearchPage />} />
            <Route path="/queue/:queueId" element={<CustomerQueuePage />} />

            {/* Protected User Routes */}
            <Route
              path="/browse"
              element={
                <PrivateRoute>
                  <OrganizationSearchPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/org/:orgCode"
              element={
                <PrivateRoute>
                  <OrganizationDetailPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/my-tokens"
              element={
                <PrivateRoute>
                  <MyTokensPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/customer/queue/:queueId"
              element={
                <PrivateRoute roles={['CUSTOMER']}>
                  <CustomerQueuePage />
                </PrivateRoute>
              }
            />

            {/* Staff Routes */}
            <Route
              path="/staff/dashboard"
              element={
                <PrivateRoute roles={['STAFF', 'ORGANISATION_ADMIN', 'SUPER_ADMIN']}>
                  <StaffDashboardPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/staff/queue/:queueId"
              element={
                <PrivateRoute roles={['STAFF', 'ORGANISATION_ADMIN', 'SUPER_ADMIN']}>
                  <StaffCallNextPage />
                </PrivateRoute>
              }
            />
            {/* Redirect legacy /staff to /staff/dashboard */}
            <Route path="/staff" element={<Navigate to="/staff/dashboard" replace />} />

            {/* Admin Routes */}
            <Route
              path="/admin/dashboard"
              element={
                <PrivateRoute roles={['ORGANISATION_ADMIN', 'SUPER_ADMIN']}>
                  <AdminDashboardPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/system"
              element={
                <PrivateRoute roles={['ORGANISATION_ADMIN', 'SUPER_ADMIN']}>
                  <SystemDashboardPage />
                </PrivateRoute>
              }
            />
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

            {/* Super Admin Routes */}
            <Route
              path="/super-admin/dashboard"
              element={
                <PrivateRoute roles={['SUPER_ADMIN']}>
                  {/* Reusing AdminDashboardPage for now, but on a distinct route */}
                  <AdminDashboardPage />
                </PrivateRoute>
              }
            />

            <Route
              path="/admin/admins"
              element={
                <PrivateRoute roles={['SUPER_ADMIN']}>
                  <SuperAdminManageAdminsPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <PrivateRoute roles={['ORGANISATION_ADMIN', 'SUPER_ADMIN']}>
                  <AdminUserManagementPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/customers"
              element={
                <PrivateRoute roles={['ORGANISATION_ADMIN', 'SUPER_ADMIN']}>
                  <AdminCustomerManagementPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/analytics"
              element={
                <PrivateRoute roles={['ORGANISATION_ADMIN', 'SUPER_ADMIN']}>
                  <AdminAnalyticsPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/queues"
              element={
                <PrivateRoute roles={['ORGANISATION_ADMIN', 'SUPER_ADMIN']}>
                  <AdminQueueManagementPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/queues/:queueId"
              element={
                <PrivateRoute roles={['ORGANISATION_ADMIN', 'SUPER_ADMIN']}>
                  <AdminQueueManagementPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <PrivateRoute roles={['ORGANISATION_ADMIN', 'SUPER_ADMIN']}>
                  <AdminSettingsPage />
                </PrivateRoute>
              }
            />

            {/* Common Authenticated Routes */}
            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <ProfilePage />
                </PrivateRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <PrivateRoute roles={['USER', 'CUSTOMER']}>
                  <NotificationsPage />
                </PrivateRoute>
              }
            />


            {/* Catch all - 404 Not Found */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
// Rebuild trigger