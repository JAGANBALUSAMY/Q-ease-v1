const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const prisma = new PrismaClient();
const BACKUP_DIR = path.join(__dirname, '../backups');

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

async function backupDatabase() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(BACKUP_DIR, `backup-${timestamp}.json`);

    console.log('🔄 Starting database backup...');
    console.log(`📁 Backup location: ${backupFile}`);
    console.log('ℹ️  Using Prisma-based backup (cross-platform compatible)\n');

    try {
        const backup = {
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            data: {}
        };

        // Backup all tables
        console.log('📊 Backing up tables...');

        console.log('  - RoleModel...');
        backup.data.roleModels = await prisma.roleModel.findMany();

        console.log('  - Organisation...');
        backup.data.organisations = await prisma.organisation.findMany();

        console.log('  - User...');
        backup.data.users = await prisma.user.findMany();

        console.log('  - Queue...');
        backup.data.queues = await prisma.queue.findMany();

        console.log('  - Token...');
        backup.data.tokens = await prisma.token.findMany();

        console.log('  - Notification...');
        backup.data.notifications = await prisma.notification.findMany();

        console.log('  - Analytics...');
        backup.data.analytics = await prisma.analytics.findMany();

        // Try to backup UserAuditLog if it exists
        try {
            console.log('  - UserAuditLog...');
            if (prisma.userAuditLog) {
                backup.data.userAuditLogs = await prisma.userAuditLog.findMany();
            } else {
                backup.data.userAuditLogs = [];
                console.log('    ⚠️  UserAuditLog table not yet created (run migration first)');
            }
        } catch (error) {
            backup.data.userAuditLogs = [];
            console.log('    ⚠️  UserAuditLog table not yet created (run migration first)');
        }

        // Write backup to file
        fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));

        const stats = fs.statSync(backupFile);
        const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

        console.log('\n✅ Backup completed successfully!');
        console.log(`📊 Backup size: ${fileSizeMB} MB`);
        console.log(`📅 Timestamp: ${timestamp}`);

        // Show record counts
        console.log('\n📈 Records backed up:');
        console.log(`   - RoleModels: ${backup.data.roleModels.length}`);
        console.log(`   - Organisations: ${backup.data.organisations.length}`);
        console.log(`   - Users: ${backup.data.users.length}`);
        console.log(`   - Queues: ${backup.data.queues.length}`);
        console.log(`   - Tokens: ${backup.data.tokens.length}`);
        console.log(`   - Notifications: ${backup.data.notifications.length}`);
        console.log(`   - Analytics: ${backup.data.analytics.length}`);
        console.log(`   - UserAuditLogs: ${backup.data.userAuditLogs.length}`);

        // Clean old backups (keep last 7 days)
        cleanOldBackups(7);

        return backupFile;
    } catch (error) {
        console.error('❌ Backup failed:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

function cleanOldBackups(daysToKeep) {
    console.log(`\n🧹 Cleaning backups older than ${daysToKeep} days...`);

    const files = fs.readdirSync(BACKUP_DIR);
    const now = Date.now();
    const maxAge = daysToKeep * 24 * 60 * 60 * 1000;

    let deletedCount = 0;

    files.forEach(file => {
        if (file.startsWith('backup-') && file.endsWith('.json')) {
            const filePath = path.join(BACKUP_DIR, file);
            const stats = fs.statSync(filePath);
            const age = now - stats.mtimeMs;

            if (age > maxAge) {
                fs.unlinkSync(filePath);
                deletedCount++;
                console.log(`   🗑️  Deleted: ${file}`);
            }
        }
    });

    if (deletedCount === 0) {
        console.log('   ✅ No old backups to delete');
    } else {
        console.log(`   ✅ Deleted ${deletedCount} old backup(s)`);
    }
}

// Run backup
backupDatabase()
    .then(() => {
        console.log('\n✅ Backup process completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Backup process failed:', error);
        process.exit(1);
    });
