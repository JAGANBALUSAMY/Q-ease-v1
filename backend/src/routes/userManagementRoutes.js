const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
const {
    toggleUserStatus,
    updateUserProfile,
    requestPasswordReset,
    resetPassword,
    changePassword,
    getUserAuditLogs
} = require('../controllers/userManagementController');

// Activate/Deactivate User (Admin only)
router.patch('/:userId/status',
    authenticateToken,
    authorizeRoles(['ORGANISATION_ADMIN', 'SUPER_ADMIN']),
    toggleUserStatus
);

// Update User Profile
router.patch('/:userId/profile',
    authenticateToken,
    updateUserProfile
);

// Password Management
router.post('/password/reset-request', requestPasswordReset);
router.post('/password/reset', authenticateToken, resetPassword);
router.post('/password/change', authenticateToken, changePassword);

// Audit Logs
router.get('/:userId/audit-logs',
    authenticateToken,
    getUserAuditLogs
);

module.exports = router;
