const crypto = require('crypto');
const { addRequestLog } = require('../controllers/systemController');

/**
 * Request Logger Middleware
 * Logs all incoming requests with unique IDs, duration tracking, and sanitized body
 */
const requestLogger = (req, res, next) => {
    const startTime = Date.now();
    const requestId = `req_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    // Attach request ID to request object
    req.requestId = requestId;

    // Log request details
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.url} - Request ID: ${requestId} - IP: ${req.ip}`);

    // Log sanitized body (remove sensitive fields)
    if (req.body && Object.keys(req.body).length > 0) {
        const sanitizedBody = { ...req.body };
        if (sanitizedBody.password) sanitizedBody.password = '[REDACTED]';
        if (sanitizedBody.token) sanitizedBody.token = '[REDACTED]';
        console.log(`  📝 Body:`, JSON.stringify(sanitizedBody));
    }

    // Capture response
    const originalSend = res.send;
    res.send = function (data) {
        const duration = Date.now() - startTime;
        const statusCode = res.statusCode;

        // Store log entry
        const logEntry = {
            requestId,
            timestamp,
            method: req.method,
            url: req.url,
            statusCode,
            duration,
            ip: req.ip,
            userAgent: req.get('user-agent')
        };

        addRequestLog(logEntry);

        // Log response
        if (statusCode >= 200 && statusCode < 400) {
            console.log(`✅ ${req.method} ${req.url} - ${statusCode} - ${duration}ms - Request ID: ${requestId}`);
        } else if (statusCode >= 400) {
            console.log(`❌ ${req.method} ${req.url} - ${statusCode} - ${duration}ms - Request ID: ${requestId}`);
        }

        originalSend.call(this, data);
    };

    next();
};

module.exports = requestLogger;
