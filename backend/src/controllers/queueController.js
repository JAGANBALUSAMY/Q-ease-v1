const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all queues
const getAllQueues = async (req, res) => {
  try {
    const { isActive } = req.query;
    let organisationId = req.query.organisationId;
    // Prepare filter
    const where = {};

    // Strict Scoping: If not Super Admin, force them to see only their own org's queues
    if (req.user.role === 'ORGANISATION_ADMIN') {
      organisationId = req.user.organisationId;
      where.adminId = req.user.id; // Only show queues assigned to this admin
    } else if (req.user.role === 'STAFF') {
      organisationId = req.user.organisationId;
    }

    if (organisationId) where.organisationId = organisationId;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const queues = await prisma.queue.findMany({
      where,
      include: {
        organisation: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        tokens: {
          where: {
            status: { in: ['PENDING', 'CALLED'] }
          },
          select: {
            id: true,
            status: true,
            tokenId: true,
            updatedAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Format queues with current token and counts
    const formattedQueues = queues.map((queue) => {
      // Safely access tokens array
      const tokens = queue.tokens || [];
      // Find the current CALLED token
      const currentToken = tokens.find(t => t.status === 'CALLED');
      // Count PENDING tokens (waiting)
      const waitingCount = tokens.filter(t => t.status === 'PENDING').length;

      return {
        id: queue.id,
        name: queue.name,
        description: queue.description,
        maxTokens: queue.maxTokens,
        averageTime: queue.averageTime,
        isActive: queue.isActive,
        organisation: queue.organisation,
        currentToken: currentToken?.tokenId || null,
        _count: {
          tokens: waitingCount
        },
        waitingCount: waitingCount,
        createdAt: queue.createdAt
      };
    });

    res.json({
      success: true,
      data: { queues: formattedQueues }
    });
  } catch (error) {
    console.error('Get all queues error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error message:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve queues',
      error: error.message
    });
  }
};

// Get queue by ID
const getQueueById = async (req, res) => {
  try {
    const { id } = req.params;

    const queue = await prisma.queue.findUnique({
      where: { id },
      include: {
        organisation: {
          select: {
            id: true,
            name: true,
            code: true,
            address: true,
            city: true
          }
        },
        _count: {
          select: {
            tokens: {
              where: {
                status: { in: ['PENDING', 'CALLED'] }
              }
            }
          }
        }
      }
    });

    if (!queue) {
      return res.status(404).json({
        success: false,
        message: 'Queue not found'
      });
    }

    // Get current serving token
    const currentToken = await prisma.token.findFirst({
      where: {
        queueId: id,
        status: 'CALLED'
      },
      orderBy: {
        calledAt: 'desc'
      },
      select: {
        tokenId: true,
        calledAt: true
      }
    });

    res.json({
      success: true,
      data: {
        queue: {
          ...queue,
          waitingCount: queue._count.tokens,
          currentToken: currentToken?.tokenId || null,
          currentTokenCalledAt: currentToken?.calledAt || null
        }
      }
    });
  } catch (error) {
    console.error('Get queue error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve queue'
    });
  }
};

// Get queues by organisation
const getQueuesByOrganisation = async (req, res) => {
  try {
    const { organisationId } = req.params;

    const queues = await prisma.queue.findMany({
      where: { organisationId },
      include: {
        _count: {
          select: {
            tokens: {
              where: {
                status: { in: ['PENDING', 'CALLED'] }
              }
            }
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    const formattedQueues = queues.map(queue => ({
      id: queue.id,
      name: queue.name,
      description: queue.description,
      maxTokens: queue.maxTokens,
      averageTime: queue.averageTime,
      isActive: queue.isActive,
      waitingCount: queue._count.tokens
    }));

    res.json({
      success: true,
      data: { queues: formattedQueues }
    });
  } catch (error) {
    console.error('Get queues by organisation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve queues'
    });
  }
};

// Create queue
const createQueue = async (req, res) => {
  try {
    const { name, description, organisationId, adminId, maxTokens, averageTime } = req.body;

    // Verify user has access to this organisation
    if (req.user.role !== 'SUPER_ADMIN' && req.user.organisationId !== organisationId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to create queue for this organisation'
      });
    }

    const queue = await prisma.queue.create({
      data: {
        name,
        description,
        organisationId,
        adminId: adminId || (req.user.role === 'ORGANISATION_ADMIN' ? req.user.id : null),
        maxTokens,
        averageTime,
        isActive: true
      },
      include: {
        organisation: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      }
    });

    // Emit Socket.IO event
    const io = req.app.get('io');
    if (io) {
      io.to(`org-${organisationId}`).emit('org-update', {
        type: 'queue-created',
        organisationId,
        queue: {
          ...queue,
          waitingCount: 0,
          avgWaitTime: queue.averageTime,
          staffCount: 0
        }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Queue created successfully',
      data: { queue }
    });
  } catch (error) {
    console.error('Create queue error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create queue'
    });
  }
};

// Update queue
const updateQueue = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, maxTokens, averageTime, isActive } = req.body;

    // Check if queue exists and user has access
    const existingQueue = await prisma.queue.findUnique({
      where: { id },
      select: { organisationId: true }
    });

    if (!existingQueue) {
      return res.status(404).json({
        success: false,
        message: 'Queue not found'
      });
    }

    if (req.user.role !== 'SUPER_ADMIN' && req.user.organisationId !== existingQueue.organisationId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this queue'
      });
    }

    const queue = await prisma.queue.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(maxTokens !== undefined && { maxTokens }),
        ...(averageTime !== undefined && { averageTime }),
        ...(isActive !== undefined && { isActive })
      }
    });

    // Emit Socket.IO event
    const io = req.app.get('io');
    if (io) {
      io.to(`queue-${id}`).emit('queue-update', {
        type: 'queue-updated',
        queueId: id,
        updates: { name, description, maxTokens, averageTime, isActive }
      });

      io.to(`org-${existingQueue.organisationId}`).emit('org-update', {
        type: 'queue-updated',
        queueId: id,
        updates: {
          name,
          description,
          maxTokens,
          averageTime,
          isActive,
          avgWaitTime: averageTime // Map for frontend convenience
        }
      });
    }

    res.json({
      success: true,
      message: 'Queue updated successfully',
      data: { queue }
    });
  } catch (error) {
    console.error('Update queue error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update queue'
    });
  }
};

