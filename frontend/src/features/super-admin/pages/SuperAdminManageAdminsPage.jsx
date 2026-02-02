import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../services/api';
import '../../admin/styles/AdminUserManagementPage.css'; // Reuse admin CSS

const SuperAdminManageAdminsPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [newAdmin, setNewAdmin] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        phoneNumber: ''
    });

    useEffect(() => {
        loadAdmins();
    }, []);

    const loadAdmins = async () => {
        try {
            setLoading(true);
            setError('');

            const response = await api.get('/super/admins');
            setAdmins(response.data.data || []);
        } catch (err) {
            setError('Failed to load admins');
            console.error('Error loading admins:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddAdmin = async (e) => {
        e.preventDefault();

        if (!newAdmin.firstName || !newAdmin.lastName || !newAdmin.email || !newAdmin.password) {
            setError('All fields are required');
            return;
        }

        try {
            await api.post('/super/admins', newAdmin);
            setNewAdmin({ firstName: '', lastName: '', email: '', password: '', phoneNumber: '' });
            setShowAddModal(false);
            loadAdmins(); // Refresh the list
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to add admin');
            console.error('Error adding admin:', err);
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading admins...</p>
            </div>
        );
    }

    return (
        <div className="user-management-page">
            <div className="page-header">
                <button onClick={() => navigate(-1)} className="back-button">
                    ← Back to Dashboard
                </button>
                <h1>Manage Admins</h1>
            </div>

            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}

            <div className="controls-section">
                <div className="search-filter">
                    {/* Search could be added here */}
                    <p>Managing admins who report to you (Lineage Restricted).</p>
                </div>

                <button
                    onClick={() => setShowAddModal(true)}
                    className="add-user-button"
                >
                    + Create New Admin
                </button>
            </div>

            <div className="users-table">
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Status</th>
                            <th>Created At</th>
                        </tr>
                    </thead>
                    <tbody>
                        {admins.length > 0 ? (
                            admins.map((admin) => (
                                <tr key={admin.id}>
                                    <td>
                                        <div className="user-info">
                                            <span className="user-name">{admin.firstName} {admin.lastName}</span>
                                        </div>
                                    </td>
                                    <td>{admin.email}</td>
                                    <td>
                                        <span className={`status-badge ${admin.isActive ? 'active' : 'inactive'}`}>
                                            {admin.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td>{new Date(admin.createdAt).toLocaleDateString()}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="4" className="empty-row">
                                    <div className="empty-state">
                                        <h4>No admins found</h4>
                                        <p>You haven't created any admins yet.</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add Admin Modal */}
            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Create New Admin</h3>
                            <button onClick={() => setShowAddModal(false)} className="close-button">×</button>
                        </div>

                        <form onSubmit={handleAddAdmin} className="add-user-form">
                            <div className="form-group">
                                <label>First Name *</label>
                                <input
                                    type="text"
                                    value={newAdmin.firstName}
                                    onChange={(e) => setNewAdmin({ ...newAdmin, firstName: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Last Name *</label>
                                <input
                                    type="text"
                                    value={newAdmin.lastName}
                                    onChange={(e) => setNewAdmin({ ...newAdmin, lastName: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Email *</label>
                                <input
                                    type="email"
                                    value={newAdmin.email}
                                    onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Password *</label>
                                <input
                                    type="password"
                                    value={newAdmin.password}
                                    onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Phone Number</label>
                                <input
                                    type="tel"
                                    value={newAdmin.phoneNumber}
                                    onChange={(e) => setNewAdmin({ ...newAdmin, phoneNumber: e.target.value })}
                                />
                            </div>

                            <div className="form-actions">
                                <button type="button" onClick={() => setShowAddModal(false)} className="cancel-button">
                                    Cancel
                                </button>
                                <button type="submit" className="save-button">
                                    Create Admin
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuperAdminManageAdminsPage;
