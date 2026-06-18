const express = require('express');
const Coupon = require('../models/Coupon');
const { protect, checkAccountStatus, authorizeRoles } = require('../middleware/auth');

const router = express.Router();


router.post('/validate', protect, checkAccountStatus, authorizeRoles('customer'), async (req, res) => {
  try {
    const { code, orderTotal } = req.body;
    if (!code) return res.status(400).json({ success: false, message: 'Coupon code is required.' });

    const coupon = await Coupon.findOne({ code: code.toUpperCase().trim() });
    if (!coupon) return res.status(404).json({ success: false, message: 'Invalid coupon code.' });
    if (!coupon.isActive) return res.status(400).json({ success: false, message: 'This coupon is no longer active.' });
    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: 'This coupon has expired.' });
    }
    if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
      return res.status(400).json({ success: false, message: 'This coupon has reached its usage limit.' });
    }
    if (orderTotal < coupon.minOrderValue) {
      return res.status(400).json({
        success: false,
        message: `Minimum order value for this coupon is ₹${coupon.minOrderValue}.`,
      });
    }

    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = (orderTotal * coupon.discountValue) / 100;
    } else {
      discount = coupon.discountValue;
    }
    discount = Math.min(discount, orderTotal); // cap discount

    res.status(200).json({
      success: true,
      message: 'Coupon applied successfully!',
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discount: Math.round(discount * 100) / 100,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/coupons
 * List all coupons (superadmin only)
 * @access Private (superadmin)
 */
router.get('/', protect, checkAccountStatus, authorizeRoles('superadmin'), async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: coupons.length, coupons });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/coupons
 * Create a new coupon (superadmin only)
 * @access Private (superadmin)
 */
router.post('/', protect, checkAccountStatus, authorizeRoles('superadmin'), async (req, res) => {
  try {
    const { code, discountType, discountValue, minOrderValue, maxUses, expiresAt } = req.body;
    if (!code || !discountValue) {
      return res.status(400).json({ success: false, message: 'Code and discount value are required.' });
    }
    const coupon = await Coupon.create({
      code,
      discountType,
      discountValue,
      minOrderValue,
      maxUses,
      expiresAt,
      createdBy: req.user._id,
    });
    res.status(201).json({ success: true, message: 'Coupon created.', coupon });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'Coupon code already exists.' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * DELETE /api/coupons/:id
 * Delete a coupon (superadmin only)
 * @access Private (superadmin)
 */
router.delete('/:id', protect, checkAccountStatus, authorizeRoles('superadmin'), async (req, res) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Coupon deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
