const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Create a new Organisation Admin (Level 2)
// Only callable by SUPER_ADMIN (Level 1)
const createAdmin = async (req, res) => {
    try {
        const { email, password, firstName, lastName, phoneNumber } = req.body;
        const superAdminId = req.user.id; // From Auth Middleware
        const organisationId = req.user.organisationId;

        // Role check is now handled by authorizeRoles middleware

        // Check existence
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(409).json({ success: false, message: 'User (Admin) already exists' });
        }

        // 3. Get Role
        const adminRole = await prisma.roleModel.findFirst({
            where: { name: 'ORGANISATION_ADMIN' }
        });

        if (!adminRole) {
            return res.status(500).json({ success: false, message: 'Role ORGANISATION_ADMIN not found' });
        }

        // 4. Create User with Lineage
        const hashedPassword = await bcrypt.hash(password, 10);
        const newAdmin = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                firstName,
                lastName,
                phoneNumber,
                roleId: adminRole.id,
                organisationId: organisationId, // Must belong to same Org
                creatorId: superAdminId,        // LINEAGE ENFORCEMENT
                isActive: true,
                isVerified: true
            }
        });

        res.status(201).json({
            success: true,
            message: 'Admin created successfully',
            data: {
                id: newAdmin.id,
                email: newAdmin.email,
                role: 'ORGANISATION_ADMIN',
                creatorId: newAdmin.creatorId
            }
        });

    } catch (error) {
        console.error('Create Admin Error:', error);
        res.status(500).json({ success: false, message: 'Failed to create Admin' });
    }
};

const getMyAdmins = async (req, res) => {
    try {
        // Show all ORGANISATION_ADMINs to Super Admin
        const admins = await prisma.user.findMany({
            where: {
                roleModel: { name: 'ORGANISATION_ADMIN' }
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phoneNumber: true,
                isActive: true,
                createdAt: true,
                organisationId: true // Need this for filtering on frontend
            }
        });

        res.json({ success: true, data: admins });

    } catch (error) {
        console.error('Get Admins Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch admins' });
    }
};

module.exports = {
    createAdmin,
    getMyAdmins
};
