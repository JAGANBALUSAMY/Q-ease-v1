const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { sendTokenCreatedNotification, sendTokenCalledNotification } = require('../services/notificationService');

// Helper function to generate token ID
const generateTokenId = async (queueId) => {
  const queue = await prisma.queue.findUnique({
    where: { id: queueId },
    select: { name: true }
  });

  const prefix = queue.name.substring(0, 1).toUpperCase();
  const count = await prisma.token.count({
    where: { queueId }
  });

  return `${prefix}${String(count + 1).padStart(3, '0')}`;
};

// Create token (User joins queue)
const createToken = async (req, res) => {
  try {
    const { queueId, priority = 'NORMAL' } = req.body;
    const userId = req.user?.id; // From auth middleware

    // Check if queue exists and is active
    const queue = await prisma.queue.findUnique({
      where: { id: queueId },
      include: { organisation: true }
    });

    if (!queue) {
      return res.status(404).json({
        success: false,
        message: 'Queue not found'
      });
    }

    if (!queue.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Queue is currently inactive'
      });
    }

    // Check max tokens limit
    if (queue.maxTokens) {
      const activeTokens = await prisma.token.count({
        where: {
          queueId,
          status: { in: ['PENDING', 'CALLED'] }
        }
      });

      if (activeTokens >= queue.maxTokens) {
        return res.status(400).json({
          success: false,
          message: 'Queue has reached maximum capacity'
        });
      }
    }

    // Calculate position
    const pendingTokens = await prisma.token.count({
      where: {
        queueId,
        status: 'PENDING'
      }
    });

    const position = pendingTokens + 1;

    // Calculate estimated time
    const estimatedMinutes = position * (queue.averageTime || 10);
    const estimatedTime = new Date(Date.now() + estimatedMinutes * 60000);

    // Generate token ID
    const tokenId = await generateTokenId(queueId);

    // Create token
    const token = await prisma.token.create({
      data: {
        tokenId,
        queueId,
        userId,
        organisationId: queue.organisationId,
        status: 'PENDING',
        priority,
        position,
        estimatedTime
      },
      include: {
        queue: {
          select: {
            name: true,
            averageTime: true
          }
        },
        organisation: {
          select: {
            name: true,
            code: true
          }
        }
      }
    });

    // Emit Socket.IO event
    const io = req.app.get('io');
    if (io) {
      io.to(`queue-${queueId}`).emit('queue-update', {
        type: 'token-added',
        queueId,
        token: {
          id: token.id,
          tokenId: token.tokenId,
          position: token.position,
          priority: token.priority
        }
      });

      io.to(`org-${queue.organisationId}`).emit('org-update', {
        type: 'new-token',
        organisationId: queue.organisationId,
        queueId,
        tokenCount: pendingTokens + 1
      });
    }

    // Send notification to user
    if (userId) {
      sendTokenCreatedNotification(token).catch(err =>
        console.error('Notification error:', err)
      );
    }

    res.status(201).json({
      success: true,
      message: 'Token created successfully',
      data: {
        token: {
          id: token.id,
          tokenId: token.tokenId,
          queueId: token.queueId,
          queueName: token.queue.name,
          organisationName: token.organisation.name,
          position: token.position,
          priority: token.priority,
          estimatedTime: token.estimatedTime,
          status: token.status,
          issuedAt: token.issuedAt
        }
      }
    });
  } catch (error) {
    console.error('Create token error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create token',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get token by ID
const getTokenById = async (req, res) => {
  try {
    const { tokenId } = req.params;

    const token = await prisma.token.findUnique({
      where: { id: tokenId },
      include: {
        queue: {
          select: {
            name: true,
            averageTime: true,
            organisationId: true
          }
        },
        organisation: {
          select: {
            name: true,
            code: true
          }
        },
        tokenUser: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    if (!token) {
      return res.status(404).json({
        success: false,
        message: 'Token not found'
      });
    }

    // Get current position if still pending
    if (token.status === 'PENDING') {
      const currentPosition = await prisma.token.count({
        where: {
          queueId: token.queueId,
          status: 'PENDING',
          issuedAt: {
            lte: token.issuedAt
          }
        }
      });
      token.position = currentPosition;
    }

    res.json({
      success: true,
      data: { token }
    });
  } catch (error) {
    console.error('Get token error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve token'
    });
  }
};

// Get user's tokens
const getMyTokens = async (req, res) => {
  try {
    const userId = req.user.id;

    const tokens = await prisma.token.findMany({
      where: { userId },
      include: {
        queue: {
          select: {
            name: true
          }
        },
        organisation: {
          select: {
            name: true,
            code: true
          }
        }
      },
      orderBy: {
        issuedAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: { tokens }
    });
  } catch (error) {
    console.error('Get my tokens error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve tokens'
    });
  }
};

// Call next token (Staff)
const callNextToken = async (req, res) => {
  try {
    const { queueId } = req.params;
    const callerId = req.user.id; // Staff member calling

    // First, mark any currently CALLED token as SERVED
    const currentCalledToken = await prisma.token.findFirst({
      where: {
        queueId,
        status: 'CALLED'
      }
    });

    if (currentCalledToken) {
      await prisma.token.update({
        where: { id: currentCalledToken.id },
        data: {
          status: 'SERVED',
          servedAt: new Date()
        }
      });
    }

    // Find next pending token (priority order)
    const nextToken = await prisma.token.findFirst({
      where: {
        queueId,
        status: 'PENDING'
      },
      orderBy: [
        { priority: 'desc' }, // EMERGENCY > PRIORITY > NORMAL
        { issuedAt: 'asc' }   // First come, first served within same priority
      ],
      include: {
        tokenUser: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        queue: {
          select: {
            name: true
          }
        }
      }
    });

    if (!nextToken) {
      return res.status(404).json({
        success: false,
        message: 'No pending tokens in queue'
      });
    }

    // Update token status
    const updatedToken = await prisma.token.update({
      where: { id: nextToken.id },
      data: {
        status: 'CALLED',
        callerId,
        calledAt: new Date()
      },
      include: {
        queue: true,
        tokenUser: true
      }
    });

    // Emit Socket.IO events
    const io = req.app.get('io');
    if (io) {
      // Notify the specific token holder
      io.to(`token-${updatedToken.id}`).emit('token-update', {
        type: 'token-called',
        tokenId: updatedToken.id,
        token: {
          id: updatedToken.id,
          tokenId: updatedToken.tokenId,
          status: 'CALLED',
          calledAt: updatedToken.calledAt
        },
        message: 'Your token has been called! Please proceed to the counter.'
      });

      // Notify queue watchers
      io.to(`queue-${queueId}`).emit('queue-update', {
        type: 'token-called',
        queueId,
        tokenId: updatedToken.tokenId,
        currentToken: updatedToken.tokenId
      });

      // Update all pending tokens about position change
      const pendingTokens = await prisma.token.findMany({
        where: {
          queueId,
          status: 'PENDING'
        },
        select: { id: true }
      });

      pendingTokens.forEach((token, index) => {
        io.to(`token-${token.id}`).emit('token-update', {
          type: 'position-update',
          tokenId: token.id,
          position: index + 1
        });
      });
    }

    // Send notification to token holder
    if (updatedToken.userId) {
      sendTokenCalledNotification(updatedToken, updatedToken.tokenUser).catch(err =>
        console.error('Notification error:', err)
      );
    }

    res.json({
      success: true,
      message: 'Token called successfully',
      data: {
        token: {
          id: updatedToken.id,
          tokenId: updatedToken.tokenId,
          queueName: updatedToken.queue.name,
          status: updatedToken.status,
          calledAt: updatedToken.calledAt,
          user: updatedToken.tokenUser
        }
      }
    });
  } catch (error) {
    console.error('Call next token error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to call next token'
    });
  }
};

// Mark token as served (Staff)
const markTokenServed = async (req, res) => {
  try {
    const { tokenId } = req.params;
    const callerId = req.user.id;

    const token = await prisma.token.findUnique({
      where: { id: tokenId }
    });

    if (!token) {
      return res.status(404).json({
        success: false,
        message: 'Token not found'
      });
    }

    if (token.status !== 'CALLED') {
      return res.status(400).json({
        success: false,
        message: 'Token must be in CALLED status to mark as served'
      });
    }

    const updatedToken = await prisma.token.update({
      where: { id: tokenId },
      data: {
        status: 'SERVED',
        servedAt: new Date(),
        callerId // Update caller if different
      }
    });

    // Emit Socket.IO event
    const io = req.app.get('io');
    if (io) {
      io.to(`token-${tokenId}`).emit('token-update', {
        type: 'token-served',
        tokenId: updatedToken.id,
        status: 'SERVED',
        servedAt: updatedToken.servedAt
      });

      io.to(`queue-${token.queueId}`).emit('queue-update', {
        type: 'token-served',
        queueId: token.queueId,
        tokenId: updatedToken.tokenId
      });
    }

    res.json({
      success: true,
      message: 'Token marked as served',
      data: { token: updatedToken }
    });
  } catch (error) {
    console.error('Mark token served error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark token as served'
    });
  }
};

// Cancel token (User or Staff)
const cancelToken = async (req, res) => {
  try {
    const { tokenId } = req.params;
    const userId = req.user.id;

    const token = await prisma.token.findUnique({
      where: { id: tokenId }
    });

    if (!token) {
      return res.status(404).json({
        success: false,
        message: 'Token not found'
      });
    }

    // Check if user owns the token or is staff
    if (token.userId !== userId && !['STAFF', 'ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this token'
      });
    }

    if (!['PENDING', 'CALLED'].includes(token.status)) {
      return res.status(400).json({
        success: false,
        message: 'Token cannot be cancelled in current status'
      });
    }

    const updatedToken = await prisma.token.update({
      where: { id: tokenId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date()
      }
    });

    // Emit Socket.IO event
    const io = req.app.get('io');
    if (io) {
      io.to(`token-${tokenId}`).emit('token-update', {
        type: 'token-cancelled',
        tokenId: updatedToken.id,
        status: 'CANCELLED'
      });

      io.to(`queue-${token.queueId}`).emit('queue-update', {
        type: 'token-cancelled',
        queueId: token.queueId,
        tokenId: updatedToken.tokenId
      });
    }

    res.json({
      success: true,
      message: 'Token cancelled successfully',
      data: { token: updatedToken }
    });
  } catch (error) {
    console.error('Cancel token error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel token'
    });
  }
};

// Get queue tokens (Staff/Admin)
const getQueueTokens = async (req, res) => {
  try {
    const { queueId } = req.params;
    const { status } = req.query;

    const where = { queueId };
    if (status) {
      where.status = status;
    }

    const tokens = await prisma.token.findMany({
      where,
      include: {
        tokenUser: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: [
        { priority: 'desc' },
        { issuedAt: 'asc' }
      ]
    });

    res.json({
      success: true,
      data: { tokens }
    });
  } catch (error) {
    console.error('Get queue tokens error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve queue tokens'
    });
  }
};

module.exports = {
  createToken,
  getTokenById,
  getMyTokens,
  callNextToken,
  markTokenServed,
  cancelToken,
  getQueueTokens
};