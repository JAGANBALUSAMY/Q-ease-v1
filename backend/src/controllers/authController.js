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
        isActive: true
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
        organisation: true
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

    // Simplified login for single role
    const token = generateToken({
      id: user.id,
      role: user.roleModel.name,
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
          role: user.roleModel.name,
          organisation: user.organisation
        }
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

    // Single-role design: Role selection is redundant, but if called, just re-verify primary role
    if (user.roleModel.name !== selectedRole) {
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

    // Assign role to user by updating the User model directly
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        roleId: role.id
      },
      include: {
        roleModel: true
      }
    });

    res.status(200).json({
      success: true,
      message: 'Role updated successfully',
      data: {
        userId: updatedUser.id,
        roleId: updatedUser.roleId,
        roleName: updatedUser.roleModel.name
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
        roleModel: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const roles = [{
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
        roles: roles,
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