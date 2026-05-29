const express = require('express');
const { body } = require('express-validator');
const {
  registerCustomer,
  registerVendor,
  loginUser,
  loginAdmin,
  getMe,
  logoutUser,
} = require('../controllers/authController');
const { protect, checkAccountStatus } = require('../middleware/auth');
const { loginLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// ============================================================
// PUBLIC ROUTES
// ============================================================

/**
 * POST /api/auth/register — Customer Registration
 */
router.post(
  '/register',
  [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Name is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters'),
    body('email')
      .trim()
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/\d/)
      .withMessage('Password must contain at least one number')
      .matches(/[a-zA-Z]/)
      .withMessage('Password must contain at least one letter'),
  ],
  registerCustomer
);

/**
 * POST /api/auth/vendor/register — Vendor Registration (pending approval)
 */
router.post(
  '/vendor/register',
  [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Owner full name is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters'),
    body('email')
      .trim()
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/\d/)
      .withMessage('Password must contain at least one number')
      .matches(/[a-zA-Z]/)
      .withMessage('Password must contain at least one letter'),
    body('businessName')
      .trim()
      .notEmpty()
      .withMessage('Business name is required')
      .isLength({ max: 200 })
      .withMessage('Business name cannot exceed 200 characters'),
    body('businessDescription')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Business description cannot exceed 1000 characters'),
  ],
  registerVendor
);

/**
 * POST /api/auth/login — Login for Customer & Vendor
 * Rate limited: 10 requests per 15 minutes per IP
 */
router.post(
  '/login',
  loginLimiter,
  [
    body('email')
      .trim()
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  loginUser
);

/**
 * POST /api/auth/admin/login — Super Admin Login Only
 * Rate limited: 10 requests per 15 minutes per IP
 */
router.post(
  '/admin/login',
  loginLimiter,
  [
    body('email')
      .trim()
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  loginAdmin
);

// ============================================================
// PROTECTED ROUTES
// ============================================================

/**
 * GET /api/auth/me — Get current user profile
 */
router.get('/me', protect, checkAccountStatus, getMe);

/**
 * POST /api/auth/logout — Logout
 */
router.post('/logout', protect, logoutUser);

module.exports = router;
