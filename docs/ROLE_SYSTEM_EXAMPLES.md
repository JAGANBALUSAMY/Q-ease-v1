# Dynamic Role System - Implementation Examples

## Quick Start Examples

### Example 1: Setting Up Users with Multiple Roles

```javascript
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setupUserWithMultipleRoles() {
  // Create a user
  const user = await prisma.user.create({
    data: {
      email: 'john.doe@company.com',
      password: hashedPassword,
      firstName: 'John',
      lastName: 'Doe',
      phoneNumber: '+1234567890',
      roleId: staffRoleId, // Primary role
      isActive: true
    }
  });

  // Get role IDs
  const staffRole = await prisma.roleModel.findUnique({
    where: { name: 'STAFF' }
  });

  const adminRole = await prisma.roleModel.findUnique({
    where: { name: 'ORGANISATION_ADMIN' }
  });

  // Assign both roles
  await prisma.userRole.createMany({
    data: [
      { userId: user.id, roleId: staffRole.id },
      { userId: user.id, roleId: adminRole.id }
    ]
  });

  console.log('✅ User created with STAFF and ORGANISATION_ADMIN roles');
  return user;
}
```

### Example 2: Frontend - Unified Login Flow

```javascript
// src/services/authService.js

class AuthService {
  async login(email, password) {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message);
      }

      // Check if role selection is needed
      if (data.data.requiresRoleSelection) {
        return {
          type: 'ROLE_SELECTION_REQUIRED',
          userId: data.data.userId,
          userInfo: {
            email: data.data.email,
            firstName: data.data.firstName,
            lastName: data.data.lastName
          },
          availableRoles: data.data.availableRoles
        };
      }

      // Direct login - single role
      this.storeToken(data.data.token);
      return {
        type: 'LOGIN_SUCCESS',
        user: data.data.user,
        token: data.data.token
      };
    } catch (error) {
      return {
        type: 'ERROR',
        message: error.message
      };
    }
  }

  async selectRole(userId, selectedRole) {
    try {
      const response = await fetch('/api/auth/select-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          selectedRole
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message);
      }

      this.storeToken(data.data.token);
      return {
        type: 'LOGIN_SUCCESS',
        user: data.data.user,
        token: data.data.token
      };
    } catch (error) {
      return {
        type: 'ERROR',
        message: error.message
      };
    }
  }

  storeToken(token) {
    localStorage.setItem('auth_token', token);
  }

  getToken() {
    return localStorage.getItem('auth_token');
  }

  logout() {
    localStorage.removeItem('auth_token');
  }
}

export default new AuthService();
```

### Example 3: React Component - Login with Role Selection

```javascript
// src/components/LoginForm.jsx
import React, { useState } from 'react';
import authService from '../services/authService';

export default function LoginForm({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [requiresRoleSelection, setRequiresRoleSelection] = useState(false);
  const [selectedRoleData, setSelectedRoleData] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await authService.login(email, password);

    if (result.type === 'ROLE_SELECTION_REQUIRED') {
      // Show role selection UI
      setSelectedRoleData(result);
      setRequiresRoleSelection(true);
    } else if (result.type === 'LOGIN_SUCCESS') {
      // Direct login successful
      onLoginSuccess(result.user);
    } else if (result.type === 'ERROR') {
      setError(result.message);
    }

    setLoading(false);
  };

  const handleRoleSelect = async (selectedRole) => {
    setLoading(true);
    setError('');

    const result = await authService.selectRole(
      selectedRoleData.userId,
      selectedRole
    );

    if (result.type === 'LOGIN_SUCCESS') {
      onLoginSuccess(result.user);
    } else if (result.type === 'ERROR') {
      setError(result.message);
    }

    setLoading(false);
  };

  if (requiresRoleSelection) {
    return (
      <div className="role-selection-container">
        <h2>Select Your Role</h2>
        <p>
          Welcome, {selectedRoleData.userInfo.firstName}{' '}
          {selectedRoleData.userInfo.lastName}
        </p>
        <p>You have multiple roles. Please select one to continue:</p>

        <div className="role-buttons">
          {selectedRoleData.availableRoles.map((role) => (
            <button
              key={role}
              onClick={() => handleRoleSelect(role)}
              disabled={loading}
              className="role-button"
            >
              {role === 'ORGANISATION_ADMIN' && '🔧'}
              {role === 'STAFF' && '👤'}
              {role === 'USER' && '👥'}
              {role === 'SUPER_ADMIN' && '👑'}
              <span>{role}</span>
            </button>
          ))}
        </div>

        {error && <div className="error-message">{error}</div>}

        <button
          onClick={() => {
            setRequiresRoleSelection(false);
            setEmail('');
            setPassword('');
          }}
          className="back-button"
        >
          Back to Login
        </button>
      </div>
    );
  }

  return (
    <div className="login-form">
      <h1>Login</h1>
      <form onSubmit={handleLogin}>
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        {error && <div className="error-message">{error}</div>}

        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}
```

### Example 4: Admin Panel - Manage User Roles

