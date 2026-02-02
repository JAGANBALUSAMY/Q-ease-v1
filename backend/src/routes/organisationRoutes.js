const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
const {
  createOrganisation,
  verifyOrganisation,
  getOrganisationByCode,
  searchOrganisations,
  getOrganisationById
} = require('../controllers/organisationController');

// Create organisation (Super Admin only)
router.post('/', authenticateToken, authorizeRoles('SUPER_ADMIN'), createOrganisation);

// Verify organisation (Super Admin only)
router.put('/:id/verify', authenticateToken, authorizeRoles('SUPER_ADMIN'), verifyOrganisation);

// Get organisation by code
router.get('/code/:code', getOrganisationByCode);

// Search organisations
router.get('/search', searchOrganisations);
router.get('/', searchOrganisations);

// Get organisation by ID or Code
router.get('/:id', getOrganisationById);

module.exports = router;