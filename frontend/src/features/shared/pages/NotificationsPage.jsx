import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../utils/api';
import '../styles/NotificationsPage.css';

const NotificationsPage = () => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Only CUSTOMER role can see notifications
        if (user?.role === 'CUSTOMER') {
            fetchUserNotifications();
        } else {
            setLoading(false);
        }
    }, [user]);

    const fetchUserNotifications = async () => {
        try {
            setLoading(true);
            const response = await api.get('/notifications');
            // Filter notifications to show only current user's notifications
            const userNotifications = response.data.data.notifications || [];
            setNotifications(userNotifications);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    // Staff, Admin, Super Admin should not see notifications
    if (user?.role !== 'CUSTOMER') {
        return (
            <div className="container" style={{ padding: '2rem' }}>
                <h1>Notifications</h1>
                <p>Notifications are only available for customers.</p>
            </div>
        );
    }

    return (
        <div>
            <div className="container" style={{ padding: '2rem' }}>
                <h1>Notifications</h1>
                {loading ? (
                    <p>Loading...</p>
                ) : (
                    <div className="notifications-list">
                        {notifications.length === 0 ? (
                            <p>No new notifications</p>
                        ) : (
                            notifications.map((n) => (
                                <div key={n.id} className="notification-item">
                                    <div className="notification-content">
                                        <div className="notification-text"><strong>{n.title}</strong> — {n.message}</div>
                                        <div className="notification-time">{new Date(n.createdAt).toLocaleString()}</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationsPage;
