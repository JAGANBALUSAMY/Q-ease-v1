// Test setup file
const { prisma } = require('../src/models');

// Mock console methods to reduce noise in test output
console.log = jest.fn();
console.info = jest.fn();
console.warn = jest.fn();
console.error = jest.fn();

// Clear database before each test
beforeEach(async () => {
  // Clear all data but keep the schema
  const tablenames = await prisma.$queryRaw`
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname='public'
  `;

  for (const { tablename } of tablenames) {
    if (tablename !== '_prisma_migrations') {
      try {
        await prisma.$executeRawUnsafe(
          `TRUNCATE TABLE "public"."${tablename}" RESTART IDENTITY CASCADE;`
        );
      } catch (error) {
        console.log(`Error truncating table ${tablename}:`, error);
      }
    }
  }
});

// Close database connection after all tests
afterAll(async () => {
  await prisma.$disconnect();
});