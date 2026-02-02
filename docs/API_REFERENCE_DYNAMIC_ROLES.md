# Dynamic Role System - API Reference with Examples

## Complete API Documentation

### Base URL
```
http://localhost:5000/api/auth
```

---

## 1. Login Endpoint

### Overview
Unified login endpoint that fetches user roles from database. Returns direct token if single role, or requires role selection if multiple roles.

### Endpoint
```
POST /api/auth/login
```

### Request
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### Request Schema
```json
{
  "email": "string (required, email format)",
  "password": "string (required, min 6 chars)"
}
```

### Response - Single Role (Auto Login)
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "cuid123",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "STAFF",
      "organisation": {
        "id": "org123",
        "name": "Main Office",
        "code": "ORG001"
      }
    }
  }
}
```

### Response - Multiple Roles (Requires Selection)
```json
{
  "success": true,
  "message": "Multiple roles available. Please select one.",
  "data": {
    "userId": "cuid123",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "availableRoles": [
      "STAFF",
      "ORGANISATION_ADMIN"
    ],
    "requiresRoleSelection": true
  }
}
```

### Response - Error Cases
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

### Error Responses
| Status | Message | Cause |
|--------|---------|-------|
| 400 | Invalid request format | Missing email or password |
| 401 | Invalid credentials | Wrong email or password |
| 500 | Login failed | Server error |

---

## 2. Select Role Endpoint

### Overview
When user has multiple roles and needs to select one. Called after login returns `requiresRoleSelection: true`.

### Endpoint
```
POST /api/auth/select-role
```

### Request
```bash
curl -X POST http://localhost:5000/api/auth/select-role \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "cuid123",
    "selectedRole": "ORGANISATION_ADMIN"
  }'
```

### Request Schema
```json
{
  "userId": "string (required, valid user ID)",
  "selectedRole": "string (required, one of available roles)"
}
```

### Response - Success
```json
{
  "success": true,
  "message": "Role selected successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "cuid123",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "ORGANISATION_ADMIN",
      "organisation": {
        "id": "org123",
        "name": "Main Office",
        "code": "ORG001"
      }
    }
  }
}
```

### Response - Error Cases
```json
{
  "success": false,
  "message": "Selected role is not available for this user"
}
```

### Error Responses
| Status | Message | Cause |
|--------|---------|-------|
| 400 | userId and selectedRole are required | Missing parameters |
| 403 | Selected role is not available | User doesn't have this role |
| 404 | User not found | Invalid userId |
| 500 | Role selection failed | Server error |

---

## 3. Get User Roles Endpoint

### Overview
Retrieve all roles assigned to a specific user.

### Endpoint
```
GET /api/auth/user-roles/:userId
```

### Request
```bash
curl http://localhost:5000/api/auth/user-roles/cuid123
```

### Response - Success
```json
{
  "success": true,
  "data": {
    "userId": "cuid123",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "roles": [
      {
        "id": "role123",
        "name": "STAFF",
        "description": "Staff member with access to queue management"
      },
      {
        "id": "role456",
        "name": "ORGANISATION_ADMIN",
        "description": "Organisation administrator"
      }
    ],
    "primaryRole": "STAFF"
  }
}
```

### Response - Single Role User
```json
{
  "success": true,
  "data": {
    "userId": "cuid123",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "roles": [
      {
        "id": "role123",
        "name": "STAFF",
        "description": "Staff member with access to queue management"
      }
    ],
    "primaryRole": "STAFF"
  }
}
```

### Error Responses
| Status | Message | Cause |
|--------|---------|-------|
| 404 | User not found | Invalid userId |
| 500 | Failed to fetch user roles | Server error |

---

## 4. Assign Role to User Endpoint

### Overview
Assign an additional role to a user. The user can now login with either role.

### Endpoint
```
POST /api/auth/assign-role
```

### Request
```bash
curl -X POST http://localhost:5000/api/auth/assign-role \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "cuid123",
    "roleId": "role456"
  }'
```

### Request Schema
```json
{
  "userId": "string (required, valid user ID)",
  "roleId": "string (required, valid role ID)"
}
```

### Response - Success
```json
{
  "success": true,
  "message": "Role assigned to user successfully",
  "data": {
    "userRole": {
      "userId": "cuid123",
      "roleId": "role456",
      "roleName": "ORGANISATION_ADMIN"
    },
    "userRoles": [
      "STAFF",
      "ORGANISATION_ADMIN"
    ]
  }
}
```

### Response - Error Cases
```json
{
  "success": false,
  "message": "User already has this role"
}
```

### Error Responses
| Status | Message | Cause |
|--------|---------|-------|
| 400 | userId and roleId are required | Missing parameters |
| 400 | User already has this role | Duplicate assignment |
| 404 | User not found | Invalid userId |
| 404 | Role not found | Invalid roleId |
| 500 | Failed to assign role | Server error |

---

## 5. Remove Role from User Endpoint

### Overview
Remove a role from a user. If user has only one role, this will fail (user must have at least one role).

### Endpoint
```
POST /api/auth/remove-role
```

### Request
```bash
curl -X POST http://localhost:5000/api/auth/remove-role \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "cuid123",
    "roleId": "role456"
  }'
