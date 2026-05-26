const jwt = require('jsonwebtoken');

/**
 * Generate a JWT token with role-based expiry.
 * Customer: 7 days | Vendor & Admin: 1 day
 *
 * @param {string} id - User's MongoDB _id
 * @param {string} role - User's role (customer, vendor, superadmin)
 * @param {string} status - User's account status
 * @returns {string} Signed JWT token
 */
const generateToken = (id, role, status) => {
  const expiresIn = role === 'customer' ? '7d' : '1d';

  return jwt.sign(
    { id, role, status },
    process.env.JWT_SECRET,
    { expiresIn }
  );
};

module.exports = generateToken;
