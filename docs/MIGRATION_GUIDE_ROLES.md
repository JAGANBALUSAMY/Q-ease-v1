# Migration Guide: Dynamic Role System

## Overview

This guide helps you migrate your existing user system to the new dynamic multi-role system.

## Phase 1: Database Migration

### Step 1: Apply Prisma Schema Changes

The schema has been updated with the `UserRole` junction table. Apply the changes:

```bash
cd backend
npx prisma migrate dev --name add_user_roles
```

This command will:
- Create the `UserRole` table
- Update Prisma client types
- Show you any issues with the migration

### Step 2: Verify Migration

Check that the migration was successful:

```bash
npx prisma studio
```

Navigate to the `UserRole` table and verify it's empty (it should be - we'll populate it next).

## Phase 2: Populate Historical Data

### Option A: Automated Migration Script (Recommended)

Create a new file: `backend/scripts/migrateLegacyRoles.js`

```javascript
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrateLegacyRoles() {
  try {
    console.log('Starting legacy role migration...');

    // Get all users
    const users = await prisma.user.findMany({
      include: {
        roleModel: true,
        userRoles: true
      }
    });

    console.log(`Found ${users.length} users to migrate`);

    let migratedCount = 0;
    let skippedCount = 0;

    for (const user of users) {
      // Check if user already has UserRole entries
      if (user.userRoles && user.userRoles.length > 0) {
        console.log(`⏭️  User ${user.email} already migrated (has ${user.userRoles.length} roles)`);
        skippedCount++;
        continue;
      }

      try {
        // Create UserRole entry for the user's primary role
        await prisma.userRole.create({
          data: {
            userId: user.id,
            roleId: user.roleId
          }
        });

        console.log(`✅ Migrated user ${user.email} with role ${user.roleModel.name}`);
        migratedCount++;
      } catch (error) {
        if (error.code === 'P2002') {
          // Unique constraint violation - already exists
          console.log(`⚠️  User ${user.email} already has this role (skipping)`);
          skippedCount++;
        } else {
          throw error;
        }
      }
    }

    console.log('\n=== Migration Summary ===');
    console.log(`Total Users: ${users.length}`);
    console.log(`Migrated: ${migratedCount}`);
    console.log(`Skipped: ${skippedCount}`);
    console.log('Migration complete!');
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

migrateLegacyRoles();
```

Run the migration script:

```bash
cd backend
node scripts/migrateLegacyRoles.js
```

### Option B: Manual SQL Migration

If you prefer direct SQL:

```sql
-- Insert existing user roles into UserRole table
INSERT INTO "UserRole" (id, "userId", "roleId", "createdAt")
SELECT 
  gen_random_uuid()::text,
  u.id,
  u."roleId",
  NOW()
FROM "User" u
WHERE NOT EXISTS (
  SELECT 1 FROM "UserRole" ur WHERE ur."userId" = u.id
)
ON CONFLICT DO NOTHING;
```

## Phase 3: Testing the Migration

### Test 1: Verify Data Integrity

```javascript
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyMigration() {
  const users = await prisma.user.findMany({
    include: {
      userRoles: {
        include: { role: true }
      }
    }
  });

  for (const user of users) {
    if (!user.userRoles || user.userRoles.length === 0) {
      console.error(`❌ User ${user.email} has no roles!`);
    } else {
      const roles = user.userRoles.map(ur => ur.role.name).join(', ');
      console.log(`✅ User ${user.email}: ${roles}`);
    }
  }
}

verifyMigration();
```

### Test 2: Test Login Flow

1. **Single Role User**:
   ```bash
   curl -X POST http://localhost:5000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"staff@test.com","password":"password123"}'
   ```
   Expected: Direct token response (no role selection)

2. **Multiple Role User** (after assigning additional roles):
   ```bash
   curl -X POST http://localhost:5000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@test.com","password":"password123"}'
   ```
   Expected: Role selection response

## Phase 4: Assigning Additional Roles

### Add Roles to Users

Once migration is complete, you can assign multiple roles to users:

