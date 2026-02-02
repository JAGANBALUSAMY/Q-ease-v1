const request = require('supertest');
const bcrypt = require('bcrypt');
const { prisma } = require('../../../src/models');

// Create a minimal Express app for testing
const express = require('express');
const app = express();
app.use(express.json());

// Import and setup routes for testing
const tokenRoutes = require('../../../src/routes/tokenRoutes');
const { authenticateToken, authorizeRole, checkQueueAccess } = require('../../../src/middleware/authMiddleware');

// Mock the middleware
jest.mock('../../../src/middleware/authMiddleware', () => ({
  authenticateToken: (req, res, next) => {
    req.user = {
      id: 'test-user-id',
      role: 'USER',
      organisationId: 'test-org-id'
    };
    next();
  },
  authorizeRole: (roles) => (req, res, next) => {
    if (roles.includes(req.user.role)) {
      next();
    } else {
      res.status(403).json({ success: false, message: 'Insufficient permissions' });
    }
  },
  checkQueueAccess: (req, res, next) => next()
}));

app.use('/api', tokenRoutes);

describe('Token Controller', () => {
  let testOrganisation;
  let testQueue;
  let testUser;
  let testRole;

  beforeEach(async () => {
    // Create test data
    testRole = await prisma.roleModel.create({
      data: {
        name: 'USER',
        description: 'Test user role'
      }
    });

    testOrganisation = await prisma.organisation.create({
      data: {
        code: `TEST_${Date.now()}`,
        name: 'Test Organisation',
        isVerified: true,
        isActive: true
      }
    });

    testQueue = await prisma.queue.create({
      data: {
        name: 'Test Queue',
        description: 'Test Queue Description',
        averageTime: 10,
        organisationId: testOrganisation.id,
        isActive: true
      }
    });

    const hashedPassword = await bcrypt.hash('password123', 12);
    testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
        organisationId: testOrganisation.id,
        roleId: testRole.id,
        isVerified: true,
        isActive: true
      }
    });
  });

  afterEach(async () => {
    // Clean up test data to prevent conflicts
    await prisma.token.deleteMany();
    await prisma.queue.deleteMany();
    await prisma.organisation.deleteMany();
    await prisma.user.deleteMany();
    await prisma.roleModel.deleteMany();
  });

  describe('POST /api/queues/:queueId/tokens', () => {
    it('should generate a token for user', async () => {
      const response = await request(app)
        .post(`/api/queues/${testQueue.id}/tokens`)
        .send({ priority: 'NORMAL' })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.token.displayToken).toMatch(/^[A-Z]\d{3}$/);
      expect(response.body.data.token.queueId).toBe(testQueue.id);
      expect(response.body.data.token.status).toBe('PENDING');
      expect(response.body.data.token.priority).toBe('NORMAL');
      expect(typeof response.body.data.token.position).toBe('number');
    });

    it('should generate a priority token', async () => {
      const response = await request(app)
        .post(`/api/queues/${testQueue.id}/tokens`)
        .send({ priority: 'PRIORITY' })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.token.priority).toBe('PRIORITY');
    });
  });

  describe('POST /api/queues/:queueId/tokens/walk-in', () => {
    beforeEach(() => {
      // Update middleware mock for staff role
      jest.mock('../../../src/middleware/authMiddleware', () => ({
        authenticateToken: (req, res, next) => {
          req.user = {
            id: 'staff-user-id',
            role: 'STAFF',
            organisationId: 'test-org-id'
          };
          next();
        },
        authorizeRole: (roles) => (req, res, next) => {
          if (roles.includes(req.user.role)) {
            next();
          } else {
            res.status(403).json({ success: false, message: 'Insufficient permissions' });
          }
        },
        checkQueueAccess: (req, res, next) => next()
      }));
    });

    it('should generate a walk-in token', async () => {
      const walkInData = {
        customerName: 'Walk-in Customer',
        contactInfo: '+1234567890',
        priority: 'NORMAL'
      };

      const response = await request(app)
        .post(`/api/queues/${testQueue.id}/tokens/walk-in`)
        .send(walkInData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.token.displayToken).toMatch(/^[A-Z]\d{3}$/);
      expect(response.body.data.token.status).toBe('PENDING');
    });
  });

  describe('PUT /api/queues/:queueId/call-next', () => {
    beforeEach(() => {
      // Update middleware mock for staff role
      jest.mock('../../../src/middleware/authMiddleware', () => ({
        authenticateToken: (req, res, next) => {
          req.user = {
            id: 'staff-user-id',
            role: 'STAFF',
            organisationId: 'test-org-id'
          };
          next();
        },
        authorizeRole: (roles) => (req, res, next) => {
          if (roles.includes(req.user.role)) {
            next();
          } else {
            res.status(403).json({ success: false, message: 'Insufficient permissions' });
          }
        },
        checkQueueAccess: (req, res, next) => next()
      }));
    });

    it('should call the next token in queue', async () => {
      // First create a token
      await prisma.token.create({
        data: {
          displayToken: 'T001',
          queueId: testQueue.id,
          userId: testUser.id,
          organisationId: testOrganisation.id,
          status: 'PENDING',
          priority: 'NORMAL',
          position: 1,
          issuedAt: new Date()
        }
      });

      const response = await request(app)
        .put(`/api/queues/${testQueue.id}/call-next`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.token.status).toBe('CALLED');
    });
  });

  describe('GET /api/users/me/tokens', () => {
    it('should get user\'s tokens', async () => {
      // Create a token for the user
      await prisma.token.create({
        data: {
          displayToken: 'T001',
          queueId: testQueue.id,
          userId: testUser.id,
          organisationId: testOrganisation.id,
          status: 'PENDING',
          priority: 'NORMAL',
          position: 1,
          issuedAt: new Date()
        }
      });

      const response = await request(app)
        .get('/api/users/me/tokens')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.tokens)).toBe(true);
      expect(response.body.data.tokens.length).toBeGreaterThan(0);
      expect(response.body.data.tokens[0].displayToken).toBe('T001');
    });
  });
});