// Pause queue
const pauseQueue = async (req, res) => {
  try {
    const { id } = req.params;

    const queue = await prisma.queue.update({
      where: { id },
      data: { isActive: false }
    });

    // Emit Socket.IO event
    const io = req.app.get('io');
    if (io) {
      io.to(`queue-${id}`).emit('queue-update', {
        type: 'queue-paused',
        queueId: id,
        message: 'Queue has been paused'
      });
    }

    res.json({
      success: true,
      message: 'Queue paused successfully',
      data: { queue }
    });
  } catch (error) {
    console.error('Pause queue error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to pause queue'
    });
  }
};

// Resume queue
const resumeQueue = async (req, res) => {
  try {
    const { id } = req.params;

    const queue = await prisma.queue.update({
      where: { id },
      data: { isActive: true }
    });

    // Emit Socket.IO event
    const io = req.app.get('io');
    if (io) {
      io.to(`queue-${id}`).emit('queue-update', {
        type: 'queue-resumed',
        queueId: id,
        message: 'Queue has been resumed'
      });
    }

    res.json({
      success: true,
      message: 'Queue resumed successfully',
      data: { queue }
    });
  } catch (error) {
    console.error('Resume queue error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resume queue'
    });
  }
};

// Delete queue
const deleteQueue = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if there are active tokens
    const activeTokens = await prisma.token.count({
      where: {
        queueId: id,
        status: { in: ['PENDING', 'CALLED'] }
      }
    });

    if (activeTokens > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete queue with ${activeTokens} active tokens. Please serve or cancel all tokens first.`
      });
    }

    const queue = await prisma.queue.delete({
      where: { id }
    });

    // Emit Socket.IO event
    const io = req.app.get('io');
    if (io) {
      io.to(`queue-${id}`).emit('queue-update', {
        type: 'queue-deleted',
        queueId: id
      });

      io.to(`org-${queue.organisationId}`).emit('org-update', {
        type: 'queue-deleted',
        queueId: id
      });
    }

    res.json({
      success: true,
      message: 'Queue deleted successfully'
    });
  } catch (error) {
    console.error('Delete queue error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete queue'
    });
  }
};

// Get public queues (active only)
const getPublicQueues = async (req, res) => {
  try {
    const { search } = req.query;

    const where = {
      isActive: true
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { organisation: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const queues = await prisma.queue.findMany({
      where,
      include: {
        organisation: {
          select: {
            name: true,
            city: true
          }
        },
        _count: {
          select: {
            tokens: {
              where: {
                status: { in: ['PENDING', 'CALLED'] }
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20
    });

    const formattedQueues = queues.map(queue => ({
      id: queue.id,
      name: queue.name,
      description: queue.description,
      organisationName: queue.organisation.name,
      location: queue.organisation.city,
      waitingCount: queue._count.tokens,
      averageTime: queue.averageTime || 10
    }));

    res.json({
      success: true,
      data: { queues: formattedQueues }
    });
  } catch (error) {
    console.error('Get public queues error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve public queues'
    });
  }
};

// Get public queue by ID
const getPublicQueueById = async (req, res) => {
  try {
    const { id } = req.params;

    const queue = await prisma.queue.findUnique({
      where: {
        id,
        isActive: true
      },
      include: {
        organisation: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true
          }
        },
        _count: {
          select: {
            tokens: {
              where: {
                status: { in: ['PENDING', 'CALLED'] }
              }
            }
          }
        }
      }
    });

    if (!queue) {
      return res.status(404).json({
        success: false,
        message: 'Queue not found or inactive'
      });
    }

    // Get current serving token (if any) - simplified for public view
    const currentToken = await prisma.token.findFirst({
      where: {
        queueId: id,
        status: 'CALLED'
      },
      orderBy: {
        calledAt: 'desc'
      },
      select: {
        tokenId: true
      }
    });

    res.json({
      success: true,
      data: {
        queue: {
          id: queue.id,
          name: queue.name,
          description: queue.description,
          organisationName: queue.organisation.name,
          organisationAddress: queue.organisation.address,
          organisationCity: queue.organisation.city,
          waitingCount: queue._count.tokens,
          averageTime: queue.averageTime || 10,
          currentServing: currentToken?.tokenId || '-'
        }
      }
    });
  } catch (error) {
    console.error('Get public queue error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve queue details'
    });
  }
};

module.exports = {
  getAllQueues,
  getQueueById,
  getQueuesByOrganisation,
  createQueue,
  updateQueue,
  pauseQueue,
  resumeQueue,
  deleteQueue,
  getPublicQueues,
  getPublicQueueById
};