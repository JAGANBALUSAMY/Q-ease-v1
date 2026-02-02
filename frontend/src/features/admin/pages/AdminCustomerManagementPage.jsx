import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../services/api';
import '../styles/AdminUserManagementPage.css';

const AdminCustomerManagementPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            setLoading(true);
            setError('');

            const response = await api.get('/users');
            // Filter to show only USER/CUSTOMER users
            const allUsers = response.data.data.users || [];
            const customerUsers = allUsers.filter(user => user.role === 'USER');
            setUsers(customerUsers);
        } catch (err) {
            setError('Failed to load customers');
            console.error('Error loading users:', err);
        } finally {
            setLoading(false);
        }
    };

    const toggleUserStatus = async (userId, currentStatus) => {
        try {
            await api.put(`/users/${userId}/status`, { isActive: !currentStatus });
            loadUsers(); // Refresh the list
        } catch (err) {
            setError('Failed to update user status');
            console.error('Error updating user status:', err);
        }
    };

    const deleteUser = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this customer?')) return;

        try {
            await api.delete(`/users/${userId}`);
            loadUsers(); // Refresh the list
        } catch (err) {
            setError('Failed to delete customer');
            console.error('Error deleting user:', err);
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    const getRoleColor = (role) => {
        return '#3498db'; // Blue for customers
    };

    const getRoleLabel = (role) => {
        return 'Customer';
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading customers...</p>
            </div>
        );
    }

    return (
        <div className="user-management-page">
            <div className="page-header">
                <button onClick={() => navigate(-1)} className="back-button">
                    ← Back to Dashboard
                </button>
                <h1>Customer Management</h1>
            </div>

            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}

            <div className="controls-section">
                <div className="search-filter">
                    <input
                        type="text"
                        placeholder="Search customers..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>
            </div>

            <div className="users-table">
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.length > 0 ? (
                            filteredUsers.map((user) => (
                                <tr key={user.id}>
                                    <td>
                                        <div className="user-info">
                                            <span className="user-name">{user.firstName} {user.lastName}</span>
                                            <span className="user-id">ID: {user.id.substring(0, 8)}</span>
                                        </div>
                                    </td>
                                    <td>{user.email}</td>
                                    <td>{user.phoneNumber || 'N/A'}</td>
                                    <td>
                                        <span
                                            className="role-badge"
                                            style={{ backgroundColor: getRoleColor(user.roleModel?.name || user.role) }}
                                        >
                                            {getRoleLabel(user.roleModel?.name || user.role)}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                                            {user.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="action-buttons">
                                            <button
                                                onClick={() => toggleUserStatus(user.id, user.isActive)}
                                                className={`status-toggle ${user.isActive ? 'deactivate' : 'activate'}`}
                                            >
                                                {user.isActive ? 'Deactivate' : 'Activate'}
                                            </button>
                                            <button
                                                onClick={() => deleteUser(user.id)}
                                                className="delete-button"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" className="empty-row">
                                    <div className="empty-state">
                                        <h4>No customers found</h4>
                                        <p>No customers match your search criteria.</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminCustomerManagementPage;
