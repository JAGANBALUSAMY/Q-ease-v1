import React from 'react';
import './QueueCard.css';

const QueueCard = ({ queue, onJoin }) => {
    const getStatusBadge = () => {
        if (!queue.isActive) {
            return <span className="badge badge-gray">Paused</span>;
        }
        return <span className="badge badge-success">Active</span>;
    };

    const getWaitTimeColor = (minutes) => {
        if (minutes <= 15) return 'wait-short';
        if (minutes <= 30) return 'wait-medium';
        return 'wait-long';
    };

    return (
        <div className={`queue-card ${!queue.isActive ? 'queue-paused' : ''}`}>
            <div className="queue-header">
                <div className="queue-title-section">
                    <h3 className="queue-name">{queue.name}</h3>
                    {getStatusBadge()}
                </div>
                {queue.description && (
                    <p className="queue-description">{queue.description}</p>
                )}
            </div>

            <div className="queue-stats">
                <div className="stat-item">
                    <div className="stat-icon">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{queue.waitingCount || 0}</div>
                        <div className="stat-label">Waiting</div>
                    </div>
                </div>

                <div className="stat-item">
                    <div className="stat-icon">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div className="stat-content">
                        <div className={`stat-value ${getWaitTimeColor(queue.averageTime || 0)}`}>
                            ~{queue.averageTime || 0} min
                        </div>
                        <div className="stat-label">Avg Wait</div>
                    </div>
                </div>
            </div>

            {queue.isActive ? (
                <button
                    className="btn btn-primary btn-block"
                    onClick={() => onJoin(queue.id)}
                >
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Join Queue
                </button>
            ) : (
                <button className="btn btn-secondary btn-block" disabled>
                    Queue Paused
                </button>
            )}
        </div>
    );
};

export default QueueCard;
