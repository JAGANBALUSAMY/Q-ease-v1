const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkQueues() {
  try {
    const queues = await prisma.queue.findMany({
      include: {
        organisation: true,
        tokens: {
          where: {
            status: 'PENDING'
          },
          select: {
            id: true
          }
        }
      }
    });
    
    console.log('Queues in database:');
    queues.forEach(queue => {
      console.log(`- ${queue.name} (${queue.id}) - ${queue.tokens.length} waiting`);
    });
    
    console.log('\nDetailed queue data:');
    console.log(JSON.stringify(queues, null, 2));
  } catch (error) {
    console.error('Error fetching queues:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkQueues();