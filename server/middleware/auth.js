const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * protect - Authentication Middleware (PRD Section 8.1)
 *
 * Reads Bearer token from Authorization header,
 * verifies it, and attaches decoded user to req.user.
 */
const protect = async (req, res, next) => {
  let token;

  // Check for token in Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.',
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user from DB to get latest status (in case admin suspended them)
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User belonging to this token no longer exists.',
      });
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token.',
    });
  }
};

/**
 * authorizeRoles - Authorization Middleware Factory (PRD Section 8.2)
 *
 * Takes a list of permitted roles and returns middleware
 * that checks if req.user.role is in the list.
 *
 * Usage: authorizeRoles('superadmin', 'vendor')
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this resource.',
      });
    }
    next();
  };
};

/**
 * checkAccountStatus - Status Middleware (PRD Section 8.3)
 *
 * Ensures user account is 'active' before granting access.
 * Used after protect middleware.
 */
const checkAccountStatus = (req, res, next) => {
  if (req.user.status === 'pending') {
    return res.status(403).json({
      success: false,
      message: 'Your account is awaiting admin approval.',
    });
  }

  if (req.user.status === 'suspended') {
    return res.status(403).json({
      success: false,
      message: 'Your account has been suspended.',
    });
  }

  // status is 'active'
  next();
};

module.exports = { protect, authorizeRoles, checkAccountStatus };
