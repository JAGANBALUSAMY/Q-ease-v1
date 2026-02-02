/**
 * Centralized role definitions and helper functions for routing.
 */

export const ROLES = {
    SUPER_ADMIN: 'SUPER_ADMIN',
    ORGANISATION_ADMIN: 'ORGANISATION_ADMIN', // Often referred to as ADMIN in UI
    STAFF: 'STAFF',
    USER: 'USER', // Also 'customer' in some contexts
};

export const DASHBOARD_ROUTES = {
    [ROLES.SUPER_ADMIN]: '/super-admin/dashboard',
    [ROLES.ORGANISATION_ADMIN]: '/admin/dashboard',
    [ROLES.STAFF]: '/staff/dashboard',
    [ROLES.USER]: '/',
};

/**
 * Returns the dashboard path for a given user based on their role.
 * @param {Object} user - The user object from auth context.
 * @returns {string} The absolute path to the user's dashboard.
 */
export const getDashboardPath = (user) => {
    if (!user || !user.role) {
        return '/';
    }

    // Normalize role to handle potential case sensitivity or mapping issues
    const role = user.role.toUpperCase();

    // Handle potential 'ADMIN' alias for ORGANISATION_ADMIN if it exists in DB
    if (role === 'ADMIN') {
        return DASHBOARD_ROUTES[ROLES.ORGANISATION_ADMIN];
    }

    // Handle 'customer' alias
    if (role === 'CUSTOMER') {
        return DASHBOARD_ROUTES[ROLES.USER];
    }

    return DASHBOARD_ROUTES[role] || '/';
};
