const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Script to add an additional role to a user.
 * This enables testing the Multi-Role Login Feature.
 * 
 * Usage: node scripts/addRoleToUser.js <email> <ROLE_NAME>
 * Example: node scripts/addRoleToUser.js john@example.com STAFF
 */

async function addRoleToUser() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.error('❌ Usage: node scripts/addRoleToUser.js <email> <ROLE_NAME>');
    console.error('Available Roles: USER, STAFF, ORGANISATION_ADMIN, SUPER_ADMIN');
    process.exit(1);
  }

  let [email, roleName] = args;
  roleName = roleName.toUpperCase();

  // Map convenience names to actual DB role names
  if (roleName === 'ADMIN') roleName = 'ORGANISATION_ADMIN';

  console.log(`🔄 Adding role '${roleName}' to user '${email}'...`);

  try {
    // 1. Find the user
    const user = await prisma.user.findUnique({
      where: { email },
      include: { userRoles: true }
    });

    if (!user) {
      console.error(`❌ User not found with email: ${email}`);
      process.exit(1);
    }

    // 2. Find the role to add
    const roleToAdd = await prisma.roleModel.findFirst({
      where: { name: roleName.toUpperCase() }
    });

    if (!roleToAdd) {
      console.error(`❌ Role not found: ${roleName}`);
      process.exit(1);
    }

    // 3. Check if user already has this role
    const hasRole = await prisma.userRole.findUnique({
      where: {
        userId_roleId: {
          userId: user.id,
          roleId: roleToAdd.id
        }
      }
    });

    if (hasRole) {
      console.log(`⚠️  User '${email}' already has the role '${roleName}'.`);
      process.exit(0);
    }

    // 4. Add the role
    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: roleToAdd.id
      }
    });

    console.log(`✅ Successfully added role '${roleName}' to user '${email}'`);
    console.log(`🎉 User now has ${user.userRoles.length + 1} roles. Login to see the selection screen!`);

  } catch (error) {
    console.error('❌ Error adding role:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addRoleToUser();
