const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🗑️  Starting database cleanup...');

    try {
        // Truncate all tables in specific order to avoid FK constraints, or use CASCADE
        // PostgreSQL specific 'TRUNCATE ... CASCADE'
        const tablenames = await prisma.$queryRaw`
      SELECT tablename FROM pg_tables WHERE schemaname='public'
    `;

        for (const { tablename } of tablenames) {
            if (tablename !== '_prisma_migrations') {
                try {
                    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${tablename}" CASCADE;`);
                    console.log(`✓ Cleared table: ${tablename}`);
                } catch (error) {
                    console.log(`! Could not clear table: ${tablename} - ${error.message}`);
                }
            }
        }

        console.log('✨ Database successfully reset!');
    } catch (error) {
        console.error('Error resetting database:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
