const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const {
  getUserProfile,
  updateUserProfile,
  changePassword,
  getNotifications,
  markNotificationRead,
  getAllUsers,
  createUser,
  updateUserStatus,
  deleteUser
} = require('../controllers/userController');
const { authorizeRoles } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authenticateToken);

// User Management Routes (Admin/Staff management)
router.get('/', getAllUsers); // List users
router.post('/', authorizeRoles(['ADMIN', 'SUPER_ADMIN', 'ORGANISATION_ADMIN']), createUser); // Create user
router.put('/:id/status', authorizeRoles(['ADMIN', 'SUPER_ADMIN', 'ORGANISATION_ADMIN']), updateUserStatus); // Toggle status
router.delete('/:id', authorizeRoles(['ADMIN', 'SUPER_ADMIN', 'ORGANISATION_ADMIN']), deleteUser); // Delete user

// User profile routes
router.get('/profile', getUserProfile);
router.put('/profile', updateUserProfile);
router.post('/change-password', changePassword);

// Notification routes
router.get('/notifications', getNotifications);
router.patch('/notifications/:notificationId/read', markNotificationRead);

module.exports = router;
