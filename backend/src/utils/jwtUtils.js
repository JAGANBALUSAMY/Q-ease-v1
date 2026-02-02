const jwt = require('jsonwebtoken');

// Generate access token
// Accept either a payload object or positional args for compatibility.
const generateToken = (a, b, c, d) => {
  let payload = {};
  if (typeof a === 'object' && a !== null && !Array.isArray(a)) {
    payload = a;
  } else {
    payload = {
      userId: a,
      email: b,
      roleId: c,
      organisationId: d
    };
  }

  // Normalize claims to include `id` and `role` which the middleware expects
  const normalized = {
    id: payload.id || payload.userId || payload.user_id,
    email: payload.email,
    role: payload.role || payload.roleId || payload.role_id,
    organisationId: payload.organisationId || payload.organisation_id,
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // Expires in 24 hours
  };

  return jwt.sign(normalized, process.env.JWT_SECRET || 'secret_key');
};

// Generate refresh token
const generateRefreshToken = (userId) => {
  return jwt.sign(
    {
      userId,
      type: 'refresh',
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // Expires in 7 days
    },
    process.env.JWT_REFRESH_SECRET || 'refresh_secret'
  );
};

module.exports = {
  generateToken,
  generateRefreshToken
};