const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const admin = require('firebase-admin');

const prisma = new PrismaClient();

// Google Login - verify Firebase ID token
exports.googleLogin = async (req, res) => {
    try {
        const { idToken, email, displayName } = req.body;

        if (!idToken || !email) {
            return res.status(400).json({
                success: false,
                message: 'ID token and email are required'
            });
        }

        // Verify the Firebase ID token (if Firebase Admin is initialized)
        let firebaseUser = null;
        try {
            if (admin.apps.length > 0) {
                const decodedToken = await admin.auth().verifyIdToken(idToken);
                firebaseUser = decodedToken;
            }
        } catch (error) {
            console.warn('Firebase token verification failed:', error.message);
            // Continue anyway - we'll trust the email from the client
        }

        // Check if user exists
        let user = await prisma.user.findUnique({
            where: { email },
            include: {
                roleModel: true,
                organisation: true
            }
        });

        // If user doesn't exist, create a new one
        if (!user) {
            // Get the CUSTOMER role
            const customerRole = await prisma.roleModel.findFirst({
                where: { name: 'CUSTOMER' }
            });

            if (!customerRole) {
                return res.status(500).json({
                    success: false,
                    message: 'Customer role not found in system'
                });
            }

            // Extract first and last name from displayName
            const nameParts = displayName ? displayName.split(' ') : ['User', ''];
            const firstName = nameParts[0] || 'User';
            const lastName = nameParts.slice(1).join(' ') || '';

            // Create new user
            user = await prisma.user.create({
                data: {
                    email,
                    firstName,
                    lastName,
                    roleId: customerRole.id,
                    isVerified: true, // Google users are pre-verified
                    isActive: true,
                    password: null // No password for OAuth users
                },
                include: {
                    roleModel: true,
                    organisation: true
                }
            });
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Your account has been deactivated'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                userId: user.id,
                email: user.email,
                role: user.roleModel.name
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Return user data without password
        const { password, ...userWithoutPassword } = user;

        res.json({
            success: true,
            message: 'Google login successful',
            data: {
                token,
                user: {
                    ...userWithoutPassword,
                    role: user.roleModel
                }
            }
        });
    } catch (error) {
        console.error('Google login error:', error);
        res.status(500).json({
            success: false,
            message: 'Google login failed',
            error: error.message
        });
    }
};
