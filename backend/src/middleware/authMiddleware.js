const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Authenticate JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided. Please login.'
      });
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Attach user info to request. Support multiple claim names from tokens
      req.user = {
        id: decoded.id || decoded.userId || decoded.user_id,
        role: decoded.role || decoded.roleId || decoded.role_id,
        organisationId: decoded.organisationId || decoded.organisation_id || decoded.organisationId
      };

      next();
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expired. Please login again.'
        });
      }

      return res.status(401).json({
        success: false,
        message: 'Invalid token. Please login again.'
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

// Authorize specific roles
const authorizeRoles = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    // Case-insensitive role comparison
    const allowedNormalized = allowedRoles.map(r => String(r).toUpperCase());
    const userRole = String(req.user.role || '').toUpperCase();

    if (!allowedNormalized.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this resource',
        requiredRoles: allowedRoles,
        yourRole: req.user.role
      });
    }

    next();
  };
};

// Check if user has access to organization
const checkOrganisationAccess = async (req, res, next) => {
  try {
    const { organisationId } = req.params;
    const userOrgId = req.user.organisationId;

    // Super admin can access all organizations
    if (String(req.user.role || '').toUpperCase() === 'SUPER_ADMIN') {
      return next();
    }

    // Check if user belongs to the organization
    if (userOrgId !== organisationId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this organization'
      });
    }

    next();
  } catch (error) {
    console.error('Organisation access check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Access check failed'
    });
  }
};

// Check if user has access to queue
const checkQueueAccess = async (req, res, next) => {
  try {
    const { queueId } = req.params;

    const queue = await prisma.queue.findUnique({
      where: { id: queueId },
      select: { organisationId: true }
    });

    if (!queue) {
      return res.status(404).json({
        success: false,
        message: 'Queue not found'
      });
    }

    // Super admin can access all queues
    if (String(req.user.role || '').toUpperCase() === 'SUPER_ADMIN') {
      return next();
    }

    // Regular users can join any queue
    if (String(req.user.role || '').toUpperCase() === 'USER') {
      return next();
    }

    // Staff and admins must belong to the organization
    if (req.user.organisationId !== queue.organisationId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this queue'
      });
    }

    next();
  } catch (error) {
    console.error('Queue access check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Access check failed'
    });
  }
};

// Optional authentication (for public + private routes)
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // No token, continue without user
    return next();
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: decoded.id || decoded.userId || decoded.user_id,
      role: decoded.role || decoded.roleId || decoded.role_id,
      organisationId: decoded.organisationId || decoded.organisation_id || decoded.organisationId
    };
  } catch (error) {
    // Invalid token, but don't block request
    console.log('Optional auth: Invalid token, continuing without user');
  }

  next();
};

module.exports = {
  authenticateToken,
  authorizeRoles,
  checkOrganisationAccess,
  checkQueueAccess,
  optionalAuth,
  // Legacy export for backward compatibility
  protect: authenticateToken
};