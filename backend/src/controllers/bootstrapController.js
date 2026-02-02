const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

exports.bootstrapSuperAdmin = async (req, res) => {
    try {
        // Check if any super admin already exists
        const existingSuperAdmin = await prisma.user.findFirst({
            where: {
                roleModel: {
                    name: 'SUPER_ADMIN'
                }
            }
        });

        if (existingSuperAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Bootstrap disabled: Super admin already exists. Use the regular create-tenant endpoint with authentication.'
            });
        }

        const { orgName, orgCode, firstName, lastName, email, password, phoneNumber } = req.body;

        // Validation
        if (!orgName || !orgCode || !firstName || !lastName || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Validate org code format (6 alphanumeric characters)
        if (!/^[A-Za-z0-9]{6}$/.test(orgCode)) {
            return res.status(400).json({
                success: false,
                message: 'Organization code must be exactly 6 alphanumeric characters'
            });
        }

        // Validate phone number if provided (must be 10 digits)
        if (phoneNumber && !/^\d{10}$/.test(phoneNumber)) {
            return res.status(400).json({
                success: false,
                message: 'Phone number must be exactly 10 digits'
            });
        }

        // Check if organization code already exists
        const existingOrg = await prisma.organisation.findUnique({
            where: { code: orgCode.toUpperCase() }
        });

        if (existingOrg) {
            return res.status(400).json({
                success: false,
                message: 'Organization code already exists'
            });
        }

        // Check if email already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered'
            });
        }

        // Get SUPER_ADMIN role
        const superAdminRole = await prisma.roleModel.findUnique({
            where: { name: 'SUPER_ADMIN' }
        });

        if (!superAdminRole) {
            return res.status(500).json({
                success: false,
                message: 'SUPER_ADMIN role not found in database. Please run migrations.'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create organization and super admin in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // Create organization
            const organisation = await tx.organisation.create({
                data: {
                    name: orgName,
                    code: orgCode.toUpperCase(),
                    isActive: true
                }
            });

            // Create super admin user
            const user = await tx.user.create({
                data: {
                    firstName,
                    lastName,
                    email,
                    password: hashedPassword,
                    phoneNumber: phoneNumber || null,
                    roleId: superAdminRole.id,
                    organisationId: organisation.id,
                    isActive: true
                },
                include: {
                    roleModel: true,
                    organisation: true
                }
            });

            return { organisation, user };
        });

        // Remove password from response
        const { password: _, ...userWithoutPassword } = result.user;

        console.log(`✅ Bootstrap: Created first super admin - ${email}`);

        res.status(201).json({
            success: true,
            message: 'Bootstrap successful! First super admin created. This endpoint is now disabled.',
            data: {
                organisation: result.organisation,
                user: userWithoutPassword
            }
        });

    } catch (error) {
        console.error('Bootstrap super admin error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create super admin',
            error: error.message
        });
    }
};
