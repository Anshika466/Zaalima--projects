const express = require('express');
const User = require('../models/User');
const sendOtpMail = require('../utils/sendOtpMail');

const router = express.Router();

/**
 * Generate a random 6-digit OTP string.
 */
const generateOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

/**
 * POST /api/otp/send
 * Send an OTP to the given email.
 * Body: { email, purpose }
 *   purpose = 'register' | 'email-change' | 'forgot-password'
 * @access Public
 */
router.post('/send', async (req, res, next) => {
  try {
    const { email, purpose } = req.body;

    if (!email || !purpose) {
      return res
        .status(400)
        .json({ success: false, message: 'Email and purpose are required.' });
    }

    const otp = generateOtp();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    if (purpose === 'register') {
      // For registration: user might not exist yet. Store OTP in a temp record
      // or find an existing unverified record.
      let user = await User.findOne({ email }).select('+otp +otpExpiry');

      if (user && user.isEmailVerified) {
        return res.status(400).json({
          success: false,
          message: 'An account with this email already exists.',
        });
      }

      if (user) {
        // Update OTP on existing unverified record
        user.otp = otp;
        user.otpExpiry = otpExpiry;
        await user.save({ validateBeforeSave: false });
      } else {
        // Create a placeholder record — will be completed during registration
        // We don't create a user here; the frontend sends OTP separately
        // Store OTP in a lightweight way: use a temporary collection approach
        // Instead, we'll store the OTP keyed by email in a simpler way.
        // For simplicity, create a minimal user doc that gets completed later.
        // Actually, better approach: just store in-memory for now, or use the
        // existing user flow. Let's use a dedicated temp store.
        // SIMPLEST: Store OTP on a temp user with status 'pending-otp'
        // But this complicates things. Better: just store in-memory map.
      }

      // For registration, we use an in-memory store (see below)
      if (!user) {
        // Store in global pending OTPs map
        if (!global._pendingOtps) global._pendingOtps = {};
        global._pendingOtps[email.toLowerCase()] = { otp, otpExpiry };
      }

      await sendOtpMail(email, otp, purpose);
      return res.status(200).json({
        success: true,
        message: 'OTP sent to your email.',
      });
    }

    // For forgot-password: user must exist
    if (purpose === 'forgot-password') {
      const user = await User.findOne({ email }).select('+otp +otpExpiry');
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'No account found with this email.',
        });
      }
      user.otp = otp;
      user.otpExpiry = otpExpiry;
      await user.save({ validateBeforeSave: false });
      await sendOtpMail(email, otp, purpose);
      return res.status(200).json({
        success: true,
        message: 'OTP sent to your email.',
      });
    }

    // For email-change: user must exist (handled by protected route in authRoutes)
    if (purpose === 'email-change') {
      const user = await User.findOne({ email }).select('+otp +otpExpiry');
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found.',
        });
      }
      user.otp = otp;
      user.otpExpiry = otpExpiry;
      await user.save({ validateBeforeSave: false });
      await sendOtpMail(email, otp, purpose);
      return res.status(200).json({
        success: true,
        message: 'OTP sent to your current email.',
      });
    }

    return res
      .status(400)
      .json({ success: false, message: 'Invalid purpose.' });
  } catch (error) {
    console.error('OTP send error:', error.message);
    next(error);
  }
});

/**
 * POST /api/otp/verify
 * Verify an OTP.
 * Body: { email, otp, purpose }
 * @access Public
 */
router.post('/verify', async (req, res, next) => {
  try {
    const { email, otp, purpose } = req.body;

    if (!email || !otp || !purpose) {
      return res
        .status(400)
        .json({ success: false, message: 'Email, OTP and purpose are required.' });
    }

    if (purpose === 'register') {
      // Check in-memory store first (for new users not yet in DB)
      const pendingKey = email.toLowerCase();
      const pending = global._pendingOtps?.[pendingKey];

      // Also check if user exists (re-registration attempt)
      const existingUser = await User.findOne({ email }).select('+otp +otpExpiry');

      if (existingUser) {
        if (
          existingUser.otp !== otp ||
          !existingUser.otpExpiry ||
          existingUser.otpExpiry < new Date()
        ) {
          return res
            .status(400)
            .json({ success: false, message: 'Invalid or expired OTP.' });
        }
        existingUser.isEmailVerified = true;
        existingUser.otp = undefined;
        existingUser.otpExpiry = undefined;
        await existingUser.save({ validateBeforeSave: false });
        return res.status(200).json({ success: true, message: 'Email verified.' });
      }

      if (!pending || pending.otp !== otp || pending.otpExpiry < new Date()) {
        return res
          .status(400)
          .json({ success: false, message: 'Invalid or expired OTP.' });
      }

      // Mark as verified in pending map
      global._pendingOtps[pendingKey].verified = true;
      return res.status(200).json({ success: true, message: 'Email verified.' });
    }

    // For forgot-password and email-change: OTP is stored on the user doc
    const user = await User.findOne({ email }).select('+otp +otpExpiry');
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found.' });
    }

    if (!user.otp || user.otp !== otp) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid OTP.' });
    }

    if (!user.otpExpiry || user.otpExpiry < new Date()) {
      return res
        .status(400)
        .json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }

    // Clear OTP after successful verification
    user.otp = undefined;
    user.otpExpiry = undefined;

    if (purpose === 'forgot-password') {
      // Mark a temporary flag so reset-password endpoint knows OTP was verified
      user.otp = 'VERIFIED';
    }

    await user.save({ validateBeforeSave: false });

    return res.status(200).json({ success: true, message: 'OTP verified successfully.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
