const express = require('express');
const router = express.Router();
const { registerUser, loginUser, staffLogin, adminLogin, superAdminLogin } = require('../controllers/authController');
const { googleLogin } = require('../controllers/googleAuthController');
const { validateRegister, validateLogin, validateStaffLogin } = require('../middleware/validationMiddleware');

// Register a new user
router.post('/register', validateRegister, registerUser);

// Login user (general login - fetches roles from database)
router.post('/login', validateLogin, loginUser);

// Google login
router.post('/google-login', googleLogin);

// Select role when multiple roles are available
router.post('/select-role', selectRole);

// Get user roles
router.get('/user-roles/:userId', getUserRoles);

// Assign a role to a user (admin/super-admin only)
router.post('/assign-role', assignRoleToUser);

// Remove a role from a user (admin/super-admin only)
router.post('/remove-role', removeRoleFromUser);

// Staff login (legacy - can still be used)
router.post('/staff-login', validateStaffLogin, staffLogin);

// Admin login (legacy - can still be used)
router.post('/admin-login', validateLogin, adminLogin);

// Super Admin login (legacy - can still be used)
router.post('/super-admin-login', validateLogin, superAdminLogin);

module.exports = router;