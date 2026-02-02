const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
const {
  createOrganisation,
  verifyOrganisation,
  getOrganisationByCode,
  searchOrganisations,
  getOrganisationById,
  getMyOrganisation,
  updateMyOrganisation
} = require('../controllers/organisationController');

// Get my organisation (authenticated)
router.get('/my', authenticateToken, getMyOrganisation);

// Update my organisation (authenticated)
router.put('/my', authenticateToken, updateMyOrganisation);

// Create organisation (Super Admin only)
router.post('/', authenticateToken, authorizeRoles('SUPER_ADMIN'), createOrganisation);

// Verify organisation (Super Admin only)
router.put('/:id/verify', authenticateToken, authorizeRoles('SUPER_ADMIN'), verifyOrganisation);

// Get organisation by code (authenticated - customers need this to join queues)
router.get('/code/:code', authenticateToken, getOrganisationByCode);

// Search organisations (authenticated - customers need this to find organisations)
router.get('/search', authenticateToken, searchOrganisations);
router.get('/', authenticateToken, searchOrganisations);

// Get organisation by ID or Code (authenticated)
router.get('/:id', authenticateToken, getOrganisationById);

module.exports = router;