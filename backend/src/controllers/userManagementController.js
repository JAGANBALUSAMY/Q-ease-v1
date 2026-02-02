const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

/**
 * User Management Controller
 * Handles user lifecycle operations
 */

// Activate/Deactivate User
const toggleUserStatus = async (req, res) => {
    try {
        const { userId } = req.params;
        const { isActive } = req.body;

        // Authorization check
        if (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'ORGANISATION_ADMIN') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to manage users'
            });
        }

        const user = await prisma.user.update({
            where: { id: userId },
            data: { isActive },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                isActive: true,
                roleModel: { select: { name: true } }
            }
        });

        // Log the action
        await logUserAction({
            userId: req.user.id,
            action: isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
            targetUserId: userId,
            metadata: { isActive }
        });

        res.json({
            success: true,
            message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
            data: { user }
        });
    } catch (error) {
        console.error('Toggle user status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update user status'
        });
    }
};

// Update User Profile
const updateUserProfile = async (req, res) => {
    try {
        const { userId } = req.params;
        const { firstName, lastName, phoneNumber } = req.body;

        // Users can only update their own profile unless admin
        if (req.user.id !== userId && req.user.role !== 'ORGANISATION_ADMIN' && req.user.role !== 'SUPER_ADMIN') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this profile'
            });
        }

        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                firstName,
                lastName,
                phoneNumber
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phoneNumber: true,
                roleModel: { select: { name: true } }
            }
        });

        await logUserAction({
            userId: req.user.id,
            action: 'PROFILE_UPDATED',
            targetUserId: userId,
            metadata: { firstName, lastName, phoneNumber }
        });

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: { user }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update profile'
        });
    }
};

// Request Password Reset
const requestPasswordReset = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            // Don't reveal if user exists
            return res.json({
                success: true,
                message: 'If the email exists, a reset link will be sent'
            });
        }

        // Generate reset token (valid for 1 hour)
        const resetToken = require('crypto').randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

        // Store reset token (you'll need to add these fields to User model)
        // For now, we'll log it
        console.log(`Password reset token for ${email}: ${resetToken}`);
        console.log(`Reset link: http://localhost:5173/reset-password?token=${resetToken}`);

        await logUserAction({
            userId: user.id,
            action: 'PASSWORD_RESET_REQUESTED',
            targetUserId: user.id,
            metadata: { email }
        });

        res.json({
            success: true,
            message: 'If the email exists, a reset link will be sent'
        });
    } catch (error) {
        console.error('Password reset request error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process password reset request'
        });
    }
};

// Reset Password
const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        // In production, verify token from database
        // For now, we'll allow password reset for authenticated users
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: req.user.id },
            data: { password: hashedPassword }
        });

        await logUserAction({
            userId: req.user.id,
            action: 'PASSWORD_RESET_COMPLETED',
            targetUserId: req.user.id,
            metadata: {}
        });

        res.json({
            success: true,
            message: 'Password reset successfully'
        });
    } catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reset password'
        });
    }
};

// Change Password (for logged-in users)
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        const user = await prisma.user.findUnique({
            where: { id: req.user.id }
        });

        // Verify current password
        const isValidPassword = await bcrypt.compare(currentPassword, user.password);
        if (!isValidPassword) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: req.user.id },
            data: { password: hashedPassword }
        });

        await logUserAction({
            userId: req.user.id,
            action: 'PASSWORD_CHANGED',
            targetUserId: req.user.id,
            metadata: {}
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

// Get User Audit Logs
const getUserAuditLogs = async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 50, offset = 0 } = req.query;

        // Only admins or the user themselves can view audit logs
        if (req.user.id !== userId && req.user.role !== 'ORGANISATION_ADMIN' && req.user.role !== 'SUPER_ADMIN') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view audit logs'
            });
        }

        const logs = await prisma.userAuditLog.findMany({
            where: {
                OR: [
                    { userId },
                    { targetUserId: userId }
                ]
            },
            orderBy: { createdAt: 'desc' },
            take: parseInt(limit),
            skip: parseInt(offset),
            include: {
                user: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                }
            }
        });

        const total = await prisma.userAuditLog.count({
            where: {
                OR: [
                    { userId },
                    { targetUserId: userId }
                ]
            }
        });

        res.json({
            success: true,
            data: {
                logs,
                pagination: {
                    total,
                    limit: parseInt(limit),
                    offset: parseInt(offset)
                }
            }
        });
    } catch (error) {
        console.error('Get audit logs error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve audit logs'
        });
    }
};

// Helper function to log user actions
async function logUserAction({ userId, action, targetUserId, metadata }) {
    try {
        await prisma.userAuditLog.create({
            data: {
                userId,
                action,
                targetUserId,
                metadata,
                ipAddress: null, // Can be added from req.ip
                userAgent: null  // Can be added from req.headers['user-agent']
            }
        });
    } catch (error) {
        console.error('Failed to log user action:', error);
    }
}

module.exports = {
    toggleUserStatus,
    updateUserProfile,
    requestPasswordReset,
    resetPassword,
    changePassword,
    getUserAuditLogs
};
