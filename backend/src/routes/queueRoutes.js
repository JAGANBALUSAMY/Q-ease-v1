const express = require('express');
const router = express.Router();
const {
  authenticateToken,
  authorizeRoles,
  checkOrganisationAccess,
  checkQueueAccess
} = require('../middleware/authMiddleware');
const {
  getAllQueues,
  getQueueById,
  createQueue,
  updateQueue,
  deleteQueue,
  pauseQueue,
  resumeQueue,
  getPublicQueues,
  getPublicQueueById
} = require('../controllers/queueController');
const { callNextToken } = require('../controllers/tokenController');

// Routes are prefixed with /api/queues

// Public queues (no auth required)
router.get('/public', getPublicQueues);
router.get('/public/:id', getPublicQueueById);

// Get all queues (scoped to user's organisation)
router.get('/', authenticateToken, getAllQueues);

// Create queue (Organisation Admin/Super Admin)
router.post('/', authenticateToken, authorizeRoles(['ORGANISATION_ADMIN', 'SUPER_ADMIN']), createQueue);

// Get specific queue
router.get('/:id', authenticateToken, checkQueueAccess, getQueueById);

// Update queue
router.put('/:id', authenticateToken, checkQueueAccess, authorizeRoles(['ORGANISATION_ADMIN', 'SUPER_ADMIN']), updateQueue);

// Delete queue
router.delete('/:id', authenticateToken, checkQueueAccess, authorizeRoles(['ORGANISATION_ADMIN', 'SUPER_ADMIN']), deleteQueue);

// Pause/Resume (Staff can also do this)
router.put('/:id/pause', authenticateToken, checkQueueAccess, authorizeRoles(['ORGANISATION_ADMIN', 'SUPER_ADMIN', 'STAFF']), pauseQueue);
router.put('/:id/resume', authenticateToken, checkQueueAccess, authorizeRoles(['ORGANISATION_ADMIN', 'SUPER_ADMIN', 'STAFF']), resumeQueue);

// Call next token (Staff/Admin)
router.post('/:queueId/call-next', authenticateToken, authorizeRoles(['STAFF', 'ORGANISATION_ADMIN', 'SUPER_ADMIN']), callNextToken);

module.exports = router;