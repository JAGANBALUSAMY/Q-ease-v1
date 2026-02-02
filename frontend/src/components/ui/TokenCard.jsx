import React from 'react';
import './TokenCard.css';

const TokenCard = ({ token, onCancel }) => {
    const getStatusColor = (status) => {
        const colors = {
            PENDING: 'status-pending',
            CALLED: 'status-called',
            SERVED: 'status-served',
            CANCELLED: 'status-cancelled'
        };
        return colors[status] || 'status-pending';
    };

    const getStatusText = (status) => {
        const texts = {
            PENDING: 'Waiting',
            CALLED: 'Your Turn!',
            SERVED: 'Completed',
            CANCELLED: 'Cancelled'
        };
        return texts[status] || status;
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'PENDING':
                return (
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
            case 'CALLED':
                return (
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                );
            case 'SERVED':
                return (
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
            case 'CANCELLED':
                return (
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
            default:
                return null;
        }
    };

    return (
        <div className={`token-card ${getStatusColor(token.status)}`}>
            {/* Status Banner */}
            {token.status === 'CALLED' && (
                <div className="urgent-banner">
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    <span>Please proceed to the counter immediately!</span>
                </div>
            )}

            {/* Token Header */}
            <div className="token-header">
                <div className="token-status">
                    <div className={`status-icon ${getStatusColor(token.status)}`}>
                        {getStatusIcon(token.status)}
                    </div>
                    <span className="status-text">{getStatusText(token.status)}</span>
                </div>
                {token.queueName && (
                    <span className="queue-name">{token.queueName}</span>
                )}
            </div>

            {/* Token Number - Large Display */}
            <div className="token-number-display">
                <div className="token-label">Token Number</div>
                <div className="token-number">{token.tokenId}</div>
            </div>

            {/* Token Details */}
            <div className="token-details">
                {token.status === 'PENDING' && (
                    <>
                        <div className="detail-item">
                            <div className="detail-icon">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <div className="detail-content">
                                <div className="detail-label">Position in Queue</div>
                                <div className="detail-value">{token.position ? `${token.position}${getOrdinalSuffix(token.position)} in line` : 'Next'}</div>
                            </div>
                        </div>

                        <div className="detail-item">
                            <div className="detail-icon">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="detail-content">
                                <div className="detail-label">Estimated Wait Time</div>
                                <div className="detail-value">{token.estimatedWaitTime ? `~${token.estimatedWaitTime} minutes` : 'Calculating...'}</div>
                            </div>
                        </div>
                    </>
                )}

                {token.status === 'CALLED' && (
                    <div className="called-message">
                        <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <p>Your token has been called!</p>
                        <p className="sub-message">Please proceed to the service counter now</p>
                    </div>
                )}

                {token.status === 'SERVED' && (
                    <div className="served-message">
                        <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p>Service completed</p>
                        <p className="sub-message">Thank you for using Q-Ease!</p>
                    </div>
                )}
            </div>

            {/* Actions */}
            {token.status === 'PENDING' && onCancel && (
                <div className="token-actions">
                    <button
                        className="btn btn-danger btn-sm"
                        onClick={() => onCancel(token.id)}
                    >
                        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Cancel Token
                    </button>
                </div>
            )}

            {/* QR Code (if available) */}
            {token.qrCode && (
                <div className="token-qr">
                    <img src={token.qrCode} alt="Token QR Code" />
                    <p className="qr-label">Scan to track</p>
                </div>
            )}
        </div>
    );
};

// Helper function for ordinal suffix
const getOrdinalSuffix = (num) => {
    const j = num % 10;
    const k = num % 100;
    if (j === 1 && k !== 11) return 'st';
    if (j === 2 && k !== 12) return 'nd';
    if (j === 3 && k !== 13) return 'rd';
    return 'th';
};

export default TokenCard;
