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
 * PATCH /api/auth/profile — Update user profile (name, businessName)
 */
router.patch('/profile', protect, checkAccountStatus, async (req, res, next) => {
  try {
    const { name, businessName } = req.body;
    const User = require('../models/User');
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    if (name) user.name = name.trim();
    if (businessName !== undefined && user.role === 'vendor') user.businessName = businessName.trim();
    await user.save();
    res.status(200).json({ success: true, message: 'Profile updated.', user });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/auth/change-password — Change password (authenticated)
 * Body: { currentPassword, newPassword }
 */
router.patch('/change-password', protect, checkAccountStatus, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new password are required.' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters.' });
    }

    const User = require('../models/User');
    const user = await User.findById(req.user._id).select('+password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
    }

    user.password = newPassword;
    await user.save();
    res.status(200).json({ success: true, message: 'Password changed successfully.' });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/change-email/request — Send OTP to current email before changing
 * Body: { newEmail }
 */
router.post('/change-email/request', protect, checkAccountStatus, async (req, res, next) => {
  try {
    const { newEmail } = req.body;
    if (!newEmail) return res.status(400).json({ success: false, message: 'New email is required.' });

    const User = require('../models/User');
    const sendOtpMail = require('../utils/sendOtpMail');

    // Check if newEmail is already taken
    const exists = await User.findOne({ email: newEmail.toLowerCase() });
    if (exists) return res.status(400).json({ success: false, message: 'This email is already in use.' });

    const user = await User.findById(req.user._id).select('+otp +otpExpiry');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    // Send OTP to the CURRENT email for verification
    await sendOtpMail(user.email, otp, 'email-change');
    res.status(200).json({ success: true, message: 'OTP sent to your current email.' });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/change-email/confirm — Verify OTP and update email
 * Body: { otp, newEmail }
 */
router.post('/change-email/confirm', protect, checkAccountStatus, async (req, res, next) => {
  try {
    const { otp, newEmail } = req.body;
    if (!otp || !newEmail) return res.status(400).json({ success: false, message: 'OTP and new email are required.' });

    const User = require('../models/User');
    const user = await User.findById(req.user._id).select('+otp +otpExpiry');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    if (!user.otp || user.otp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP.' });
    }
    if (!user.otpExpiry || user.otpExpiry < new Date()) {
      return res.status(400).json({ success: false, message: 'OTP has expired.' });
    }

    // Check new email isn't taken
    const exists = await User.findOne({ email: newEmail.toLowerCase() });
    if (exists) return res.status(400).json({ success: false, message: 'This email is already in use.' });

    user.email = newEmail.toLowerCase();
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({ success: true, message: 'Email updated successfully.', user });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/forgot-password — Send OTP for password reset (public)
 * Body: { email }
 */
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required.' });

    const User = require('../models/User');
    const sendOtpMail = require('../utils/sendOtpMail');

    const user = await User.findOne({ email: email.toLowerCase() }).select('+otp +otpExpiry');
    if (!user) return res.status(404).json({ success: false, message: 'No account found with this email.' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    await sendOtpMail(email, otp, 'forgot-password');
    res.status(200).json({ success: true, message: 'OTP sent to your email.' });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/reset-password — Reset password after OTP verification (public)
 * Body: { email, otp, newPassword }
 */
router.post('/reset-password', async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email, OTP, and new password are required.' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
    }

    const User = require('../models/User');
    const user = await User.findOne({ email: email.toLowerCase() }).select('+otp +otpExpiry +password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    if (!user.otp || user.otp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP.' });
    }
    if (user.otp !== 'VERIFIED' && (!user.otpExpiry || user.otpExpiry < new Date())) {
      return res.status(400).json({ success: false, message: 'OTP has expired.' });
    }

    user.password = newPassword;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    res.status(200).json({ success: true, message: 'Password reset successfully. You can now log in.' });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/auth/wishlist — Get current user's wishlist
 */
router.get('/wishlist', protect, checkAccountStatus, async (req, res, next) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.user._id).populate('wishlist');
    res.status(200).json({ success: true, wishlist: user.wishlist });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/wishlist/:productId — Add product to wishlist
 */
router.post('/wishlist/:productId', protect, checkAccountStatus, async (req, res, next) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.user._id);
    const pid = req.params.productId;
    if (!user.wishlist.map(String).includes(pid)) {
      user.wishlist.push(pid);
      await user.save({ validateBeforeSave: false });
    }
    res.status(200).json({ success: true, message: 'Added to wishlist.', wishlist: user.wishlist });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/auth/wishlist/:productId — Remove product from wishlist
 */
router.delete('/wishlist/:productId', protect, checkAccountStatus, async (req, res, next) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.user._id);
    user.wishlist = user.wishlist.filter((id) => id.toString() !== req.params.productId);
    await user.save({ validateBeforeSave: false });
    res.status(200).json({ success: true, message: 'Removed from wishlist.', wishlist: user.wishlist });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/logout — Logout
 */
router.post('/logout', protect, logoutUser);

module.exports = router;

