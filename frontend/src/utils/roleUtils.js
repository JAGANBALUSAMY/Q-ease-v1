/**
 * Centralized role definitions and helper functions for routing.
 */

export const ROLES = {
    SUPER_ADMIN: 'SUPER_ADMIN',
    ORGANISATION_ADMIN: 'ORGANISATION_ADMIN',
    STAFF: 'STAFF',
    USER: 'USER'
};

export const DASHBOARD_ROUTES = {
    [ROLES.SUPER_ADMIN]: '/super-admin/dashboard',
    [ROLES.ORGANISATION_ADMIN]: '/admin/dashboard',
    [ROLES.STAFF]: '/staff/dashboard',
    [ROLES.USER]: '/browse' // Default for customers/users
};

/**
 * Normalizes role names from various sources (DB, older code, etc.)
 */
export const normalizeRole = (role) => {
    if (!role) return ROLES.USER;
    const r = role.toUpperCase();
    if (r === 'ADMIN') return ROLES.ORGANISATION_ADMIN;
    if (r === 'CUSTOMER' || r === 'USER') return ROLES.USER;
    return r;
};

/**
 * Returns the dashboard path for a given user based on their role.
 */
export const getDashboardPath = (user) => {
    if (!user) return '/';
    const role = normalizeRole(user.role || user.roleModel?.name);
    return DASHBOARD_ROUTES[role] || '/';
};

