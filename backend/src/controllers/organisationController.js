const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get current user's organisation
const getMyOrganisation = async (req, res) => {
  try {
    const userId = req.user.id; // Use id from JWT payload

    // Get user's organisation through their association
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        organisation: true,
        roleModel: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user has a role and if it's SUPER_ADMIN
    const isSuperAdmin = user.roleModel && user.roleModel.name === 'SUPER_ADMIN';

    // If user is super admin, return all organisations
    if (isSuperAdmin) {
      const organisations = await prisma.organisation.findMany({
        where: {
          isActive: true
        },
        select: {
          id: true,
          code: true,
          name: true,
          description: true,
          address: true,
          city: true,
          state: true,
          country: true,
          contactEmail: true,
          contactPhone: true,
          isVerified: true,
          isActive: true,
          createdAt: true,
          updatedAt: true
        }
      });

      return res.status(200).json({
        success: true,
        data: {
          organisations: organisations,
          isSuperAdmin: true
        }
      });
    }

    if (!user.organisation) {
      return res.status(404).json({
        success: false,
        message: 'Organisation not found for this user'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        organisation: user.organisation
      }
    });
  } catch (error) {
    console.error('Get my organisation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update current user's organisation
const updateMyOrganisation = async (req, res) => {
  try {
    const userId = req.user.id; // Use id from JWT payload
    const updateData = req.body;

    // Get user's current organisation
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        organisation: true,
        roleModel: true
      }
    });

    // Super admins can update any organisation
    if (user.roleModel.name === 'SUPER_ADMIN') {
      const { organisationId } = req.body;
      if (!organisationId) {
        return res.status(400).json({
          success: false,
          message: 'Organisation ID required for super admin'
        });
      }

      const updatedOrganisation = await prisma.organisation.update({
        where: { id: organisationId },
        data: updateData
      });

      return res.status(200).json({
        success: true,
        message: 'Organisation updated successfully',
        data: {
          organisation: updatedOrganisation
        }
      });
    }

    if (!user || !user.organisation) {
      return res.status(404).json({
        success: false,
        message: 'Organisation not found for this user'
      });
    }

    // Update organisation
    const updatedOrganisation = await prisma.organisation.update({
      where: { id: user.organisation.id },
      data: updateData
    });

    res.status(200).json({
      success: true,
      message: 'Organisation updated successfully',
      data: {
        organisation: updatedOrganisation
      }
    });
  } catch (error) {
    console.error('Update my organisation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get all organisations
const getAllOrganisations = async (req, res) => {
  try {
    const organisations = await prisma.organisation.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        address: true,
        city: true,
        state: true,
        country: true,
        contactEmail: true,
        contactPhone: true,
        isVerified: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.status(200).json({
      success: true,
      data: {
        organisations: organisations
      }
    });
  } catch (error) {
    console.error('Get all organisations error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get organisation by ID
// Get organisation by ID or Code
const getOrganisationById = async (req, res) => {
  try {
    const { id } = req.params;

    const organisation = await prisma.organisation.findFirst({
      where: {
        isActive: true,
        OR: [
          { id: id },
          { code: { equals: id, mode: 'insensitive' } }
        ]
      },
      include: {
        queues: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
          id: true,
          name: true,
          description: true,
          averageTime: true,
          isActive: true, // Note: status is not a field, assuming isActive maps to logic
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              tokens: {
                where: { status: 'PENDING' }
              }
            }
          }, // We can use this to map to waitingCount in the transform
          tokens: {
            where: { status: 'CALLED' },
            take: 1,
            select: {
              tokenId: true
            }
          }
        }
      }
    });

    if (!organisation) {
      return res.status(404).json({
        success: false,
        message: 'Organisation not found'
      });
    }

    // Transform queues to match frontend expectation
    const transformedQueues = organisation.queues.map(queue => ({
      ...queue,
      waitingCount: queue._count?.tokens || 0,
      currentServing: queue.tokens?.[0]?.tokenId || null,
      status: queue.isActive ? 'ACTIVE' : 'PAUSED',
      _count: undefined,
      tokens: undefined
    }));

    const responseOrg = {
      ...organisation,
      queues: transformedQueues
    };

    res.status(200).json({
      success: true,
      data: {
        organisation: responseOrg
      }
    });
  } catch (error) {
    console.error('Get organisation by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Create organisation
const createOrganisation = async (req, res) => {
  try {
    const {
      code,
      name,
      description,
      address,
      city,
      state,
      country,
      contactEmail,
      contactPhone
    } = req.body;

    // Check if organisation code already exists
    const existingOrg = await prisma.organisation.findUnique({
      where: { code: code }
    });

    if (existingOrg) {
      return res.status(400).json({
        success: false,
        message: 'Organisation code already exists'
      });
    }

    const organisation = await prisma.organisation.create({
      data: {
        code,
        name,
        description,
        address,
        city,
        state,
        country,
        contactEmail,
        contactPhone,
        isVerified: false,
        isActive: true
      }
    });

    res.status(201).json({
      success: true,
      message: 'Organisation created successfully',
      data: {
        organisation: organisation
      }
    });
  } catch (error) {
    console.error('Create organisation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Verify organisation (Super Admin only)
const verifyOrganisation = async (req, res) => {
  try {
    const { id } = req.params;

    const organisation = await prisma.organisation.update({
      where: { id: id },
      data: {
        isVerified: true,
        verifiedAt: new Date()
      }
    });

    res.status(200).json({
      success: true,
      message: 'Organisation verified successfully',
      data: {
        organisation: organisation
      }
    });
  } catch (error) {
    console.error('Verify organisation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get organisation by code
const getOrganisationByCode = async (req, res) => {
  try {
    const { code } = req.params;

    const organisation = await prisma.organisation.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        queues: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            description: true,
            averageTime: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
            _count: {
              select: {
                tokens: {
                  where: { status: 'PENDING' }
                }
              }
            },
            tokens: {
              where: { status: 'CALLED' },
              take: 1,
              select: {
                tokenId: true
              }
            }
          }
        }
      }
    });

    if (!organisation) {
      return res.status(404).json({
        success: false,
        message: 'Organisation not found'
      });
    }

    // Transform queues to match frontend expectation
    const transformedQueues = organisation.queues.map(queue => ({
      ...queue,
      waitingCount: queue._count?.tokens || 0,
      currentServing: queue.tokens?.[0]?.tokenId || null,
      status: queue.isActive ? 'ACTIVE' : 'PAUSED',
      _count: undefined,
      tokens: undefined
    }));

    const responseOrg = {
      ...organisation,
      queues: transformedQueues
    };

    res.status(200).json({
      success: true,
      data: {
        organisation: responseOrg
      }
    });
  } catch (error) {
    console.error('Get organisation by code error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Search organisations
const searchOrganisations = async (req, res) => {
  try {
    const { q, city, verified } = req.query;

    const whereClause = {
      isActive: true
    };

    if (q) {
      whereClause.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { code: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } }
      ];
    }

    if (city) {
      whereClause.city = { equals: city, mode: 'insensitive' };
    }

    if (verified !== undefined) {
      whereClause.isVerified = verified === 'true';
    }

    const organisations = await prisma.organisation.findMany({
      where: whereClause,
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        address: true,
        city: true,
        state: true,
        country: true,
        contactEmail: true,
        contactPhone: true,
        isVerified: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            queues: {
              where: { isActive: true }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.status(200).json({
      success: true,
      data: {
        organisations: organisations
      }
    });
  } catch (error) {
    console.error('Search organisations error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update organisation
const updateOrganisation = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if user has access
    if (req.user.role !== 'SUPER_ADMIN' && req.user.organisationId !== id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this organisation'
      });
    }

    const organisation = await prisma.organisation.update({
      where: { id },
      data: updateData
    });

    res.json({
      success: true,
      message: 'Organisation updated successfully',
      data: { organisation }
    });
  } catch (error) {
    console.error('Update organisation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update organisation'
    });
  }
};

// Delete organisation
const deleteOrganisation = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if there are active queues
    const activeQueues = await prisma.queue.count({
      where: { organisationId: id, isActive: true }
    });

    if (activeQueues > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete organisation with ${activeQueues} active queues`
      });
    }

    await prisma.organisation.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Organisation deleted successfully'
    });
  } catch (error) {
    console.error('Delete organisation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete organisation'
    });
  }
};

// Get public organisation details (by ID or Code)
const getPublicOrganisation = async (req, res) => {
  try {
    const { id } = req.params;

    const organisation = await prisma.organisation.findFirst({
      where: {
        isActive: true,
        OR: [
          { id: id },
          { code: { equals: id, mode: 'insensitive' } }
        ]
      },
      include: {
        queues: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!organisation) {
      return res.status(404).json({
        success: false,
        message: 'Organisation not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        organisation: organisation
      }
    });
  } catch (error) {
    console.error('Get public organisation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getAllOrganisations,
  getOrganisationById,
  getMyOrganisation,
  updateMyOrganisation,
  createOrganisation,
  verifyOrganisation,
  getOrganisationByCode,
  searchOrganisations,
  updateOrganisation,
  getPublicOrganisation,
  deleteOrganisation
};