const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
require('dotenv').config();

const prisma = new PrismaClient();
const BACKUP_DIR = path.join(__dirname, '../backups');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function listBackups() {
    if (!fs.existsSync(BACKUP_DIR)) {
        console.log('❌ No backups directory found');
        return [];
    }

    const files = fs.readdirSync(BACKUP_DIR)
        .filter(file => file.startsWith('backup-') && file.endsWith('.json'))
        .map(file => {
            const filePath = path.join(BACKUP_DIR, file);
            const stats = fs.statSync(filePath);
            return {
                name: file,
                path: filePath,
                size: (stats.size / (1024 * 1024)).toFixed(2),
                date: stats.mtime
            };
        })
        .sort((a, b) => b.date - a.date);

    return files;
}

function selectBackup() {
    return new Promise((resolve) => {
        const backups = listBackups();

        if (backups.length === 0) {
            console.log('❌ No backups found');
            rl.close();
            process.exit(1);
        }

        console.log('\n📦 Available backups:\n');
        backups.forEach((backup, index) => {
            console.log(`${index + 1}. ${backup.name}`);
            console.log(`   📊 Size: ${backup.size} MB`);
            console.log(`   📅 Date: ${backup.date.toLocaleString()}\n`);
        });

        rl.question('Select backup number to restore (or 0 to cancel): ', (answer) => {
            const selection = parseInt(answer);

            if (selection === 0 || isNaN(selection)) {
                console.log('❌ Restore cancelled');
                rl.close();
                process.exit(0);
            }

            if (selection < 1 || selection > backups.length) {
                console.log('❌ Invalid selection');
                rl.close();
                process.exit(1);
            }

            resolve(backups[selection - 1]);
        });
    });
}

async function restoreDatabase(backupFile) {
    console.log('\n⚠️  WARNING: This will overwrite the current database!');
    console.log('⚠️  All existing data will be deleted and replaced with backup data.');

    return new Promise((resolve, reject) => {
        rl.question('\nAre you sure you want to continue? (yes/no): ', async (answer) => {
            rl.close();

            if (answer.toLowerCase() !== 'yes') {
                console.log('❌ Restore cancelled');
                await prisma.$disconnect();
                process.exit(0);
            }

            try {
                console.log('\n🔄 Starting database restore...');
                console.log(`📁 Restoring from: ${backupFile.name}`);

                // Read backup file
                const backupData = JSON.parse(fs.readFileSync(backupFile.path, 'utf8'));

                console.log('\n🗑️  Clearing existing data...');

                // Delete in reverse order of dependencies (handle missing tables gracefully)
                try {
                    if (prisma.userAuditLog) {
                        await prisma.userAuditLog.deleteMany();
                    }
                } catch (e) {
                    console.log('   ⚠️  UserAuditLog table not yet created (skipping)');
                }

                await prisma.analytics.deleteMany();
                await prisma.notification.deleteMany();
                await prisma.token.deleteMany();
                await prisma.queue.deleteMany();
                await prisma.user.deleteMany();
                await prisma.organisation.deleteMany();
                await prisma.roleModel.deleteMany();

                console.log('✅ Existing data cleared\n');
                console.log('📥 Restoring data...');

                // Restore in order of dependencies
                if (backupData.data.roleModels?.length > 0) {
                    console.log(`  - RoleModel (${backupData.data.roleModels.length} records)...`);
                    await prisma.roleModel.createMany({ data: backupData.data.roleModels });
                }

                if (backupData.data.organisations?.length > 0) {
                    console.log(`  - Organisation (${backupData.data.organisations.length} records)...`);
                    await prisma.organisation.createMany({ data: backupData.data.organisations });
                }

                if (backupData.data.users?.length > 0) {
                    console.log(`  - User (${backupData.data.users.length} records)...`);
                    await prisma.user.createMany({ data: backupData.data.users });
                }

                if (backupData.data.queues?.length > 0) {
                    console.log(`  - Queue (${backupData.data.queues.length} records)...`);
                    await prisma.queue.createMany({ data: backupData.data.queues });
                }

                if (backupData.data.tokens?.length > 0) {
                    console.log(`  - Token (${backupData.data.data.tokens.length} records)...`);
                    await prisma.token.createMany({ data: backupData.data.tokens });
                }

                if (backupData.data.notifications?.length > 0) {
                    console.log(`  - Notification (${backupData.data.notifications.length} records)...`);
                    await prisma.notification.createMany({ data: backupData.data.notifications });
                }

                if (backupData.data.analytics?.length > 0) {
                    console.log(`  - Analytics (${backupData.data.analytics.length} records)...`);
                    await prisma.analytics.createMany({ data: backupData.data.analytics });
                }

                if (backupData.data.userAuditLogs?.length > 0) {
                    try {
                        if (prisma.userAuditLog) {
                            console.log(`  - UserAuditLog (${backupData.data.userAuditLogs.length} records)...`);
                            await prisma.userAuditLog.createMany({ data: backupData.data.userAuditLogs });
                        }
                    } catch (e) {
                        console.log('   ⚠️  UserAuditLog table not yet created (skipping)');
                    }
                }

                console.log('\n✅ Database restored successfully!');
                console.log(`📊 Restored from: ${backupFile.name}`);
                console.log(`📅 Backup timestamp: ${backupData.timestamp}`);

                resolve();
            } catch (error) {
                console.error('\n❌ Restore failed:', error);
                reject(error);
            } finally {
                await prisma.$disconnect();
            }
        });
    });
}

// Run restore
(async () => {
    try {
        const backup = await selectBackup();
        await restoreDatabase(backup);
        console.log('\n✅ Restore process completed');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Restore process failed:', error);
        await prisma.$disconnect();
        process.exit(1);
    }
})();
