const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDuplicates() {
    console.log('🔍 Checking for duplicate data...\n');

    try {
        // Check duplicate phone numbers
        console.log('1. Checking duplicate phone numbers...');
        const duplicatePhones = await prisma.$queryRaw`
      SELECT "phoneNumber", COUNT(*) as count
      FROM "User"
      WHERE "phoneNumber" IS NOT NULL
      GROUP BY "phoneNumber"
      HAVING COUNT(*) > 1
    `;

        if (duplicatePhones.length > 0) {
            console.log(`   ❌ Found ${duplicatePhones.length} duplicate phone numbers:`);
            duplicatePhones.forEach(row => {
                console.log(`      - ${row.phoneNumber}: ${row.count} occurrences`);
            });
        } else {
            console.log('   ✅ No duplicate phone numbers found');
        }

        // Check duplicate queue names per organisation
        console.log('\n2. Checking duplicate queue names per organisation...');
        const duplicateQueues = await prisma.$queryRaw`
      SELECT "organisationId", "name", COUNT(*) as count
      FROM "Queue"
      GROUP BY "organisationId", "name"
      HAVING COUNT(*) > 1
    `;

        if (duplicateQueues.length > 0) {
            console.log(`   ❌ Found ${duplicateQueues.length} duplicate queue names:`);
            duplicateQueues.forEach(row => {
                console.log(`      - Org: ${row.organisationId}, Queue: ${row.name}, Count: ${row.count}`);
            });
        } else {
            console.log('   ✅ No duplicate queue names found');
        }

        // Check duplicate token IDs per queue
        console.log('\n3. Checking duplicate token IDs per queue...');
        const duplicateTokens = await prisma.$queryRaw`
      SELECT "queueId", "tokenId", COUNT(*) as count
      FROM "Token"
      GROUP BY "queueId", "tokenId"
      HAVING COUNT(*) > 1
    `;

        if (duplicateTokens.length > 0) {
            console.log(`   ❌ Found ${duplicateTokens.length} duplicate token IDs:`);
            duplicateTokens.forEach(row => {
                console.log(`      - Queue: ${row.queueId}, Token: ${row.tokenId}, Count: ${row.count}`);
            });
        } else {
            console.log('   ✅ No duplicate token IDs found');
        }

        // Summary
        console.log('\n' + '='.repeat(50));
        const totalIssues = duplicatePhones.length + duplicateQueues.length + duplicateTokens.length;

        if (totalIssues === 0) {
            console.log('✅ No duplicates found! Safe to add unique constraints.');
        } else {
            console.log(`❌ Found ${totalIssues} duplicate issues. Please clean before migration.`);
        }

    } catch (error) {
        console.error('Error checking duplicates:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkDuplicates();
