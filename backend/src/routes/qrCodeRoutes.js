const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
const {
    generateOrganisationQR,
    generateQueueQR,
    generateTokenQR
} = require('../services/qrCodeService');

// Generate QR code for organisation (Admin only)
router.get('/organisation/:id', authenticateToken, authorizeRoles(['ORGANISATION_ADMIN', 'SUPER_ADMIN']), async (req, res) => {
    try {
        const { id } = req.params;
        const result = await generateOrganisationQR(id);

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to generate QR code'
        });
    }
});

// Generate QR code for queue (Admin/Staff only)
router.get('/queue/:id', authenticateToken, authorizeRoles(['STAFF', 'ORGANISATION_ADMIN', 'SUPER_ADMIN']), async (req, res) => {
    try {
        const { id } = req.params;
        const result = await generateQueueQR(id);

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to generate QR code'
        });
    }
});

// Generate QR code for token (authenticated)
router.get('/token/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await generateTokenQR(id);

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to generate QR code'
        });
    }
});

module.exports = router;
