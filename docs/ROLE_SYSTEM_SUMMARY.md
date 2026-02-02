# Dynamic Role-Based Login System - Implementation Summary

## What Was Changed

### 1. Database Schema (`backend/prisma/schema.prisma`)

**Added:**
- New `UserRole` junction table to support many-to-many relationship between users and roles
- Updated `User` model with `userRoles` relation
- Updated `RoleModel` with `userRoles` relation

**Key Features:**
- Unique constraint on `[userId, roleId]` to prevent duplicate assignments
- Cascade delete for referential integrity
- Supports unlimited roles per user

### 2. Authentication Controller (`backend/src/controllers/authController.js`)

**Updated:**
- `loginUser()` - Now fetches roles from database and provides role selection if needed

**Added:**
- `selectRole()` - Allows users to select their role when multiple are available
- `assignRoleToUser()` - Assign a role to a user
- `removeRoleFromUser()` - Remove a role from a user
- `getUserRoles()` - Fetch all roles for a specific user

### 3. Auth Routes (`backend/src/routes/authRoutes.js`)

**Added new endpoints:**
- `POST /api/auth/select-role` - Role selection after login
- `GET /api/auth/user-roles/:userId` - Get all roles for a user
- `POST /api/auth/assign-role` - Assign role (admin function)
- `POST /api/auth/remove-role` - Remove role (admin function)

**Updated:**
- `/api/auth/login` - Now returns role selection prompt if multiple roles exist

## How It Works

### Login Flow for Single-Role User

```
User enters email & password
         ↓
POST /api/auth/login
         ↓
Query database for user + all roles (UserRole table)
         ↓
Find 1 role
         ↓
Generate JWT with that role
         ↓
Return token + user data
         ↓
Direct login - no further action needed
```

### Login Flow for Multi-Role User

```
User enters email & password
         ↓
POST /api/auth/login
         ↓
Query database for user + all roles (UserRole table)
         ↓
Find multiple roles
         ↓
Return list of available roles + userId
         ↓
Frontend shows role selection UI
         ↓
User clicks desired role
         ↓
POST /api/auth/select-role
         ↓
Verify selected role belongs to user
         ↓
Generate JWT with selected role
         ↓
Return token + user data
         ↓
Login complete
```

## API Endpoints Reference

### 1. Login (Updated)
```
POST /api/auth/login
Body: { "email": "user@example.com", "password": "pass123" }

Response (Single Role):
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "jwt_token",
    "user": { ... }
  }
}

Response (Multiple Roles):
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

### 2. Select Role (New)
```
POST /api/auth/select-role
Body: { "userId": "user_id", "selectedRole": "ORGANISATION_ADMIN" }

Response:
{
  "success": true,
  "message": "Role selected successfully",
  "data": {
    "token": "jwt_token_with_selected_role",
    "user": { ... }
  }
}
```

### 3. Get User Roles (New)
```
GET /api/auth/user-roles/:userId

Response:
{
  "success": true,
  "data": {
    "userId": "user_id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "roles": [
      { "id": "role_id_1", "name": "STAFF", "description": "..." },
      { "id": "role_id_2", "name": "ORGANISATION_ADMIN", "description": "..." }
    ],
    "primaryRole": "STAFF"
  }
}
```

### 4. Assign Role (New)
```
POST /api/auth/assign-role
Body: { "userId": "user_id", "roleId": "role_id" }

Response:
{
  "success": true,
  "message": "Role assigned to user successfully",
  "data": {
    "userRole": { "userId": "...", "roleId": "...", "roleName": "..." },
    "userRoles": ["STAFF", "ORGANISATION_ADMIN"]
  }
}
```

### 5. Remove Role (New)
```
POST /api/auth/remove-role
Body: { "userId": "user_id", "roleId": "role_id" }

Response:
{
  "success": true,
  "message": "Role removed from user successfully"
}
```

## Next Steps

### 1. Apply Database Migration
```bash
cd backend
npx prisma migrate dev --name add_user_roles
```

### 2. Migrate Existing Users
Run the migration script to populate UserRole table with existing user roles:
```bash
node scripts/migrateLegacyRoles.js
```

### 3. Update Frontend

Handle the new login flow in your UI:
- Show role selection modal when `requiresRoleSelection` is true
- Display available roles with clear labeling
- Allow user to select desired role
- Handle errors gracefully

### 4. Test the System

Test scenarios:
- Login as single-role user → should get direct token
- Login as multi-role user → should get role selection
- Select different roles → should get appropriate tokens
- Assign/remove roles via API → should update user roles

## File Changes Summary

| File | Change | Type |
|------|--------|------|
| `backend/prisma/schema.prisma` | Added UserRole model | Schema Update |
| `backend/src/controllers/authController.js` | Enhanced loginUser + added 4 new functions | Code Update |
| `backend/src/routes/authRoutes.js` | Added 4 new routes | Routes Update |

## Documentation Files Created

1. **LOGIN_FLOW_DOCUMENTATION.md** - Complete API and flow documentation
2. **MIGRATION_GUIDE_ROLES.md** - Step-by-step migration guide for existing data
3. **ROLE_SYSTEM_EXAMPLES.md** - Practical code examples and implementations

## Key Features

✅ **Backward Compatible** - Old endpoints still work  
✅ **Database-Driven** - Roles fetched from database, not hardcoded  
✅ **Multi-Role Support** - Users can have multiple roles  
✅ **Role Selection UI** - Users choose role when multiple available  
✅ **Admin Management** - Easy role assignment/removal  
✅ **Automatic Migration** - Tools provided for existing data  

## Important Notes

1. **JWT Token Role**: The token contains the selected role, used for authorization checks
2. **Default Fallback**: If no UserRole entries exist, falls back to user's primary `roleId`
3. **Unique Constraints**: Prevents duplicate role assignments automatically
4. **Cascade Delete**: Removing user or role automatically removes relationships

## Support & Troubleshooting

Refer to:
- **LOGIN_FLOW_DOCUMENTATION.md** for API details and troubleshooting
- **MIGRATION_GUIDE_ROLES.md** for migration issues
- **ROLE_SYSTEM_EXAMPLES.md** for implementation help

---

**Status**: Ready for implementation  
**Database Migration**: Required  
**Frontend Updates**: Recommended  
**Backward Compatibility**: Maintained
