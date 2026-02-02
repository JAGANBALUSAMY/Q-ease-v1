import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import '../styles/NotificationsPage.css';

const NotificationsPage = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch notifications (placeholder logic)
        // api.get('/notifications').then...
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
                        <p>No new notifications</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationsPage;
