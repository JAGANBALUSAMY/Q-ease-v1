const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Migration script to populate UserRole junction table
 * from existing User.roleId primary role assignments
 *
 * Usage: node scripts/migrateLegacyRoles.js
 */

async function migrateLegacyRoles() {
  console.log('🔄 Starting dynamic role system migration...\n');

  try {
    // Step 1: Count total users
    const totalUsers = await prisma.user.count();
    console.log(`📊 Found ${totalUsers} total users\n`);

    if (totalUsers === 0) {
      console.log('⚠️  No users found. Nothing to migrate.');
      return;
    }

    // Step 2: Get users that need migration
    const usersToMigrate = await prisma.user.findMany({
      include: {
        roleModel: true,
        userRoles: true
      }
    });

    console.log(`📋 Processing ${usersToMigrate.length} users...\n`);

    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    const errors = [];

    // Step 3: Migrate each user
    for (const user of usersToMigrate) {
      try {
        // Check if user already has UserRole entries
        if (user.userRoles && user.userRoles.length > 0) {
          console.log(
            `⏭️  ${user.email} - Already migrated with ${user.userRoles.length} role(s)`
          );
          skippedCount++;
          continue;
        }

        // Create UserRole entry for the user's primary role
        if (!user.roleId) {
          console.log(`❌ ${user.email} - No primary role assigned (roleId is null)`);
          errorCount++;
          errors.push({
            email: user.email,
            error: 'No primary role assigned'
          });
          continue;
        }

        await prisma.userRole.create({
          data: {
            userId: user.id,
            roleId: user.roleId
          }
        });

        console.log(
          `✅ ${user.email} - Migrated with role: ${user.roleModel.name}`
        );
        migratedCount++;
      } catch (error) {
        if (error.code === 'P2002') {
          // Unique constraint violation - already exists
          console.log(
            `⚠️  ${user.email} - Already has this role (duplicate check)`
          );
          skippedCount++;
        } else {
          console.log(`❌ ${user.email} - Migration failed: ${error.message}`);
          errorCount++;
          errors.push({
            email: user.email,
            error: error.message
          });
        }
      }
    }

    // Step 4: Verification
    console.log('\n📈 Verifying migration...\n');

    const migratedUsers = await prisma.user.findMany({
      include: {
        userRoles: {
          include: {
            role: true
          }
        }
      }
    });

    let validCount = 0;
    let invalidCount = 0;

    for (const user of migratedUsers) {
      if (!user.userRoles || user.userRoles.length === 0) {
        console.log(`⚠️  ${user.email} - No UserRole entries found!`);
        invalidCount++;
      } else {
        validCount++;
      }
    }

    // Step 5: Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total Users:        ${totalUsers}`);
    console.log(`Successfully Migrated: ${migratedCount}`);
    console.log(`Skipped (Already Done): ${skippedCount}`);
    console.log(`Errors:             ${errorCount}`);
    console.log(`Verified Valid:     ${validCount}`);
    console.log(`Verified Invalid:   ${invalidCount}`);
    console.log('='.repeat(50) + '\n');

    if (errorCount === 0 && invalidCount === 0) {
      console.log(
        '✅ Migration completed successfully! All users are ready for the new role system.\n'
      );
    } else {
      console.log('⚠️  Migration completed with some issues. See details above.\n');

      if (errors.length > 0) {
        console.log('Error Details:');
        errors.forEach((err) => {
          console.log(`  - ${err.email}: ${err.error}`);
        });
        console.log();
      }
    }

    // Step 6: Show sample multi-role user info
    console.log('📝 Next Steps:\n');
    console.log('1. Test login with a single-role user (should get direct token)');
    console.log('2. Assign additional roles using /api/auth/assign-role endpoint');
    console.log('3. Test login with multi-role user (should get role selection)');
    console.log('4. Update frontend to handle role selection UI\n');

    console.log('📚 Documentation:');
    console.log('  - LOGIN_FLOW_DOCUMENTATION.md - API reference and flows');
    console.log('  - MIGRATION_GUIDE_ROLES.md - Detailed migration guide');
    console.log('  - ROLE_SYSTEM_EXAMPLES.md - Code examples\n');

    // Check if we have any multi-role example we can show
    const multiRoleUsers = await prisma.userRole.groupBy({
      by: ['userId'],
      _count: true,
      having: {
        userId: {
          _count: {
            gt: 1
          }
        }
      }
    });

    if (multiRoleUsers.length > 0) {
      console.log(
        `ℹ️  Note: Found ${multiRoleUsers.length} user(s) with multiple roles already assigned.\n`
      );
    }
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrateLegacyRoles();
