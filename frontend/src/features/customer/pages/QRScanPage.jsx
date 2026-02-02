import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import '../styles/QRScanPage.css';

const QRScanPage = () => {
    const navigate = useNavigate();
    const [scanning, setScanning] = useState(false);
    const [error, setError] = useState(null);
    const [scanner, setScanner] = useState(null);

    useEffect(() => {
        startScanner();

        return () => {
            if (scanner) {
                scanner.clear().catch(console.error);
            }
        };
    }, []);

    const startScanner = () => {
        try {
            const html5QrcodeScanner = new Html5QrcodeScanner(
                "qr-reader",
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0
                },
                false
            );

            html5QrcodeScanner.render(onScanSuccess, onScanError);
            setScanner(html5QrcodeScanner);
            setScanning(true);
        } catch (err) {
            console.error('Scanner error:', err);
            setError('Failed to start camera. Please check permissions.');
        }
    };

    const onScanSuccess = (decodedText, decodedResult) => {
        console.log('QR Code scanned:', decodedText);

        try {
            // Parse QR code data
            const url = new URL(decodedText);
            const pathname = url.pathname;

            // Handle different QR code types
            if (pathname.includes('/org/')) {
                const orgCode = pathname.split('/org/')[1];
                navigate(`/org/${orgCode}`);
            } else if (pathname.includes('/queue/')) {
                const queueId = pathname.split('/queue/')[1];
                navigate(`/queue/${queueId}`);
            } else if (pathname.includes('/token/')) {
                const tokenId = pathname.split('/token/')[1];
                navigate(`/token/${tokenId}`);
            } else {
                // Try to navigate to the URL directly
                window.location.href = decodedText;
            }
        } catch (err) {
            // If not a URL, treat as organization code
            navigate(`/org/${decodedText}`);
        }
    };

    const onScanError = (errorMessage) => {
        // Ignore frequent scanning errors
        if (!errorMessage.includes('NotFoundException')) {
            console.warn('QR Scan error:', errorMessage);
        }
    };

    return (
        <div className="qr-scan-page">
            <div className="container">
                <h1>Scan QR Code</h1>
                <p>Scan a Q-Ease QR code to join a queue directly.</p>
                <div className="scan-container">
                    <div className="scan-header">
                        <button className="back-button" onClick={() => navigate(-1)}>
                            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            Back
                        </button>
                        <h1>Scan QR Code</h1>
                        <p>Point your camera at a Q-Ease QR code to join a queue</p>
                    </div>

                    {error ? (
                        <div className="error-card">
                            <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <h3>Camera Error</h3>
                            <p>{error}</p>
                            <button className="btn btn-primary" onClick={startScanner}>
                                Try Again
                            </button>
                        </div>
                    ) : (
                        <div className="scanner-wrapper">
                            <div id="qr-reader"></div>

                            <div className="scan-instructions">
                                <div className="instruction-item">
                                    <div className="instruction-number">1</div>
                                    <p>Allow camera access when prompted</p>
                                </div>
                                <div className="instruction-item">
                                    <div className="instruction-number">2</div>
                                    <p>Position QR code within the frame</p>
                                </div>
                                <div className="instruction-item">
                                    <div className="instruction-number">3</div>
                                    <p>Wait for automatic detection</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Manual Entry Option */}
                    <div className="manual-entry">
                        <div className="divider">
                            <span>or enter code manually</span>
                        </div>
                        <button
                            className="btn btn-secondary btn-lg btn-block"
                            onClick={() => {
                                const code = prompt('Enter organization code:');
                                if (code) {
                                    navigate(`/org/${code}`);
                                }
                            }}
                        >
                            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Enter Code Manually
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QRScanPage;
