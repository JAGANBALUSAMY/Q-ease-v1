# Dynamic Role System - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Apply Database Migration (2 minutes)

```bash
cd backend
npx prisma migrate dev --name add_user_roles
```

This will:
- Create the `UserRole` table
- Update Prisma client
- Apply changes to your database

**What to expect:**
```
✔ Prisma schema loaded from prisma/schema.prisma
✔ Database created in 0.1s

✔ Prisma Migrate created the following:

  create_user_role
  
✔ Generated Prisma Client to ./node_modules/.prisma/client in 79ms
```

### Step 2: Migrate Existing Users (1 minute)

```bash
node scripts/migrateLegacyRoles.js
```

This will:
- Populate UserRole table with existing user roles
- Show migration summary
- Report any issues

**Expected output:**
```
🔄 Starting dynamic role system migration...

📊 Found 25 total users

📋 Processing 25 users...

✅ user@example.com - Migrated with role: STAFF
✅ admin@example.com - Migrated with role: ORGANISATION_ADMIN
...

==================================================
📊 MIGRATION SUMMARY
==================================================
Total Users:             25
Successfully Migrated:   25
Skipped (Already Done):  0
Errors:                  0
Verified Valid:          25
Verified Invalid:        0
==================================================

✅ Migration completed successfully!
```

### Step 3: Test the New Login (1 minute)

**Test 1: Single Role User**

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "staff@example.com",
    "password": "password123"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "user123",
      "email": "staff@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "STAFF",
      "organisation": { ... }
    }
  }
}
```

**Test 2: Assign Additional Role & Test Multi-Role**

First, assign a second role:

```bash
curl -X POST http://localhost:5000/api/auth/assign-role \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "roleId": "admin_role_id"
  }'
```

Now login again:

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "staff@example.com",
    "password": "password123"
  }'
```

**Expected Response (Multiple Roles):**
```json
{
  "success": true,
  "message": "Multiple roles available. Please select one.",
  "data": {
    "userId": "user123",
    "email": "staff@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "availableRoles": ["STAFF", "ORGANISATION_ADMIN"],
    "requiresRoleSelection": true
  }
}
```

**Test 3: Select Role**

```bash
curl -X POST http://localhost:5000/api/auth/select-role \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "selectedRole": "ORGANISATION_ADMIN"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Role selected successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "user123",
      "email": "staff@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "ORGANISATION_ADMIN",
      "organisation": { ... }
    }
  }
}
```

### Step 4: Update Frontend (1 minute)

Modify your login component to handle role selection:

```javascript
async function handleLogin(email, password) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();

  if (data.data.requiresRoleSelection) {
    // Show role selection UI
    showRoleSelectionModal(data.data);
  } else {
    // Direct login
    localStorage.setItem('token', data.data.token);
    redirectToDashboard();
  }
}

async function selectRole(userId, role) {
  const response = await fetch('/api/auth/select-role', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, selectedRole: role })
  });

  const data = await response.json();
  localStorage.setItem('token', data.data.token);
  redirectToDashboard();
}
```

## 📋 Verify Everything Works

### Checklist

- [ ] Database migration successful
- [ ] Prisma schema updated
- [ ] `migrateLegacyRoles.js` completed without errors
- [ ] Single-role user login returns token
- [ ] Multi-role user login shows role selection
- [ ] Role selection returns token with correct role
- [ ] Frontend handles role selection UI

## 🔧 Common Commands

### View User's Current Roles

```bash
curl http://localhost:5000/api/auth/user-roles/user123
```

### Assign a Role to User

```bash
curl -X POST http://localhost:5000/api/auth/assign-role \
  -H "Content-Type: application/json" \
  -d '{"userId":"user123","roleId":"role_id"}'
```

### Remove a Role from User

```bash
curl -X POST http://localhost:5000/api/auth/remove-role \
  -H "Content-Type: application/json" \
  -d '{"userId":"user123","roleId":"role_id"}'
```

## 📚 Documentation Reference

For more details, refer to:

| Document | Purpose |
|----------|---------|
| [LOGIN_FLOW_DOCUMENTATION.md](./LOGIN_FLOW_DOCUMENTATION.md) | Complete API reference and flows |
| [MIGRATION_GUIDE_ROLES.md](./MIGRATION_GUIDE_ROLES.md) | Detailed migration steps |
| [ROLE_SYSTEM_EXAMPLES.md](./ROLE_SYSTEM_EXAMPLES.md) | Code examples and implementations |
| [ROLE_SYSTEM_SUMMARY.md](./ROLE_SYSTEM_SUMMARY.md) | Overview of changes |

## ⚠️ Troubleshooting

### Issue: Migration fails with "table already exists"

**Solution:** The migration has already been run. Skip this step.

### Issue: migrateLegacyRoles.js shows errors

**Solution:** Check the error message:
- If "user has no roles" → assign primary role first
- If "duplicate role" → user already has that role (normal, will be skipped)

### Issue: Login still returns single role even after assigning second role

**Solution:** Restart the backend server to clear any cached data:
```bash
# Kill the process and restart
npm run dev
```

### Issue: Frontend not showing role selection

**Solution:** Check:
1. The response has `requiresRoleSelection: true`
2. Frontend is checking this flag
3. `availableRoles` contains multiple roles

## 🎯 What's Next?

1. **For Admins**: Use the role management endpoints to assign multiple roles to staff
2. **For Developers**: Update frontend components to handle role selection
3. **For Users**: They'll see role selection only if they have multiple roles assigned

## 📞 Support

If you encounter issues:

1. Check error messages in console
2. Review the relevant documentation file
3. Verify database migration succeeded: `npx prisma migrate status`
4. Check if users have roles: `npx prisma studio` → UserRole table

---

**Status**: ✅ Ready to deploy  
**Estimated time**: 5 minutes  
**Backward compatible**: Yes