```

### Request Schema
```json
{
  "userId": "string (required, valid user ID)",
  "roleId": "string (required, valid role ID)"
}
```

### Response - Success
```json
{
  "success": true,
  "message": "Role removed from user successfully"
}
```

### Response - Error Cases
```json
{
  "success": false,
  "message": "User does not have this role"
}
```

### Error Responses
| Status | Message | Cause |
|--------|---------|-------|
| 400 | userId and roleId are required | Missing parameters |
| 404 | User does not have this role | Role not assigned |
| 500 | Failed to remove role | Server error |

---

## Authentication Flow Examples

### Scenario 1: User with Single Role

```bash
# Step 1: Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"staff@example.com","password":"pass123"}'

# Response: Direct token (no role selection needed)
# {
#   "success": true,
#   "message": "Login successful",
#   "data": {
#     "token": "...",
#     "user": { "role": "STAFF" }
#   }
# }

# Step 2: Use token for authenticated requests
curl -H "Authorization: Bearer <token>" http://localhost:5000/api/queues
```

### Scenario 2: User with Multiple Roles

```bash
# Step 1: Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"pass123"}'

# Response: Role selection required
# {
#   "success": true,
#   "message": "Multiple roles available. Please select one.",
#   "data": {
#     "userId": "cuid123",
#     "availableRoles": ["STAFF", "ORGANISATION_ADMIN"],
#     "requiresRoleSelection": true
#   }
# }

# Step 2: Select desired role
curl -X POST http://localhost:5000/api/auth/select-role \
  -H "Content-Type: application/json" \
  -d '{
    "userId":"cuid123",
    "selectedRole":"ORGANISATION_ADMIN"
  }'

# Response: Token with selected role
# {
#   "success": true,
#   "message": "Role selected successfully",
#   "data": {
#     "token": "...",
#     "user": { "role": "ORGANISATION_ADMIN" }
#   }
# }

# Step 3: Use token for authenticated requests
curl -H "Authorization: Bearer <token>" http://localhost:5000/api/analytics
```

### Scenario 3: Admin Assigning Multiple Roles

```bash
# Step 1: Get role IDs
curl http://localhost:5000/api/roles
# Response shows all available roles

# Step 2: Assign STAFF role
curl -X POST http://localhost:5000/api/auth/assign-role \
  -H "Content-Type: application/json" \
  -d '{
    "userId":"user_id",
    "roleId":"staff_role_id"
  }'

# Step 3: Assign ORGANISATION_ADMIN role
curl -X POST http://localhost:5000/api/auth/assign-role \
  -H "Content-Type: application/json" \
  -d '{
    "userId":"user_id",
    "roleId":"admin_role_id"
  }'

# Step 4: Verify roles assigned
curl http://localhost:5000/api/auth/user-roles/user_id
```

---

## Legacy Endpoints (Still Available)

These endpoints are maintained for backward compatibility:

```bash
# Staff Login
POST /api/auth/staff-login
Body: { "employeeId": "email@example.com", "password": "pass" }

# Admin Login
POST /api/auth/admin-login
Body: { "email": "admin@example.com", "password": "pass" }

# Super Admin Login
POST /api/auth/super-admin-login
Body: { "email": "superadmin@example.com", "password": "pass" }
```

---

## Available Roles

These are the standard roles in the system:

| Role Name | Description |
|-----------|-------------|
| `USER` | Basic user (default for new registrations) |
| `STAFF` | Staff member managing queues |
| `ORGANISATION_ADMIN` | Organisation administrator |
| `SUPER_ADMIN` | System super administrator |

---

## Token Structure

The JWT token contains:

```json
{
  "id": "user_id",
  "role": "STAFF",
  "organisationId": "org_id",
  "iat": 1234567890,
  "exp": 1234571490
}
```

The `role` field indicates which role the user logged in with.

---

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created (resource created) |
| 400 | Bad request (invalid data) |
| 401 | Unauthorized (invalid credentials) |
| 403 | Forbidden (not allowed) |
| 404 | Not found (resource doesn't exist) |
| 500 | Server error |

---

## Common Response Format

All responses follow this format:

**Success:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "message": "Error description"
}
```

---

## Rate Limiting

The login endpoint has built-in rate limiting:
- Max 5 login attempts per IP per 15 minutes
- Exceeding limit returns `429 Too Many Requests`

---

## CORS Headers

All endpoints support CORS. Include appropriate headers:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

---

## Postman Collection

Import this into Postman:

```json
{
  "info": {
    "name": "Dynamic Role Auth API",
    "version": "1.0.0"
  },
  "item": [
    {
      "name": "Login",
      "request": {
        "method": "POST",
        "url": "http://localhost:5000/api/auth/login",
        "body": {
          "mode": "raw",
          "raw": "{\"email\":\"user@example.com\",\"password\":\"pass123\"}"
        }
      }
    }
  ]
}
```

---

## Testing with cURL

### Windows (PowerShell)
```powershell
$body = @{
    email = "user@example.com"
    password = "pass123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
    -Method Post `
    -Headers @{"Content-Type"="application/json"} `
    -Body $body
```

### Linux/macOS (Bash)
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "pass123"
  }' | jq
```

---

## Rate Limiting Details

```
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 4
X-RateLimit-Reset: 1609459200
```

If limit exceeded:
```json
{
  "success": false,
  "message": "Too many login attempts. Please try again later."
}
```
