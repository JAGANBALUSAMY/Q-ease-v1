const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');
const { getUserNotifications, markNotificationAsRead } = require('../services/notificationService');

/**
 * User Controller
 * Handles user profile and notification management
 */

// Get user profile
const getUserProfile = async (req, res) => {
  try {
    const user = await prisma.user.findFirst({
      where: { id: req.user.id }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email || '',
          phone: user.phoneNumber || ''
        }
      }
    });
  } catch (err) {
    console.error('PROFILE ERROR:', err);
    res.status(500).json({ message: 'Profile failed' });
  }
};

// Update user profile
const updateUserProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { firstName, lastName, phoneNumber } = req.body;

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                ...(firstName && { firstName }),
                ...(lastName && { lastName }),
                ...(phoneNumber && { phoneNumber })
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phoneNumber: true
            }
        });

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: { user: updatedUser }
        });
    } catch (error) {
        console.error('Update user profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update profile'
        });
    }
};

// Change password
const changePassword = async (req, res) => {
    try {
        const userId = req.user.id;
        const { currentPassword, newPassword } = req.body;

        // Get user with password
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Verify current password
        const isValidPassword = await bcrypt.compare(currentPassword, user.password);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword }
        });

        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to change password'
        });
    }
};

// Get user notifications
const getNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const { limit = 50 } = req.query;

        const notifications = await getUserNotifications(userId, parseInt(limit));

        res.json({
            success: true,
            data: { notifications }
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get notifications'
        });
    }
};

// Mark notification as read
const markNotificationRead = async (req, res) => {
    try {
        const { notificationId } = req.params;

        await markNotificationAsRead(notificationId);

        res.json({
            success: true,
            message: 'Notification marked as read'
        });
    } catch (error) {
        console.error('Mark notification read error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark notification as read'
        });
    }
};



// Get all users (filtered by organization for non-super admins)
async function getAllUsers(req, res) {
    try {
        const { organisationId } = req.user;
        const isAdmin = req.user.role === 'ADMIN' || req.user.role === 'ORGANISATION_ADMIN';
        const isSuperAdmin = req.user.role === 'SUPER_ADMIN';

        let where = {};

        // If admin/org_admin, can only see their own organization's users
        if (isAdmin) {
            where.organisationId = organisationId;
        }
        // If super admin, can see all (or filter by query param)
        // For now, if super admin calls without valid search, fetch all.

        const users = await prisma.user.findMany({
            where,
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phoneNumber: true,
                // role: true, // REMOVED: Not in schema
                organisationId: true,
                isVerified: true,
                isActive: true,
                createdAt: true,
                roleModel: {
                    select: {
                        name: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Map roleModel.name to role for frontend compatibility if needed
        const usersWithRole = users.map(user => ({
            ...user,
            role: user.roleModel?.name
        }));

        res.json({
            success: true,
            data: { users: usersWithRole }
        });
    } catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch users'
        });
    }
}

// Create new user
async function createUser(req, res) {
    console.log('--- createUser called ---');
    console.log('Request Body:', req.body);
    console.log('User Context:', req.user);

    try {
        const { firstName, lastName, email, role, password } = req.body;
        const creatorOrgId = req.user.organisationId;
        const isCreatorSuperAdmin = req.user.role === 'SUPER_ADMIN';

        // Basic validation
        if (!firstName || !lastName || !email || !password || !role) {
            console.log('Validation failed: Missing fields');
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            console.log('User already exists:', email);
            return res.status(409).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        // Determine Role ID and Name
        // MAPPING: Frontend sends 'ADMIN' -> Backend needs 'ORGANISATION_ADMIN' or keep 'ADMIN' if valid?
        // Checking seed.js: 'ORGANISATION_ADMIN', 'STAFF', 'USER', 'SUPER_ADMIN'
        // If frontend sends 'ADMIN', we map to 'ORGANISATION_ADMIN'.
        // If frontend sends 'STAFF', we map to 'STAFF'.

        // Determine Role ID and Name
        let roleName = role.toUpperCase(); // Force uppercase to match seed data 'STAFF', 'USER'
        if (roleName === 'ADMIN') roleName = 'ORGANISATION_ADMIN';

        console.log('Looking up role:', roleName);
        const roleRecord = await prisma.roleModel.findFirst({
            where: {
                name: {
                    equals: roleName,
                    mode: 'insensitive' // Case insensitive fallback
                }
            }
        });

        if (!roleRecord) {
            console.log('Role not found:', roleName);
            // Fallback: Try finding case-insensitive or list all roles to debug
            const allRoles = await prisma.roleModel.findMany();
            console.log('Available roles:', allRoles.map(r => r.name));

            return res.status(400).json({
                success: false,
                message: 'Invalid role specified'
            });
        }
        console.log('Role found:', roleRecord.id);

        // Determine Organisation ID
        // If super admin creates, they SHOULD specify orgId, or if creating another super admin? 
        // Typically Super Admin creates Org Admins.
        // For now, assuming current scope is: Org Admin creating Staff.
        // If Super Admin is creating a user, we might need logic for them to select Org.
        // But the simplified requirement is managing staff.

        // If creator is NOT super admin, new user MUST belong to same org
        let targetOrgId = creatorOrgId;
        if (!targetOrgId && !isCreatorSuperAdmin) {
            console.log('Error: No Organisation ID for non-super-admin creator');
            // This might be the issue if the creator doesn't have orgId in token
        }

        console.log('Creating user with Org ID:', targetOrgId);

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: {
                firstName,
                lastName,
                email,
                password: hashedPassword,
                roleId: roleRecord.id,
                organisationId: targetOrgId,
                isVerified: true,
                isActive: true,
                creatorId: req.user.id
            },
            select: {
                id: true,
                email: true,
                // role: true, // REMOVED
                firstName: true,
                lastName: true,
                isActive: true,
                roleModel: { // Added to return role name
                    select: {
                        name: true
                    }
                }
            }
        });

        res.status(201).json({
            success: true,
            data: {
                user: {
                    ...newUser,
                    role: newUser.roleModel?.name
                }
            },
            message: 'User created successfully'
        });

    } catch (error) {
        console.error('Create user error details:', error); // detailed log
        res.status(500).json({
            success: false,
            message: 'Failed to create user',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}

// Update User Status
async function updateUserStatus(req, res) {
    try {
        const { id } = req.params;
        const { isActive } = req.body;

        await prisma.user.update({
            where: { id },
            data: { isActive },
            select: { id: true, isActive: true }
        });

        res.json({
            success: true,
            message: `User ${isActive ? 'activated' : 'deactivated'} successfully`
        });
    } catch (error) {
        console.error('Update user status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update user status'
        });
    }
}

// Delete User
async function deleteUser(req, res) {
    try {
        const { id } = req.params;

        // Prevent deleting self?
        if (req.user.id === id) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete yourself'
            });
        }

        await prisma.user.delete({
            where: { id }
        });

        res.json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete user'
        });
    }
}

module.exports = {
    getUserProfile,
    updateUserProfile,
    changePassword,
    getNotifications,
    markNotificationRead,
    getAllUsers,
    createUser,
    updateUserStatus,
    deleteUser
};
