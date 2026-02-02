# Dynamic Role-Based Login Flow Documentation

## Overview

The login system has been updated to support dynamic role assignment and selection. Users can now have multiple roles in the system, and the login process will:
1. Fetch roles from the database based on the email provided
2. If a user has only one role, log them in directly
3. If a user has multiple roles, present them with a role selection screen

## Database Changes

### New UserRole Junction Table

A new `UserRole` model has been added to support many-to-many relationships between users and roles:

```prisma
model UserRole {
  id        String   @id @default(cuid())
  userId    String
  roleId    String
  createdAt DateTime @default(now())

  user      User      @relation("UserRoles", fields: [userId], references: [id], onDelete: Cascade)
  role      RoleModel @relation("UserRoles", fields: [roleId], references: [id], onDelete: Cascade)

  @@unique([userId, roleId])
}
```

### Updated Models

- **User Model**: Added `userRoles` relation to access multiple roles
- **RoleModel**: Added `userRoles` relation to access users for each role

## API Endpoints

### 1. Login Endpoint (Updated)
**POST** `/api/auth/login`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response - Single Role (Auto-login):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "STAFF",
      "organisation": { ... }
    }
  }
}
```

**Response - Multiple Roles (Requires Selection):**
```json
{
  "success": true,
  "message": "Multiple roles available. Please select one.",
  "data": {
    "userId": "user_id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "availableRoles": ["STAFF", "ORGANISATION_ADMIN"],
    "requiresRoleSelection": true
  }
}
```

### 2. Select Role Endpoint (New)
**POST** `/api/auth/select-role`

Use this endpoint when the login response indicates multiple roles are available.

**Request:**
```json
{
  "userId": "user_id",
  "selectedRole": "ORGANISATION_ADMIN"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Role selected successfully",
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "ORGANISATION_ADMIN",
      "organisation": { ... }
    }
  }
}
```

### 3. Get User Roles Endpoint (New)
**GET** `/api/auth/user-roles/:userId`

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "user_id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "roles": [
      {
        "id": "role_id_1",
        "name": "STAFF",
        "description": "Staff member"
      },
      {
        "id": "role_id_2",
        "name": "ORGANISATION_ADMIN",
        "description": "Organisation administrator"
      }
    ],
    "primaryRole": "STAFF"
  }
}
```

### 4. Assign Role to User Endpoint (New)
**POST** `/api/auth/assign-role`

**Request:**
```json
{
  "userId": "user_id",
  "roleId": "role_id"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Role assigned to user successfully",
  "data": {
    "userRole": {
      "userId": "user_id",
      "roleId": "role_id",
      "roleName": "ORGANISATION_ADMIN"
    },
    "userRoles": ["STAFF", "ORGANISATION_ADMIN"]
  }
}
```

### 5. Remove Role from User Endpoint (New)
**POST** `/api/auth/remove-role`

**Request:**
```json
{
  "userId": "user_id",
  "roleId": "role_id"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Role removed from user successfully"
}
```

## Login Flow Diagram

### Single Role User
```
User enters email & password
         ↓
Validate credentials
         ↓
Fetch all user roles from database
         ↓
Only 1 role found
         ↓
Generate token with role
         ↓
Return token → Direct Login
```

### Multiple Role User
```
User enters email & password
         ↓
Validate credentials
         ↓
Fetch all user roles from database
         ↓
Multiple roles found
         ↓
Return user info + available roles
         ↓
Frontend displays role selection
         ↓
User selects desired role
         ↓
Frontend sends /select-role request
         ↓
Generate token with selected role
         ↓
Return token → Login with chosen role
```

## Frontend Implementation Example

### Step 1: Initial Login
```javascript
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: userEmail,
    password: userPassword
  })
});

const data = await response.json();

if (data.data.requiresRoleSelection) {
  // Show role selection screen
  displayRoleSelectionModal(data.data.availableRoles, data.data.userId);
} else {
  // Direct login
  storeToken(data.data.token);
  redirectToDashboard(data.data.user.role);
}
```

### Step 2: Role Selection (if needed)
```javascript
const selectRoleResponse = await fetch('/api/auth/select-role', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: userId,
    selectedRole: selectedRole
  })
});

const roleData = await selectRoleResponse.json();
storeToken(roleData.data.token);
redirectToDashboard(roleData.data.user.role);
```

## Database Migration

To apply the schema changes, run:

```bash
cd backend
npx prisma migrate dev --name add_user_roles
```

This will:
1. Create the `UserRole` table
2. Generate Prisma client types
3. Update your database schema

## Backward Compatibility

### Legacy Endpoints

The original login endpoints remain functional for backward compatibility:
- `POST /api/auth/staff-login`
- `POST /api/auth/admin-login`
- `POST /api/auth/super-admin-login`

However, the new unified `/api/auth/login` endpoint is recommended.

### Default Role

If a user has no entries in the `UserRole` table (legacy data), the system will fall back to the user's `roleId` field.

## Role Assignment

### Admin/Super Admin Assignment

Admin and Super Admin users can assign roles to other users via:
```
POST /api/auth/assign-role
{
  "userId": "target_user_id",
  "roleId": "role_to_assign"
}
```

### Programmatic Assignment

```javascript
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Assign ORGANISATION_ADMIN role to a user
await prisma.userRole.create({
  data: {
    userId: "user_id",
    roleId: "admin_role_id"
  }
});
```

## Edge Cases

1. **User with no roles**: Falls back to primary `roleId`
2. **Invalid role selection**: Returns 403 error
3. **Duplicate role assignment**: Returns 400 error with duplicate prevention
4. **User not found**: Returns 404 error
5. **Role not found**: Returns 404 error when assigning

## Security Considerations

1. **JWT Token**: Contains the selected role - ensure proper validation in middleware
2. **Role Validation**: Selected role is verified against user's available roles
3. **Cascade Delete**: Removing a user or role automatically removes UserRole entries
4. **Unique Constraint**: Prevents duplicate role assignments via `@@unique([userId, roleId])`

## Testing

### Test Scenario 1: Single Role Login
1. Create user with only STAFF role
2. Login with email/password
3. Should receive token directly (no role selection needed)

### Test Scenario 2: Multiple Roles
1. Create user with STAFF role
2. Assign ORGANISATION_ADMIN role via assign-role endpoint
3. Login with email/password
4. Should receive role selection prompt
5. Select ORGANISATION_ADMIN
6. Should receive token with ORGANISATION_ADMIN role

### Test Scenario 3: Role Management
1. Get user roles via GET endpoint
2. Assign new role
3. Remove role
4. Verify role list updated correctly

## Troubleshooting

### Issue: Users seeing empty role list
**Solution**: Ensure UserRole entries exist. Migrate legacy users by:
```javascript
// For each legacy user, create UserRole entries
await prisma.userRole.create({
  data: {
    userId: user.id,
    roleId: user.roleId
  }
});
```

### Issue: Login still using old role
**Solution**: Frontend may be caching old user data. Clear cache and retry login.

### Issue: Role selection not appearing
**Solution**: Verify user has multiple role entries in UserRole table. Check with GET /api/auth/user-roles/:userId
