const request = require('supertest');
const { prisma } = require('../../../src/models');

// Create a minimal Express app for testing
const express = require('express');
const app = express();
app.use(express.json());

// Import and setup routes for testing
const queueRoutes = require('../../../src/routes/queueRoutes');
const { authenticateToken, authorizeRole, checkOrganisationAccess, checkQueueAccess } = require('../../../src/middleware/authMiddleware');

// Mock the middleware
jest.mock('../../../src/middleware/authMiddleware', () => ({
  authenticateToken: (req, res, next) => {
    req.user = {
      id: 'org-admin-id',
      role: 'ORGANISATION_ADMIN',
      organisationId: 'test-org-id'
    };
    next();
  },
  authorizeRole: () => (req, res, next) => next(),
  checkOrganisationAccess: (req, res, next) => next(),
  checkQueueAccess: (req, res, next) => next()
}));

app.use('/api', queueRoutes);

describe('Queue Controller', () => {
  let testOrganisation;
  let testQueue;

  beforeEach(async () => {
    // Create a test organisation with unique code
    testOrganisation = await prisma.organisation.create({
      data: {
        code: `TEST_${Date.now()}`,
        name: 'Test Organisation',
        isVerified: true,
        isActive: true
      }
    });

    // Create a test queue
    testQueue = await prisma.queue.create({
      data: {
        name: 'Test Queue',
        description: 'Test Queue Description',
        averageTime: 10,
        organisationId: testOrganisation.id,
        isActive: true
      }
    });
  });

  afterEach(async () => {
    // Clean up test data to prevent conflicts
    await prisma.queue.deleteMany();
    await prisma.token.deleteMany();
    await prisma.organisation.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('POST /api/:organisationId/queues', () => {
    it('should create a new queue', async () => {
      const queueData = {
        name: 'New Test Queue',
        description: 'New Test Queue Description',
        maxTokens: 50,
        averageTime: 15
      };

      const response = await request(app)
        .post(`/api/${testOrganisation.id}/queues`)
        .send(queueData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.queue.name).toBe(queueData.name);
      expect(response.body.data.queue.description).toBe(queueData.description);
      expect(response.body.data.queue.maxTokens).toBe(queueData.maxTokens);
      expect(response.body.data.queue.averageTime).toBe(queueData.averageTime);
    });
  });

  describe('PUT /api/:organisationId/queues/:queueId', () => {
    it('should update an existing queue', async () => {
      const updateData = {
        name: 'Updated Queue Name',
        description: 'Updated Description',
        maxTokens: 75,
        averageTime: 20,
        isActive: false
      };

      const response = await request(app)
        .put(`/api/${testOrganisation.id}/queues/${testQueue.id}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.queue.name).toBe(updateData.name);
      expect(response.body.data.queue.description).toBe(updateData.description);
      expect(response.body.data.queue.maxTokens).toBe(updateData.maxTokens);
      expect(response.body.data.queue.averageTime).toBe(updateData.averageTime);
      expect(response.body.data.queue.isActive).toBe(updateData.isActive);
    });
  });

  describe('GET /api/queues/:queueId/status', () => {
    it('should get queue status', async () => {
      const response = await request(app)
        .get(`/api/queues/${testQueue.id}/status`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.queue.id).toBe(testQueue.id);
      expect(response.body.data.queue.name).toBe(testQueue.name);
      expect(response.body.data.queue.currentToken).toBe('N/A'); // No tokens yet
      expect(typeof response.body.data.queue.waitingCount).toBe('number');
      expect(typeof response.body.data.queue.estimatedWaitTime).toBe('number');
    });
  });

  describe('PUT /api/queues/:queueId/pause', () => {
    it('should pause a queue', async () => {
      const response = await request(app)
        .put(`/api/queues/${testQueue.id}/pause`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Queue paused successfully');
    });
  });

  describe('PUT /api/queues/:queueId/resume', () => {
    it('should resume a queue', async () => {
      const response = await request(app)
        .put(`/api/queues/${testQueue.id}/resume`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Queue resumed successfully');
    });
  });
});