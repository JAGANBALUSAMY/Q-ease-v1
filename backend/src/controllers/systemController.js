const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// In-memory storage for request logs (last 100 requests)
let requestLogs = [];
const MAX_LOGS = 100;

// In-memory storage for retry statistics
let retryStats = {
    totalRetries: 0,
    successfulRetries: 0,
    failedRetries: 0,
    byOperationType: {
        database: { attempts: 0, successes: 0, failures: 0 },
        api: { attempts: 0, successes: 0, failures: 0 },
        file: { attempts: 0, successes: 0, failures: 0 }
    }
};

// Add request log
exports.addRequestLog = (logEntry) => {
    requestLogs.unshift(logEntry);
    if (requestLogs.length > MAX_LOGS) {
        requestLogs = requestLogs.slice(0, MAX_LOGS);
    }
};

// Get request logs
exports.getRequestLogs = async (req, res) => {
    try {
        const { limit = 50, status, method } = req.query;

        let filteredLogs = [...requestLogs];

        if (status) {
            filteredLogs = filteredLogs.filter(log => {
                if (status === 'success') return log.statusCode >= 200 && log.statusCode < 400;
                if (status === 'error') return log.statusCode >= 400;
                return true;
            });
        }

        if (method) {
            filteredLogs = filteredLogs.filter(log => log.method === method);
        }

        res.json({
            success: true,
            data: {
                logs: filteredLogs.slice(0, parseInt(limit)),
                total: filteredLogs.length
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch request logs',
            error: error.message
        });
    }
};

// Get system health stats
exports.getSystemHealth = async (req, res) => {
    try {
        const totalRequests = requestLogs.length;
        const successfulRequests = requestLogs.filter(log => log.statusCode >= 200 && log.statusCode < 400).length;
        const failedRequests = requestLogs.filter(log => log.statusCode >= 400).length;

        const avgDuration = requestLogs.length > 0
            ? requestLogs.reduce((sum, log) => sum + (log.duration || 0), 0) / requestLogs.length
            : 0;

        const successRate = totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0;

        res.json({
            success: true,
            data: {
                totalRequests,
                successfulRequests,
                failedRequests,
                successRate: successRate.toFixed(2),
                avgResponseTime: Math.round(avgDuration),
                uptime: process.uptime(),
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch system health',
            error: error.message
        });
    }
};

// Get retry statistics
exports.getRetryStats = async (req, res) => {
    try {
        const totalAttempts = retryStats.totalRetries;
        const successRate = totalAttempts > 0
            ? (retryStats.successfulRetries / totalAttempts) * 100
            : 0;

        res.json({
            success: true,
            data: {
                totalRetries: retryStats.totalRetries,
                successfulRetries: retryStats.successfulRetries,
                failedRetries: retryStats.failedRetries,
                successRate: successRate.toFixed(2),
                byOperationType: retryStats.byOperationType
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch retry stats',
            error: error.message
        });
    }
};

// Update retry stats (called by retry handler)
exports.updateRetryStats = (operationType, success) => {
    retryStats.totalRetries++;

    if (success) {
        retryStats.successfulRetries++;
    } else {
        retryStats.failedRetries++;
    }

    if (retryStats.byOperationType[operationType]) {
        retryStats.byOperationType[operationType].attempts++;
        if (success) {
            retryStats.byOperationType[operationType].successes++;
        } else {
            retryStats.byOperationType[operationType].failures++;
        }
    }
};

// Get performance metrics by endpoint
exports.getPerformanceMetrics = async (req, res) => {
    try {
        const endpointStats = {};

        requestLogs.forEach(log => {
            const endpoint = log.url;
            if (!endpointStats[endpoint]) {
                endpointStats[endpoint] = {
                    count: 0,
                    totalDuration: 0,
                    errors: 0
                };
            }

            endpointStats[endpoint].count++;
            endpointStats[endpoint].totalDuration += log.duration || 0;
            if (log.statusCode >= 400) {
                endpointStats[endpoint].errors++;
            }
        });

        const metrics = Object.entries(endpointStats).map(([endpoint, stats]) => ({
            endpoint,
            requestCount: stats.count,
            avgDuration: Math.round(stats.totalDuration / stats.count),
            errorRate: ((stats.errors / stats.count) * 100).toFixed(2)
        }));

        res.json({
            success: true,
            data: metrics.sort((a, b) => b.requestCount - a.requestCount).slice(0, 10)
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch performance metrics',
            error: error.message
        });
    }
};
