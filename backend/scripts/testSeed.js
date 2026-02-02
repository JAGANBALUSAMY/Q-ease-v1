const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Test seed starting...');
    try {
        const role = await prisma.roleModel.create({
            data: {
                name: 'TEST_ROLE',
                description: 'Test'
            }
        });
        console.log('Created:', role);
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}
main();