```javascript
// src/components/UserRoleManagement.jsx
import React, { useState, useEffect } from 'react';

export default function UserRoleManagement({ userId }) {
  const [userRoles, setUserRoles] = useState([]);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUserRoles();
    fetchAvailableRoles();
  }, [userId]);

  const fetchUserRoles = async () => {
    try {
      const response = await fetch(`/api/auth/user-roles/${userId}`);
      const data = await response.json();
      if (data.success) {
        setUserRoles(data.data.roles);
      }
    } catch (err) {
      setError('Failed to fetch user roles');
    }
  };

  const fetchAvailableRoles = async () => {
    try {
      const response = await fetch('/api/roles');
      const data = await response.json();
      if (data.success) {
        setAvailableRoles(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch available roles');
    } finally {
      setLoading(false);
    }
  };

  const assignRole = async (roleId) => {
    try {
      const response = await fetch('/api/auth/assign-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, roleId })
      });

      const data = await response.json();
      if (data.success) {
        setUserRoles(data.data.userRoles);
        alert('Role assigned successfully');
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert('Failed to assign role');
    }
  };

  const removeRole = async (roleId) => {
    if (
      !window.confirm(
        'Are you sure you want to remove this role from the user?'
      )
    ) {
      return;
    }

    try {
      const response = await fetch('/api/auth/remove-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, roleId })
      });

      const data = await response.json();
      if (data.success) {
        fetchUserRoles();
        alert('Role removed successfully');
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert('Failed to remove role');
    }
  };

  if (loading) return <div>Loading...</div>;

  const unassignedRoles = availableRoles.filter(
    (role) => !userRoles.some((ur) => ur.id === role.id)
  );

  return (
    <div className="user-role-management">
      <h2>Manage User Roles</h2>

      <div className="current-roles">
        <h3>Current Roles ({userRoles.length})</h3>
        {userRoles.length === 0 ? (
          <p>User has no roles assigned</p>
        ) : (
          <ul>
            {userRoles.map((role) => (
              <li key={role.id}>
                <span>{role.name}</span>
                <button
                  onClick={() => removeRole(role.id)}
                  className="remove-btn"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {unassignedRoles.length > 0 && (
        <div className="available-roles">
          <h3>Available Roles to Assign</h3>
          <ul>
            {unassignedRoles.map((role) => (
              <li key={role.id}>
                <span>{role.name}</span>
                <button
                  onClick={() => assignRole(role.id)}
                  className="assign-btn"
                >
                  Assign
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}
    </div>
  );
}
```

### Example 5: Backend - Middleware for Role-Based Access

```javascript
// src/middleware/roleMiddleware.js

const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required roles: ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
};

module.exports = checkRole;
```

Usage in routes:

```javascript
// src/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const checkRole = require('../middleware/roleMiddleware');
const adminController = require('../controllers/adminController');

// Only ORGANISATION_ADMIN and SUPER_ADMIN can access
router.get(
  '/dashboard',
  authMiddleware,
  checkRole('ORGANISATION_ADMIN', 'SUPER_ADMIN'),
  adminController.getDashboard
);

// Only SUPER_ADMIN can access
router.delete(
  '/users/:userId',
  authMiddleware,
  checkRole('SUPER_ADMIN'),
  adminController.deleteUser
);

module.exports = router;
```

### Example 6: Batch Operations - Assign Roles to Multiple Users

```javascript
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function batchAssignRoles(userEmails, roleName) {
  try {
    const role = await prisma.roleModel.findUnique({
      where: { name: roleName }
    });

    if (!role) {
      throw new Error(`Role ${roleName} not found`);
    }

    const results = [];

    for (const email of userEmails) {
      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        results.push({ email, success: false, error: 'User not found' });
        continue;
      }

      try {
        await prisma.userRole.create({
          data: {
            userId: user.id,
            roleId: role.id
          }
        });
        results.push({ email, success: true });
      } catch (error) {
        if (error.code === 'P2002') {
          results.push({
            email,
            success: false,
            error: 'User already has this role'
          });
        } else {
          results.push({ email, success: false, error: error.message });
        }
      }
    }

    return results;
  } finally {
    await prisma.$disconnect();
  }
}

// Usage
batchAssignRoles(
  ['staff1@company.com', 'staff2@company.com'],
  'ORGANISATION_ADMIN'
).then((results) => {
  console.log('Batch assignment results:');
  results.forEach((r) => {
    const status = r.success ? '✅' : '❌';
    console.log(`${status} ${r.email}: ${r.error || 'Success'}`);
  });
});
```

## Key Takeaways

1. **Always verify roles exist** before assigning them
2. **Use the unified login** endpoint - it handles both single and multiple roles
3. **Show role selection UI** only when `requiresRoleSelection` is true
4. **Store tokens securely** - they contain the selected role
5. **Use role-based middleware** to protect admin endpoints
6. **Handle edge cases** - duplicate roles, invalid selections, missing users

## Testing Checklist

- [ ] Single role user login works
- [ ] Multiple role user gets selection prompt
- [ ] Role selection returns correct token
- [ ] Invalid role selection is rejected
- [ ] Admin can assign/remove roles
- [ ] Batch operations work correctly
- [ ] Role-based middleware enforces access control
