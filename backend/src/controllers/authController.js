const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { generateToken } = require('../utils/jwtUtils');

const prisma = new PrismaClient();

const registerUser = async (req, res) => {
  try {
    const { email, password, firstName, lastName, phoneNumber } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    // Get USER role
    const userRole = await prisma.roleModel.findFirst({
      where: { name: 'USER' }
    });

    if (!userRole) {
      return res.status(500).json({
        success: false,
        message: 'User role not found. Please contact administrator.'
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phoneNumber,
        roleId: userRole.id,
        isVerified: false,
        isActive: true,
        userRoles: {
          create: {
            roleId: userRole.id
          }
        }
      },
      include: {
        roleModel: true
      }
    });

    // Generate token
    const token = generateToken({
      id: user.id,
      role: user.roleModel.name,
      organisationId: null
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.roleModel.name
        }
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        roleModel: true,
        organisation: true,
        userRoles: {
          include: {
            role: true
          }
        }
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Get all roles for this user (from UserRole junction table)
    const userRoles = user.userRoles && user.userRoles.length > 0 
      ? user.userRoles.map(ur => ur.role.name)
      : [user.roleModel.name]; // Fallback to primary role

    // If user has only one role, login directly
    if (userRoles.length === 1) {
      const token = generateToken({
        id: user.id,
        role: userRoles[0],
        organisationId: user.organisationId
      });

      return res.json({
        success: true,
        message: 'Login successful',
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: userRoles[0],
            organisation: user.organisation
          }
        }
      });
    }

    // If user has multiple roles, return available roles for selection
    res.json({
      success: true,
      message: 'Multiple roles available. Please select one.',
      data: {
        userId: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        availableRoles: userRoles,
        requiresRoleSelection: true
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
};

// Similar updates for staffLogin, adminLogin, and superAdminLogin...

const staffLogin = async (req, res) => {
  try {
    const { employeeId, password } = req.body;

    // Find staff user by email (assuming employeeId is stored as email for now)
    const user = await prisma.user.findFirst({
      where: {
        email: employeeId,
        roleModel: {
          name: 'STAFF'
        }
      },
      include: {
        roleModel: true,
        organisation: true
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid employee credentials'
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      role: user.roleModel.name,
      organisationId: user.organisationId
    });

    res.json({
      success: true,
      message: 'Staff login successful',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.roleModel.name,
          organisation: user.organisation
        }
      }
    });
  } catch (error) {
    console.error('Staff login error:', error);
    res.status(500).json({
      success: false,
      message: 'Staff login failed'
    });
  }
};

const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find admin user
    const user = await prisma.user.findFirst({
      where: {
        email,
        roleModel: {
          name: 'ORGANISATION_ADMIN'
        }
      },
      include: {
        roleModel: true,
        organisation: true
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin credentials'
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      role: user.roleModel.name,
      organisationId: user.organisationId
    });

    res.json({
      success: true,
      message: 'Admin login successful',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.roleModel.name,
          organisation: user.organisation
        }
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Admin login failed'
    });
  }
};

const superAdminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find super admin user
    const user = await prisma.user.findFirst({
      where: {
        email,
        roleModel: {
          name: 'SUPER_ADMIN'
        }
      },
      include: {
        roleModel: true,
        organisation: true
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid super admin credentials'
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      role: user.roleModel.name,
      organisationId: user.organisationId
    });

    res.json({
      success: true,
      message: 'Super Admin login successful',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.roleModel.name,
          organisation: user.organisation
        }
      }
    });
  } catch (error) {
    console.error('Super Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Super Admin login failed'
    });
  }
};

const selectRole = async (req, res) => {
  try {
    const { userId, selectedRole } = req.body;

    if (!userId || !selectedRole) {
      return res.status(400).json({
        success: false,
        message: 'userId and selectedRole are required'
      });
    }

    // Find user and verify the selected role is available
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        roleModel: true,
        organisation: true,
        userRoles: {
          include: {
            role: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get all available roles for this user
    const userRoles = user.userRoles && user.userRoles.length > 0 
      ? user.userRoles.map(ur => ur.role.name)
      : [user.roleModel.name];

    // Verify the selected role is available for this user
    if (!userRoles.includes(selectedRole)) {
      return res.status(403).json({
        success: false,
        message: 'Selected role is not available for this user'
      });
    }

    // Generate JWT token with the selected role
    const token = generateToken({
      id: user.id,
      role: selectedRole,
      organisationId: user.organisationId
    });

    res.json({
      success: true,
      message: 'Role selected successfully',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: selectedRole,
          organisation: user.organisation
        }
      }
    });
  } catch (error) {
    console.error('Role selection error:', error);
    res.status(500).json({
      success: false,
      message: 'Role selection failed'
    });
  }
};

const assignRoleToUser = async (req, res) => {
  try {
    const { userId, roleId } = req.body;

    if (!userId || !roleId) {
      return res.status(400).json({
        success: false,
        message: 'userId and roleId are required'
      });
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify role exists
    const role = await prisma.roleModel.findUnique({
      where: { id: roleId }
    });

    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    // Check if user already has this role
    const existingUserRole = await prisma.userRole.findUnique({
      where: {
        userId_roleId: {
          userId,
          roleId
        }
      }
    });

    if (existingUserRole) {
      return res.status(400).json({
        success: false,
        message: 'User already has this role'
      });
    }

    // Assign role to user
    const userRole = await prisma.userRole.create({
      data: {
        userId,
        roleId
      },
      include: {
        role: true,
        user: {
          include: {
            userRoles: {
              include: {
                role: true
              }
            }
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Role assigned to user successfully',
      data: {
        userRole: {
          userId: userRole.userId,
          roleId: userRole.roleId,
          roleName: userRole.role.name
        },
        userRoles: userRole.user.userRoles.map(ur => ur.role.name)
      }
    });
  } catch (error) {
    console.error('Assign role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign role'
    });
  }
};

const removeRoleFromUser = async (req, res) => {
  try {
    const { userId, roleId } = req.body;

    if (!userId || !roleId) {
      return res.status(400).json({
        success: false,
        message: 'userId and roleId are required'
      });
    }

    // Check if user has this role
    const userRole = await prisma.userRole.findUnique({
      where: {
        userId_roleId: {
          userId,
          roleId
        }
      }
    });

    if (!userRole) {
      return res.status(404).json({
        success: false,
        message: 'User does not have this role'
      });
    }

    // Remove role from user
    await prisma.userRole.delete({
      where: {
        userId_roleId: {
          userId,
          roleId
        }
      }
    });

    res.json({
      success: true,
      message: 'Role removed from user successfully'
    });
  } catch (error) {
    console.error('Remove role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove role'
    });
  }
};

const getUserRoles = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        roleModel: true,
        userRoles: {
          include: {
            role: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userRoles = user.userRoles && user.userRoles.length > 0 
      ? user.userRoles.map(ur => ({
          id: ur.role.id,
          name: ur.role.name,
          description: ur.role.description
        }))
      : [{
          id: user.roleModel.id,
          name: user.roleModel.name,
          description: user.roleModel.description
        }];

    res.json({
      success: true,
      data: {
        userId: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: userRoles,
        primaryRole: user.roleModel.name
      }
    });
  } catch (error) {
    console.error('Get user roles error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user roles'
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  staffLogin,
  adminLogin,
  superAdminLogin,
  selectRole,
  assignRoleToUser,
  removeRoleFromUser,
  getUserRoles
};