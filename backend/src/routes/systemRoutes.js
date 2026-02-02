const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
const {
    getRequestLogs,
    getSystemHealth,
    getRetryStats,
    getPerformanceMetrics
} = require('../controllers/systemController');

// All system routes require ADMIN or SUPER_ADMIN role
router.use(authenticateToken);
router.use(authorizeRoles(['ORGANISATION_ADMIN', 'SUPER_ADMIN']));

// Request logs
router.get('/request-logs', getRequestLogs);

// System health
router.get('/health', getSystemHealth);

// Retry statistics
router.get('/retry-stats', getRetryStats);

// Performance metrics
router.get('/performance', getPerformanceMetrics);

module.exports = router;
