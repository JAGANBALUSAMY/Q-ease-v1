import React, { useState, useEffect } from 'react';
import notificationService from '../../../services/notificationService';
import '../styles/NotificationsPage.css';

const NotificationsPage = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const data = notificationService.getNotifications();
        setNotifications(data);
        setLoading(false);
    }, []);

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
                                        <div className="notification-text"><strong>{n.title}</strong> — {n.body}</div>
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