```javascript
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function assignRolesToUser() {
  // Find user and roles
  const user = await prisma.user.findUnique({
    where: { email: 'john@example.com' }
  });

  const staffRole = await prisma.roleModel.findUnique({
    where: { name: 'STAFF' }
  });

  const adminRole = await prisma.roleModel.findUnique({
    where: { name: 'ORGANISATION_ADMIN' }
  });

  // Assign both roles
  await prisma.userRole.create({
    data: {
      userId: user.id,
      roleId: staffRole.id
    }
  });

  await prisma.userRole.create({
    data: {
      userId: user.id,
      roleId: adminRole.id
    }
  });

  console.log(`✅ Assigned STAFF and ORGANISATION_ADMIN roles to ${user.email}`);
}

assignRolesToUser();
```

### Via API

```bash
# Get user ID first
curl http://localhost:5000/api/auth/user-roles/user_id

# Assign admin role
curl -X POST http://localhost:5000/api/auth/assign-role \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_id",
    "roleId": "admin_role_id"
  }'
```

## Phase 5: Update Frontend

### Login Component Changes

**Before**:
```javascript
// Old: Separate login endpoints
const staffLogin = async (email, password) => {
  const response = await fetch('/api/auth/staff-login', {...});
  return response.json();
};
```

**After**:
```javascript
// New: Unified login with role selection
const unifiedLogin = async (email, password) => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();

  if (data.data.requiresRoleSelection) {
    // Show role selection UI
    return {
      requiresRoleSelection: true,
      userId: data.data.userId,
      availableRoles: data.data.availableRoles,
      userInfo: data.data
    };
  }

  // Direct login - return token
  return {
    requiresRoleSelection: false,
    token: data.data.token,
    user: data.data.user
  };
};
```

### Role Selection Component

```javascript
const selectRole = async (userId, selectedRole) => {
  const response = await fetch('/api/auth/select-role', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: userId,
      selectedRole: selectedRole
    })
  });

  const data = await response.json();
  return data.data.token;
};
```

## Phase 6: Rollback (if needed)

If you need to rollback the migration:

```bash
# Rollback to previous migration
npx prisma migrate resolve --rolled-back add_user_roles

# Or manually remove UserRole entries
DELETE FROM "UserRole";

# Then reset migrations
npx prisma migrate reset
```

## Troubleshooting

### Issue: Migration Script Fails

**Problem**: `UNIQUE constraint failed: UserRole.userId_roleId`

**Solution**: Some users may already have UserRole entries. The script is idempotent and will skip them automatically.

### Issue: Login Not Working

**Problem**: Users see "role not found" error

**Solution**: Ensure all users have been migrated. Run verification:
```javascript
const unmigrated = await prisma.user.findMany({
  where: {
    userRoles: {
      none: {}
    }
  }
});
console.log('Unmigrated users:', unmigrated.length);
```

### Issue: Role Selection Not Appearing

**Problem**: Users with multiple roles still getting direct login

**Solution**: Verify roles were assigned correctly:
```javascript
const user = await prisma.user.findUnique({
  where: { id: 'user_id' },
  include: {
    userRoles: { include: { role: true } }
  }
});
console.log(user.userRoles); // Should show multiple roles
```

## Performance Considerations

### Indexes to Add

For better query performance on the UserRole table, consider adding indexes:

```sql
CREATE INDEX idx_user_role_user_id ON "UserRole"("userId");
CREATE INDEX idx_user_role_role_id ON "UserRole"("roleId");
```

Or via Prisma schema:

```prisma
model UserRole {
  id        String   @id @default(cuid())
  userId    String
  roleId    String
  createdAt DateTime @default(now())

  user      User      @relation("UserRoles", fields: [userId], references: [id], onDelete: Cascade)
  role      RoleModel @relation("UserRoles", fields: [roleId], references: [id], onDelete: Cascade)

  @@unique([userId, roleId])
  @@index([userId])
  @@index([roleId])
}
```

## Verification Checklist

- [ ] Database migration applied successfully
- [ ] UserRole table created
- [ ] Legacy users migrated to UserRole table
- [ ] Login endpoint tested with single-role user
- [ ] Login endpoint tested with multi-role user
- [ ] Role selection endpoint tested
- [ ] API endpoints return correct responses
- [ ] Frontend updated to handle role selection
- [ ] Tokens generated with correct role
- [ ] All tests passing

## Support

If you encounter issues during migration:

1. Check error logs: `backend/logs/`
2. Review migration history: `npx prisma migrate status`
3. Verify data: Use `npx prisma studio`
4. Refer to [LOGIN_FLOW_DOCUMENTATION.md](./LOGIN_FLOW_DOCUMENTATION.md)
