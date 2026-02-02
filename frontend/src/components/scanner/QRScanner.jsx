import { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import './QRScanner.css';

const QRScanner = ({ onScanSuccess, onScanError }) => {
    const [scanning, setScanning] = useState(false);
    const [scanner, setScanner] = useState(null);

    useEffect(() => {
        if (scanning && !scanner) {
            const html5QrcodeScanner = new Html5QrcodeScanner(
                "qr-reader",
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0,
                    showTorchButtonIfSupported: true
                },
                false
            );

            html5QrcodeScanner.render(
                (decodedText, decodedResult) => {
                    console.log('QR Code scanned:', decodedText);

                    // Parse QR data
                    try {
                        const data = JSON.parse(decodedText);
                        onScanSuccess(data);
                    } catch (e) {
                        // If not JSON, treat as simple code
                        onScanSuccess({ type: 'code', value: decodedText });
                    }

                    // Stop scanning after successful scan
                    html5QrcodeScanner.clear();
                    setScanning(false);
                    setScanner(null);
                },
                (errorMessage) => {
                    // Handle scan errors (usually just "no QR code found")
                    if (onScanError && !errorMessage.includes('NotFoundException')) {
                        onScanError(errorMessage);
                    }
                }
            );

            setScanner(html5QrcodeScanner);
        }

        return () => {
            if (scanner) {
                scanner.clear().catch(console.error);
            }
        };
    }, [scanning, scanner, onScanSuccess, onScanError]);

    const startScanning = () => {
        setScanning(true);
    };

    const stopScanning = () => {
        if (scanner) {
            scanner.clear().catch(console.error);
            setScanner(null);
        }
        setScanning(false);
    };

    return (
        <div className="qr-scanner-container">
            {!scanning ? (
                <div className="qr-scanner-start">
                    <div className="qr-icon">📷</div>
                    <h3>Scan QR Code</h3>
                    <p>Scan a QR code to quickly join a queue or view organization details</p>
                    <button onClick={startScanning} className="btn-primary">
                        Start Scanning
                    </button>
                </div>
            ) : (
                <div className="qr-scanner-active">
                    <div id="qr-reader"></div>
                    <button onClick={stopScanning} className="btn-secondary">
                        Cancel
                    </button>
                </div>
            )}
        </div>
    );
};

export default QRScanner;
